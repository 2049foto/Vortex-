/**
 * Vortex Protocol - Portfolio Service
 * Scan wallet and fetch token holdings across chains
 * 
 * IMPROVEMENTS (Phase 1.1):
 * - Proper Moralis pagination with cursor handling
 * - Detailed error handling and logging
 * - DexScreener price fallback for tokens with price = 0
 * - Native token detection (ETH, POL, BNB, etc.)
 * - API health check verification
 */

import { env } from '../config/env';
import { getSupportedChainIds } from '../blockchain/chains';
import { getTokenBalance, getEthBalance } from '../blockchain/rpc';
import { createLogger } from '../utils/logger';
import { retry } from '../utils/helpers';
import { TIMEOUTS, CACHE_TTL, RETRY_CONFIG } from '../config/constants';

const logger = createLogger('portfolio');

import { cacheGet, cacheSet } from '../lib/safeCache';

// ============================================
// MORALIS API ERROR TYPES
// ============================================
interface MoralisErrorResponse {
  message?: string;
  code?: string;
  statusCode?: number;
}

interface MoralisTokenResponse {
  result: any[];
  cursor?: string | null;
  page?: number;
  page_size?: number;
}

// ============================================
// DEXSCREENER TYPES
// ============================================
interface DexScreenerPair {
  priceUsd?: string;
  liquidity?: { usd?: number };
  volume?: { h24?: number };
}

interface DexScreenerResponse {
  pairs?: DexScreenerPair[];
}

export interface TokenHolding {
  chainId: number;
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  balance: string; // Raw balance
  balanceFormatted: string;
  priceUsd: number;
  valueUsd: number;
  logoUrl?: string;
  liquidityUsd?: number;
  volume24hUsd?: number;
  priceSource?: 'moralis' | 'dexscreener' | 'coingecko' | 'fallback';
}

// ============================================
// DEXSCREENER PRICE FALLBACK
// ============================================

/**
 * Chain ID to DexScreener chain name mapping
 */
const DEXSCREENER_CHAIN_MAP: Record<number, string> = {
  1: 'ethereum',
  8453: 'base',
  42161: 'arbitrum',
  10: 'optimism',
  137: 'polygon',
  56: 'bsc',
  43114: 'avalanche',
  324: 'zksync',
};

/**
 * Fetch token price from DexScreener as fallback when Moralis price is 0
 * DexScreener is free and doesn't require an API key
 */
async function fetchPriceFromDexScreener(
  chainId: number,
  tokenAddress: string
): Promise<{ priceUsd: number; liquidityUsd: number; volume24hUsd: number } | null> {
  try {
    const chain = DEXSCREENER_CHAIN_MAP[chainId];
    if (!chain) {
      logger.debug({ chainId }, 'Chain not supported by DexScreener');
      return null;
    }

    // Check cache first
    const cacheKey = `dexscreener:${chainId}:${tokenAddress.toLowerCase()}`;
    const cached = await cacheGet<{ priceUsd: number; liquidityUsd: number; volume24hUsd: number }>(cacheKey);
    if (cached) {
      return cached;
    }

    const response = await fetch(
      `https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`,
      {
        signal: AbortSignal.timeout(3000), // Quick timeout for price lookup
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      logger.debug({ chainId, tokenAddress, status: response.status }, 'DexScreener API error');
      return null;
    }

    const data: DexScreenerResponse = await response.json();
    
    // Find the best pair (highest liquidity on our target chain)
    const relevantPairs = (data.pairs || []).filter(
      (pair: any) => pair.chainId?.toLowerCase() === chain.toLowerCase()
    );
    
    if (relevantPairs.length === 0) {
      // Try any chain if specific chain not found
      if (data.pairs && data.pairs.length > 0) {
        const bestPair = data.pairs.sort((a: any, b: any) => 
          (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0)
        )[0];
        
        const result = {
          priceUsd: parseFloat(bestPair.priceUsd || '0'),
          liquidityUsd: bestPair.liquidity?.usd || 0,
          volume24hUsd: bestPair.volume?.h24 || 0,
        };
        
        // Cache for 1 minute
        await cacheSet(cacheKey, result, 60);
        
        logger.debug({ chainId, tokenAddress, price: result.priceUsd }, 'DexScreener price found (cross-chain)');
        return result;
      }
      return null;
    }

    // Get best pair by liquidity
    const bestPair = relevantPairs.sort((a: any, b: any) => 
      (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0)
    )[0];

    const result = {
      priceUsd: parseFloat(bestPair.priceUsd || '0'),
      liquidityUsd: bestPair.liquidity?.usd || 0,
      volume24hUsd: bestPair.volume?.h24 || 0,
    };

    // Cache for 1 minute
    await cacheSet(cacheKey, result, 60);

    logger.debug({ chainId, tokenAddress, price: result.priceUsd }, 'DexScreener price fetched');
    return result;
  } catch (error) {
    logger.debug({ error, chainId, tokenAddress }, 'DexScreener fetch failed');
    return null;
  }
}

/**
 * Batch fetch prices from DexScreener for multiple tokens
 * More efficient than fetching one by one
 */
async function batchFetchPricesFromDexScreener(
  tokens: { chainId: number; address: string }[]
): Promise<Map<string, { priceUsd: number; liquidityUsd: number; volume24hUsd: number }>> {
  const results = new Map<string, { priceUsd: number; liquidityUsd: number; volume24hUsd: number }>();
  
  // DexScreener allows up to 30 tokens per request
  const BATCH_SIZE = 30;
  const batches: { chainId: number; address: string }[][] = [];
  
  for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
    batches.push(tokens.slice(i, i + BATCH_SIZE));
  }

  for (const batch of batches) {
    // Fetch in parallel for each batch
    const promises = batch.map(async (token) => {
      const key = `${token.chainId}:${token.address.toLowerCase()}`;
      const price = await fetchPriceFromDexScreener(token.chainId, token.address);
      if (price) {
        results.set(key, price);
      }
    });
    
    await Promise.allSettled(promises);
    
    // Small delay between batches to be nice to the API
    if (batches.length > 1) {
      await new Promise(r => setTimeout(r, 100));
    }
  }

  return results;
}

/**
 * Fetch token holdings via Moralis (EVM chains)
 * IMPROVED: Full pagination, error handling, DexScreener price fallback
 */
async function fetchTokensViaMoralis(
  walletAddress: string,
  chainId: number
): Promise<TokenHolding[]> {
  try {
    // Map chain ID to Moralis chain name
    const chainMap: Record<number, string> = {
      1: 'eth',
      8453: 'base',
      42161: 'arbitrum',
      10: 'optimism',
      137: 'polygon',
      56: 'bsc',
      43114: 'avalanche',
      324: 'zksync',
    };

    const chain = chainMap[chainId];
    if (!chain) {
      logger.info({ chainId }, 'Chain not supported by Moralis, using Alchemy fallback');
      return await fetchTokensViaAlchemy(walletAddress, chainId);
    }

    // Check if Moralis API key is configured
    if (!env.MORALIS_API_KEY) {
      logger.warn({ chainId }, 'Moralis API key not configured, using Alchemy fallback');
      return await fetchTokensViaAlchemy(walletAddress, chainId);
    }

    const baseUrl = env.NEXT_PUBLIC_MORALIS_API_URL || 'https://deep-index.moralis.io/api/v2.2';
    const allResults: any[] = [];
    let cursor: string | null = null;
    let pageCount = 0;
    const MAX_PAGES = 5; // Safety limit to prevent infinite loops

    // Paginated fetching
    do {
      const url = new URL(`${baseUrl}/${walletAddress}/erc20`);
      url.searchParams.set('chain', chain);
      url.searchParams.set('exclude_spam', 'false');
      url.searchParams.set('exclude_native', 'false');
      if (cursor) {
        url.searchParams.set('cursor', cursor);
      }

      logger.info({ chainId, pageCount, cursor: cursor?.slice(0, 20) || 'initial' }, 'Fetching Moralis page');

      const response = await fetch(url.toString(), {
        headers: {
          'X-API-Key': env.MORALIS_API_KEY,
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(TIMEOUTS.API),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error({ 
          chainId, 
          status: response.status, 
          error: errorText.slice(0, 200),
          apiKeyPrefix: env.MORALIS_API_KEY?.slice(0, 10)
        }, 'Moralis API error');
        
        // On first page failure, try Alchemy
        if (pageCount === 0) {
          return await fetchTokensViaAlchemy(walletAddress, chainId);
        }
        break; // Use what we have
      }

      const data = await response.json();
      
      if (data.result && Array.isArray(data.result)) {
        allResults.push(...data.result);
      }
      
      cursor = data.cursor || null;
      pageCount++;
      
      logger.info({ 
        chainId, 
        pageCount,
        pageResults: data.result?.length || 0,
        totalSoFar: allResults.length,
        hasMore: !!cursor
      }, 'Moralis page fetched');

    } while (cursor && pageCount < MAX_PAGES);

    logger.info({ 
      chainId, 
      totalResults: allResults.length,
      pagesUsed: pageCount
    }, 'Moralis pagination complete');

    // Process tokens
    const tokens: TokenHolding[] = [];
    const tokensNeedingPrice: Array<{ token: TokenHolding; address: string }> = [];
    
    for (const token of allResults) {
      const balance = BigInt(token.balance || '0');
      if (balance === 0n) continue;

      const decimals = parseInt(token.decimals || '18');
      const balanceFormatted = (Number(balance) / 10 ** decimals).toString();
      const priceUsd = parseFloat(token.usd_price || '0');
      const valueUsd = parseFloat(token.usd_value || '0') || (parseFloat(balanceFormatted) * priceUsd);

      const holding: TokenHolding = {
        chainId,
        address: token.token_address,
        symbol: token.symbol || 'UNKNOWN',
        name: token.name || 'Unknown Token',
        decimals,
        balance: balance.toString(),
        balanceFormatted,
        priceUsd,
        valueUsd,
        logoUrl: token.logo || token.thumbnail,
        liquidityUsd: 0,
        volume24hUsd: 0,
      };

      tokens.push(holding);

      // Track tokens without price for DexScreener fallback
      if (priceUsd === 0 && parseFloat(balanceFormatted) > 0) {
        tokensNeedingPrice.push({ token: holding, address: token.token_address });
      }
    }

    // DexScreener price fallback for tokens without price
    if (tokensNeedingPrice.length > 0 && tokensNeedingPrice.length <= 10) {
      logger.info({ chainId, count: tokensNeedingPrice.length }, 'Fetching DexScreener prices');
      await fetchDexScreenerPrices(tokensNeedingPrice, chainId);
    }

    logger.info({ chainId, tokensFound: tokens.length }, 'Moralis fetch complete');
    
    // Supplement with Alchemy if needed
    if (tokens.length < 3 && env.NEXT_PUBLIC_ALCHEMY_API_KEY) {
      logger.info({ chainId }, 'Low token count, supplementing with Alchemy');
      try {
        const alchemyTokens = await fetchTokensViaAlchemy(walletAddress, chainId);
        const existingAddresses = new Set(tokens.map(t => t.address.toLowerCase()));
        for (const t of alchemyTokens) {
          if (!existingAddresses.has(t.address.toLowerCase())) {
            tokens.push(t);
          }
        }
      } catch (e) {
        // Ignore Alchemy errors
      }
    }
    
    return tokens;
  } catch (error) {
    logger.error({ error, walletAddress, chainId }, 'Moralis fetch failed, trying Alchemy');
    return await fetchTokensViaAlchemy(walletAddress, chainId);
  }
}

/**
 * Fetch prices from DexScreener for tokens without Moralis price
 */
async function fetchDexScreenerPrices(
  tokensNeedingPrice: Array<{ token: TokenHolding; address: string }>,
  chainId: number
): Promise<void> {
  try {
    const chainNames: Record<number, string> = {
      1: 'ethereum',
      8453: 'base',
      42161: 'arbitrum',
      10: 'optimism',
      137: 'polygon',
      56: 'bsc',
      43114: 'avalanche',
      324: 'zksync',
    };
    
    const chain = chainNames[chainId];
    if (!chain) return;

    // Batch addresses (DexScreener allows multiple)
    const addresses = tokensNeedingPrice.map(t => t.address).join(',');
    
    const response = await fetch(
      `https://api.dexscreener.com/latest/dex/tokens/${addresses}`,
      { signal: AbortSignal.timeout(5000) }
    );

    if (!response.ok) return;

    const data = await response.json();
    
    // Map results back to tokens
    for (const pair of data.pairs || []) {
      if (pair.chainId !== chain) continue;
      
      const tokenInfo = tokensNeedingPrice.find(
        t => t.address.toLowerCase() === pair.baseToken?.address?.toLowerCase()
      );
      
      if (tokenInfo && pair.priceUsd) {
        const price = parseFloat(pair.priceUsd);
        tokenInfo.token.priceUsd = price;
        tokenInfo.token.valueUsd = parseFloat(tokenInfo.token.balanceFormatted) * price;
        logger.debug({ 
          symbol: tokenInfo.token.symbol, 
          price 
        }, 'DexScreener price applied');
      }
    }
  } catch (error) {
    logger.warn({ error }, 'DexScreener price fetch failed');
  }
}

/**
 * Fallback: Fetch tokens via Alchemy (for chains not on Moralis)
 * IMPROVED: Fetch metadata and prices for each token
 */
async function fetchTokensViaAlchemy(
  walletAddress: string,
  chainId: number
): Promise<TokenHolding[]> {
  try {
    if (!env.NEXT_PUBLIC_ALCHEMY_API_KEY) {
      logger.warn({ chainId }, 'Alchemy API key not configured');
      return [];
    }

    const alchemyUrls: Record<number, string> = {
      1: `https://eth-mainnet.g.alchemy.com/v2/${env.NEXT_PUBLIC_ALCHEMY_API_KEY}`,
      8453: `https://base-mainnet.g.alchemy.com/v2/${env.NEXT_PUBLIC_ALCHEMY_API_KEY}`,
      42161: `https://arb-mainnet.g.alchemy.com/v2/${env.NEXT_PUBLIC_ALCHEMY_API_KEY}`,
      10: `https://opt-mainnet.g.alchemy.com/v2/${env.NEXT_PUBLIC_ALCHEMY_API_KEY}`,
      137: `https://polygon-mainnet.g.alchemy.com/v2/${env.NEXT_PUBLIC_ALCHEMY_API_KEY}`,
      324: `https://zksync-mainnet.g.alchemy.com/v2/${env.NEXT_PUBLIC_ALCHEMY_API_KEY}`,
      56: `https://bnb-mainnet.g.alchemy.com/v2/${env.NEXT_PUBLIC_ALCHEMY_API_KEY}`,
      43114: `https://avax-mainnet.g.alchemy.com/v2/${env.NEXT_PUBLIC_ALCHEMY_API_KEY}`,
    };

    const baseUrl = alchemyUrls[chainId];
    if (!baseUrl) {
      logger.warn({ chainId }, 'Chain not supported by Alchemy');
      return [];
    }

    // Get token balances
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'alchemy_getTokenBalances',
        params: [walletAddress, 'erc20'], // Get all ERC20 tokens
      }),
      signal: AbortSignal.timeout(TIMEOUTS.API),
    });

    const data = await response.json();
    const tokenBalances = data.result?.tokenBalances || [];
    
    logger.info({ chainId, rawTokenCount: tokenBalances.length }, 'Alchemy raw token count');

    // Filter non-zero balances and limit to 100 tokens
    const nonZeroBalances = tokenBalances
      .filter((tb: any) => tb.tokenBalance && tb.tokenBalance !== '0x0' && tb.tokenBalance !== '0x')
      .slice(0, 100);

    if (nonZeroBalances.length === 0) {
      return [];
    }

    // Batch fetch metadata for all tokens
    const metadataResponse = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 2,
        method: 'alchemy_getTokenMetadata',
        params: nonZeroBalances.map((tb: any) => tb.contractAddress),
      }),
      signal: AbortSignal.timeout(TIMEOUTS.API),
    });

    // Note: alchemy_getTokenMetadata might not support batch, fetch individually
    const tokens: TokenHolding[] = [];
    
    for (const tb of nonZeroBalances) {
      try {
        const balance = BigInt(tb.tokenBalance);
        if (balance === 0n) continue;

        // Try to get metadata
        let symbol = 'UNKNOWN';
        let name = 'Unknown Token';
        let decimals = 18;
        let logo: string | undefined;

        try {
          const metaRes = await fetch(baseUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              id: 1,
              method: 'alchemy_getTokenMetadata',
              params: [tb.contractAddress],
            }),
            signal: AbortSignal.timeout(3000), // Quick timeout
          });
          const metaData = await metaRes.json();
          if (metaData.result) {
            symbol = metaData.result.symbol || symbol;
            name = metaData.result.name || name;
            decimals = metaData.result.decimals || decimals;
            logo = metaData.result.logo;
          }
        } catch (e) {
          // Ignore metadata errors
        }

        const balanceFormatted = (Number(balance) / 10 ** decimals).toString();
        
        tokens.push({
          chainId,
          address: tb.contractAddress,
          symbol,
          name,
          decimals,
          balance: balance.toString(),
          balanceFormatted,
          priceUsd: 0, // Alchemy doesn't provide prices
          valueUsd: 0,
          logoUrl: logo,
          liquidityUsd: 0,
          volume24hUsd: 0,
        });
      } catch (e) {
        // Skip problematic tokens
      }
    }

    logger.info({ chainId, tokensFound: tokens.length }, 'Alchemy fetch success');
    return tokens;
  } catch (error) {
    logger.error({ error, walletAddress, chainId }, 'Alchemy fetch failed');
    return [];
  }
}

/**
 * Fetch Solana tokens via Helius API
 */
async function fetchSolanaTokensViaHelius(
  walletAddress: string
): Promise<TokenHolding[]> {
  try {
    const heliusApiKey = env.NEXT_PUBLIC_HELIUS_API_KEY;
    if (!heliusApiKey) {
      logger.warn('Helius API key not configured');
      return [];
    }

    const response = await fetch(
      `https://api.helius.xyz/v0/addresses/${walletAddress}/balances?api-key=${heliusApiKey}`,
      {
        signal: AbortSignal.timeout(TIMEOUTS.API),
      }
    );

    if (!response.ok) {
      throw new Error(`Helius API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    const tokens: TokenHolding[] = [];
    
    // Native SOL balance
    if (data.nativeBalance) {
      const solPrice = await getSolanaPrice();
      const solBalance = data.nativeBalance / 1e9; // lamports to SOL
      tokens.push({
        chainId: 0, // Solana special identifier
        address: 'So11111111111111111111111111111111111111112', // Wrapped SOL
        symbol: 'SOL',
        name: 'Solana',
        decimals: 9,
        balance: data.nativeBalance.toString(),
        balanceFormatted: solBalance.toString(),
        priceUsd: solPrice,
        valueUsd: solBalance * solPrice,
      });
    }

    // SPL tokens
    for (const token of data.tokens || []) {
      if (token.amount === 0) continue;
      
      const decimals = token.decimals || 9;
      const balanceFormatted = token.amount / (10 ** decimals);
      
      tokens.push({
        chainId: 0, // Solana
        address: token.mint,
        symbol: token.symbol || 'UNKNOWN',
        name: token.name || 'Unknown Token',
        decimals,
        balance: token.amount.toString(),
        balanceFormatted: balanceFormatted.toString(),
        priceUsd: token.price || 0,
        valueUsd: balanceFormatted * (token.price || 0),
        logoUrl: token.logoURI,
      });
    }

    logger.info({ tokensFound: tokens.length }, 'Helius Solana fetch success');
    return tokens;
  } catch (error) {
    logger.error({ error, walletAddress }, 'Helius Solana fetch failed');
    return [];
  }
}

/**
 * Get Solana price from CoinGecko
 */
async function getSolanaPrice(): Promise<number> {
  const cacheKey = 'price:solana';
  
  // Try cache first
  const cached = await cacheGet<number>(cacheKey);
  if (cached !== null) return cached;

  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd',
      { signal: AbortSignal.timeout(TIMEOUTS.API) }
    );
    const data = await response.json();
    const price = data.solana?.usd || 0;
    
    // Cache for 1 minute
    await cacheSet(cacheKey, price, CACHE_TTL.TOKEN_PRICE);
    
    return price;
  } catch (error) {
    logger.warn({ error }, 'Solana price fetch failed, using fallback');
    return 200; // Fallback price
  }
}

/**
 * Fetch native token balance
 */
async function fetchNativeBalance(
  walletAddress: string,
  chainId: number
): Promise<TokenHolding | null> {
  try {
    const balance = await getEthBalance(chainId, walletAddress as `0x${string}`);
    const balanceBigInt = BigInt(balance);
    
    // Only return if balance > 0
    if (balanceBigInt === 0n) {
      return null;
    }
    
    // Get native token price from CoinGecko (may be 0 if API fails)
    const priceUsd = await getNativeTokenPrice(chainId);
    const balanceFormatted = (Number(balanceBigInt) / 1e18).toString();
    const valueUsd = parseFloat(balanceFormatted) * priceUsd; // May be 0 if price unavailable

    const nativeTokens: Record<number, { symbol: string; name: string }> = {
      1: { symbol: 'ETH', name: 'Ethereum' },
      8453: { symbol: 'ETH', name: 'Base' },
      42161: { symbol: 'ETH', name: 'Arbitrum' },
      10: { symbol: 'ETH', name: 'Optimism' },
      137: { symbol: 'MATIC', name: 'Polygon' },
      56: { symbol: 'BNB', name: 'BNB Chain' },
      43114: { symbol: 'AVAX', name: 'Avalanche' },
      324: { symbol: 'ETH', name: 'zkSync Era' },
      838592: { symbol: 'MONAD', name: 'Monad' },
    };

    const token = nativeTokens[chainId] || { symbol: 'ETH', name: 'Ethereum' };

    return {
      chainId,
      address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', // Native token sentinel
      symbol: token.symbol,
      name: token.name,
      decimals: 18,
      balance: balanceBigInt.toString(),
      balanceFormatted,
      priceUsd, // May be 0
      valueUsd, // May be 0 if price unavailable
      liquidityUsd: 0,
      volume24hUsd: 0,
    };
  } catch (error) {
    logger.error({ error, walletAddress, chainId }, 'Native balance fetch failed');
    return null;
  }
}

/**
 * Get native token price from CoinGecko
 */
async function getNativeTokenPrice(chainId: number): Promise<number> {
  const cacheKey = `price:native:${chainId}`;
  
  // Check cache
  const cached = await cacheGet<number>(cacheKey);
  if (cached !== null) {
    return cached;
  }

  try {
    const coinIds: Record<number, string> = {
      1: 'ethereum',
      8453: 'ethereum',
      42161: 'ethereum',
      10: 'ethereum',
      137: 'matic-network',
      56: 'binancecoin',
      43114: 'avalanche-2',
      324: 'ethereum',
      838592: 'ethereum', // Monad uses ETH-like pricing for now
    };

    const coinId = coinIds[chainId] || 'ethereum';

    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`,
      {
        signal: AbortSignal.timeout(TIMEOUTS.API),
      }
    );

    if (!response.ok) {
      throw new Error('CoinGecko API error');
    }

    const data = await response.json();
    const price = data[coinId]?.usd || 0;

    // Cache for 1 minute
    await cacheSet(cacheKey, price, CACHE_TTL.TOKEN_PRICE);

    return price;
  } catch (error) {
    logger.warn({ error, chainId }, 'Price fetch failed, using fallback');
    // Fallback prices
    const fallbackPrices: Record<number, number> = {
      1: 3500, 8453: 3500, 42161: 3500, 10: 3500, 324: 3500,
      137: 0.8, 56: 600, 43114: 35, 838592: 0,
    };
    return fallbackPrices[chainId] || 0;
  }
}

/**
 * MAINNET CHAIN IDS ONLY - No testnets
 * Prioritized by speed and popularity
 */
const FAST_CHAINS = [
  8453,   // Base Mainnet (priority for Base grant)
  42161,  // Arbitrum One Mainnet
  10,     // Optimism Mainnet
  137,    // Polygon Mainnet
];

const SLOW_CHAINS = [
  1,      // Ethereum Mainnet (often slower/more expensive)
  56,     // BNB Smart Chain Mainnet
  43114,  // Avalanche C-Chain Mainnet
  324,    // zkSync Era Mainnet
];

const MAINNET_CHAIN_IDS = [...FAST_CHAINS, ...SLOW_CHAINS];

/**
 * Rate limiting configuration for API calls
 * Prevents exceeding Moralis/Alchemy API quotas
 */
const RATE_LIMIT_CONFIG = {
  MAX_CONCURRENT_CHAINS: 4,   // Max chains scanned simultaneously
  DELAY_BETWEEN_BATCHES: 200, // ms delay between batches
};

/**
 * Internal function to scan a single chain
 */
async function scanSingleChainInternal(
  walletAddress: string,
  chainId: number
): Promise<TokenHolding[]> {
  try {
    logger.info({ chainId, walletAddress: walletAddress.slice(0, 10) }, `Starting scan for chain ${chainId}`);
    
    // Fetch native + ERC20 tokens in parallel
    const [native, erc20] = await Promise.allSettled([
      fetchNativeBalance(walletAddress, chainId),
      fetchTokensViaMoralis(walletAddress, chainId),
    ]);

    const tokens: TokenHolding[] = [];

    if (native.status === 'fulfilled' && native.value) {
      const nativeBalance = parseFloat(native.value.balanceFormatted);
      if (nativeBalance > 0) {
        tokens.push(native.value);
        logger.debug({ chainId, nativeBalance }, `Found native balance`);
      }
    }

    if (erc20.status === 'fulfilled') {
      tokens.push(...erc20.value);
      logger.debug({ chainId, count: erc20.value.length }, `Found ERC20 tokens`);
    } else {
      // Try Alchemy as fallback (non-blocking)
      try {
        const alchemyTokens = await Promise.race([
          fetchTokensViaAlchemy(walletAddress, chainId),
          new Promise<TokenHolding[]>((resolve) => setTimeout(() => resolve([]), 3000)),
        ]);
        if (alchemyTokens.length > 0) {
          tokens.push(...alchemyTokens);
        }
      } catch (e) {
        // Ignore fallback errors
      }
    }

    logger.info({ chainId, totalTokens: tokens.length }, `Chain ${chainId} scan complete`);
    return tokens;
  } catch (error) {
    logger.error({ chainId, error }, `Chain ${chainId} scan error`);
    return [];
  }
}

/**
 * Scan wallet across all supported MAINNET chains (10 EVM + Solana)
 * IMPORTANT: Only scans mainnet tokens - testnet tokens are excluded
 */
export async function scanWallet(
  walletAddress: string,
  chainIds?: number[],
  options?: {
    includeSolana?: boolean;
    solanaAddress?: string;
  }
): Promise<TokenHolding[]> {
  // Use provided chainIds or default to ALL mainnet chains
  // Only filter out testnet chains if provided
  const requestedChains = chainIds || MAINNET_CHAIN_IDS;
  const evmChains = requestedChains.filter(id => 
    MAINNET_CHAIN_IDS.includes(id)
  );

  // If no valid chains, use all mainnet chains
  const finalChains = evmChains.length > 0 ? evmChains : MAINNET_CHAIN_IDS;

  logger.info({ 
    walletAddress, 
    requestedChains: requestedChains.length,
    finalChains: finalChains.length,
    chains: finalChains,
    includeSolana: options?.includeSolana 
  }, 'Scanning wallet across chains');

  // Per-chain timeout (8 seconds max per chain)
  const CHAIN_TIMEOUT = 8000;
  
  const scanChainWithTimeout = async (chainId: number): Promise<TokenHolding[]> => {
    return Promise.race([
      scanSingleChainInternal(walletAddress, chainId),
      new Promise<TokenHolding[]>((resolve) => {
        setTimeout(() => {
          logger.warn({ chainId }, `Chain ${chainId} timeout, skipping`);
          resolve([]);
        }, CHAIN_TIMEOUT);
      }),
    ]);
  };

  // Fetch EVM tokens with rate-limited concurrency
  // Process in batches to avoid exceeding API quotas
  const evmResults: PromiseSettledResult<TokenHolding[]>[] = [];
  
  for (let i = 0; i < finalChains.length; i += RATE_LIMIT_CONFIG.MAX_CONCURRENT_CHAINS) {
    const batch = finalChains.slice(i, i + RATE_LIMIT_CONFIG.MAX_CONCURRENT_CHAINS);
    const batchResults = await Promise.allSettled(batch.map(scanChainWithTimeout));
    evmResults.push(...batchResults);
    
    // Add delay between batches to prevent rate limiting
    if (i + RATE_LIMIT_CONFIG.MAX_CONCURRENT_CHAINS < finalChains.length) {
      await new Promise(r => setTimeout(r, RATE_LIMIT_CONFIG.DELAY_BETWEEN_BATCHES));
    }
  }

  // Flatten EVM results
  const allTokens: TokenHolding[] = [];
  let successfulChains = 0;
  
  evmResults.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      const chainTokens = result.value;
      allTokens.push(...chainTokens);
      successfulChains++;
      if (chainTokens.length > 0) {
        logger.info({ 
          chainId: finalChains[index], 
          tokensFound: chainTokens.length 
        }, `Chain completed`);
      }
    } else {
      logger.warn({ 
        chainId: finalChains[index], 
        error: result.reason?.message || 'unknown'
      }, `Chain failed`);
    }
  });
  
  logger.info({ successfulChains, totalChains: finalChains.length }, 'Chain scan summary');

  // Fetch Solana tokens if requested
  if (options?.includeSolana && options.solanaAddress) {
    try {
      const solanaTokens = await fetchSolanaTokensViaHelius(options.solanaAddress);
      allTokens.push(...solanaTokens);
      logger.info({ solanaTokens: solanaTokens.length }, 'Solana tokens added');
    } catch (error) {
      logger.error({ error }, 'Solana scan failed');
    }
  }

  // Filter out ONLY zero balance tokens
  // Include ALL tokens with balance > 0, even if valueUsd = 0 (for tokens without price data)
  const nonZeroTokens = allTokens.filter((token) => {
    const balance = parseFloat(token.balanceFormatted);
    // Only require positive balance - include all tokens with balance > 0
    // This ensures we scan ALL tokens, even if price data is unavailable
    return balance > 0;
  });

  // Sort by value (highest first)
  nonZeroTokens.sort((a, b) => b.valueUsd - a.valueUsd);

  logger.info(
    {
      walletAddress,
      totalTokens: nonZeroTokens.length,
      totalValue: nonZeroTokens.reduce((sum, t) => sum + t.valueUsd, 0).toFixed(2),
      chainsScanned: evmChains.length + (options?.includeSolana ? 1 : 0),
    },
    'Wallet scan complete'
  );

  return nonZeroTokens;
}

/**
 * Quick scan for a single chain
 */
export async function scanSingleChain(
  walletAddress: string,
  chainId: number
): Promise<TokenHolding[]> {
  if (chainId === 0) {
    // Solana
    return fetchSolanaTokensViaHelius(walletAddress);
  }
  
  const [native, erc20] = await Promise.allSettled([
    fetchNativeBalance(walletAddress, chainId),
    fetchTokensViaMoralis(walletAddress, chainId),
  ]);

  const tokens: TokenHolding[] = [];
  
  if (native.status === 'fulfilled' && native.value) {
    tokens.push(native.value);
  }
  
  if (erc20.status === 'fulfilled') {
    tokens.push(...erc20.value);
  }

  return tokens.filter(t => parseFloat(t.balanceFormatted) > 0);
}

/**
 * Get token metadata
 */
export async function getTokenMetadata(
  chainId: number,
  tokenAddress: string
): Promise<Partial<TokenHolding>> {
  const cacheKey = `metadata:${chainId}:${tokenAddress.toLowerCase()}`;

  // Check cache
  const cached = await cacheGet<Partial<TokenHolding>>(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    // Try Moralis for metadata
    const chainMap: Record<number, string> = {
      1: 'eth', 8453: 'base', 42161: 'arbitrum', 10: 'optimism',
      137: 'polygon', 56: 'bsc', 43114: 'avalanche', 324: 'zksync',
    };
    
    const chain = chainMap[chainId];
    if (chain && env.MORALIS_API_KEY) {
      try {
        const response = await fetch(
          `${env.NEXT_PUBLIC_MORALIS_API_URL || 'https://deep-index.moralis.io/api/v2.2'}/erc20/metadata?chain=${chain}&addresses[]=${tokenAddress}`,
          {
            headers: { 'X-API-Key': env.MORALIS_API_KEY },
            signal: AbortSignal.timeout(TIMEOUTS.API),
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data[0]) {
            const token = data[0];
            const metadata: Partial<TokenHolding> = {
              chainId,
              address: tokenAddress,
              symbol: token.symbol || 'UNKNOWN',
              name: token.name || 'Unknown Token',
              decimals: parseInt(token.decimals || '18'),
              logoUrl: token.logo || token.thumbnail,
            };
            
            // Cache for 30 minutes
            await cacheSet(cacheKey, metadata, CACHE_TTL.TOKEN_METADATA);
            return metadata;
          }
        }
      } catch (e) {
        logger.debug({ error: e }, 'Moralis metadata fetch failed');
      }
    }

    // Fallback metadata
    const metadata: Partial<TokenHolding> = {
      chainId,
      address: tokenAddress,
      symbol: 'UNKNOWN',
      name: 'Unknown Token',
      decimals: 18,
    };

    // Cache for 30 minutes
    await cacheSet(cacheKey, metadata, CACHE_TTL.TOKEN_METADATA);

    return metadata;
  } catch (error) {
    logger.error({ error, chainId, tokenAddress }, 'Metadata fetch failed');
    return {
      chainId,
      address: tokenAddress,
      symbol: 'UNKNOWN',
      name: 'Unknown Token',
      decimals: 18,
    };
  }
}

// ============================================
// API HEALTH CHECK
// ============================================

export interface ApiHealthCheckResult {
  moralis: {
    configured: boolean;
    working: boolean;
    error?: string;
    latencyMs?: number;
  };
  alchemy: {
    configured: boolean;
    working: boolean;
    error?: string;
    latencyMs?: number;
  };
  dexscreener: {
    configured: boolean; // Always true (no API key needed)
    working: boolean;
    error?: string;
    latencyMs?: number;
  };
  coingecko: {
    configured: boolean; // Always true (no API key needed for basic)
    working: boolean;
    error?: string;
    latencyMs?: number;
  };
  overall: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
}

/**
 * Verify that API keys are valid and services are reachable
 * This actually tests the APIs, not just checks if keys exist
 */
export async function checkApiHealth(): Promise<ApiHealthCheckResult> {
  const results: ApiHealthCheckResult = {
    moralis: { configured: false, working: false },
    alchemy: { configured: false, working: false },
    dexscreener: { configured: true, working: false }, // No API key needed
    coingecko: { configured: true, working: false }, // No API key needed for basic
    overall: 'unhealthy',
    timestamp: new Date().toISOString(),
  };

  // Test Moralis API
  if (env.MORALIS_API_KEY) {
    results.moralis.configured = true;
    const startTime = Date.now();
    try {
      // Use a known address to test the API (Vitalik's address)
      const testAddress = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
      const response = await fetch(
        `${env.NEXT_PUBLIC_MORALIS_API_URL || 'https://deep-index.moralis.io/api/v2.2'}/${testAddress}/erc20?chain=eth&limit=1`,
        {
          headers: {
            'X-API-Key': env.MORALIS_API_KEY,
            'Accept': 'application/json',
          },
          signal: AbortSignal.timeout(5000),
        }
      );
      
      results.moralis.latencyMs = Date.now() - startTime;
      
      if (response.ok) {
        const data = await response.json();
        // Verify we got a valid response structure
        if (data && typeof data === 'object') {
          results.moralis.working = true;
        } else {
          results.moralis.error = 'Invalid response format';
        }
      } else if (response.status === 401) {
        results.moralis.error = 'API key invalid or expired';
      } else if (response.status === 403) {
        results.moralis.error = 'API key lacks required permissions';
      } else if (response.status === 429) {
        results.moralis.error = 'Rate limit exceeded';
        results.moralis.working = true; // API is working, just rate limited
      } else {
        const errorText = await response.text().catch(() => 'Unknown error');
        results.moralis.error = `HTTP ${response.status}: ${errorText.slice(0, 100)}`;
      }
    } catch (error) {
      results.moralis.latencyMs = Date.now() - startTime;
      results.moralis.error = error instanceof Error ? error.message : 'Connection failed';
    }
  }

  // Test Alchemy API
  if (env.NEXT_PUBLIC_ALCHEMY_API_KEY) {
    results.alchemy.configured = true;
    const startTime = Date.now();
    try {
      const response = await fetch(
        `https://eth-mainnet.g.alchemy.com/v2/${env.NEXT_PUBLIC_ALCHEMY_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'eth_blockNumber',
            params: [],
          }),
          signal: AbortSignal.timeout(5000),
        }
      );
      
      results.alchemy.latencyMs = Date.now() - startTime;
      
      if (response.ok) {
        const data = await response.json();
        if (data.result && !data.error) {
          results.alchemy.working = true;
        } else {
          results.alchemy.error = data.error?.message || 'Invalid response';
        }
      } else {
        results.alchemy.error = `HTTP ${response.status}`;
      }
    } catch (error) {
      results.alchemy.latencyMs = Date.now() - startTime;
      results.alchemy.error = error instanceof Error ? error.message : 'Connection failed';
    }
  }

  // Test DexScreener API (no key needed)
  {
    const startTime = Date.now();
    try {
      // Test with WETH on Ethereum
      const response = await fetch(
        'https://api.dexscreener.com/latest/dex/tokens/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        {
          headers: { 'Accept': 'application/json' },
          signal: AbortSignal.timeout(5000),
        }
      );
      
      results.dexscreener.latencyMs = Date.now() - startTime;
      
      if (response.ok) {
        const data = await response.json();
        if (data.pairs && Array.isArray(data.pairs)) {
          results.dexscreener.working = true;
        } else {
          results.dexscreener.error = 'Invalid response format';
        }
      } else {
        results.dexscreener.error = `HTTP ${response.status}`;
      }
    } catch (error) {
      results.dexscreener.latencyMs = Date.now() - startTime;
      results.dexscreener.error = error instanceof Error ? error.message : 'Connection failed';
    }
  }

  // Test CoinGecko API (no key needed for basic)
  {
    const startTime = Date.now();
    try {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd',
        {
          signal: AbortSignal.timeout(5000),
        }
      );
      
      results.coingecko.latencyMs = Date.now() - startTime;
      
      if (response.ok) {
        const data = await response.json();
        if (data.ethereum?.usd) {
          results.coingecko.working = true;
        } else {
          results.coingecko.error = 'Invalid response format';
        }
      } else if (response.status === 429) {
        results.coingecko.error = 'Rate limit exceeded';
        results.coingecko.working = true; // API is working, just rate limited
      } else {
        results.coingecko.error = `HTTP ${response.status}`;
      }
    } catch (error) {
      results.coingecko.latencyMs = Date.now() - startTime;
      results.coingecko.error = error instanceof Error ? error.message : 'Connection failed';
    }
  }

  // Determine overall health
  const workingCount = [
    results.moralis.working || !results.moralis.configured, // OK if not configured
    results.alchemy.working || !results.alchemy.configured, // OK if not configured
    results.dexscreener.working,
    results.coingecko.working,
  ].filter(Boolean).length;

  // At least Moralis or Alchemy must be working for scanning
  const hasScanCapability = results.moralis.working || results.alchemy.working;

  if (hasScanCapability && workingCount >= 3) {
    results.overall = 'healthy';
  } else if (hasScanCapability) {
    results.overall = 'degraded';
  } else {
    results.overall = 'unhealthy';
  }

  logger.info({
    moralis: results.moralis.working,
    alchemy: results.alchemy.working,
    dexscreener: results.dexscreener.working,
    coingecko: results.coingecko.working,
    overall: results.overall,
  }, 'API health check completed');

  return results;
}
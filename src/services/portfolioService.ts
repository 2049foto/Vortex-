/**
 * Vortex Protocol - Portfolio Service
 * Scan wallet and fetch token holdings across chains
 */

import { env } from '../config/env';
import { getSupportedChainIds } from '../blockchain/chains';
import { getTokenBalance, getEthBalance } from '../blockchain/rpc';
import { createLogger } from '../utils/logger';
import { retry } from '../utils/helpers';
import { TIMEOUTS, CACHE_TTL } from '../config/constants';

const logger = createLogger('portfolio');

import { cacheGet, cacheSet } from '../lib/safeCache';

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
}

/**
 * Fetch token holdings via Moralis (EVM chains)
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
      324: 'zksync', // zkSync Era
      // 838592: Monad - not yet supported by Moralis, will use Alchemy fallback
    };

    const chain = chainMap[chainId];
    if (!chain) {
      logger.info({ chainId }, 'Chain not supported by Moralis, using Alchemy fallback');
      return await fetchTokensViaAlchemy(walletAddress, chainId);
    }

    const response = await fetch(
      `${env.NEXT_PUBLIC_MORALIS_API_URL || 'https://deep-index.moralis.io/api/v2.2'}/${walletAddress}/erc20?chain=${chain}`,
      {
        headers: {
          'X-API-Key': env.MORALIS_API_KEY,
        },
        signal: AbortSignal.timeout(TIMEOUTS.API),
      }
    );

    if (!response.ok) {
      throw new Error(`Moralis API error: ${response.statusText}`);
    }

    const data = await response.json();

    const tokens: TokenHolding[] = (data.result || [])
      .filter((token: any) => {
        // Filter out zero balance tokens at source
        const balance = BigInt(token.balance || '0');
        return balance > 0n;
      })
      .map((token: any) => {
        const decimals = parseInt(token.decimals || '18');
        const balance = BigInt(token.balance || '0');
        const balanceFormatted = (Number(balance) / 10 ** decimals).toString();
        const priceUsd = parseFloat(token.usd_price || '0');
        const valueUsd = parseFloat(token.usd_value || '0') || (parseFloat(balanceFormatted) * priceUsd);

        return {
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
      });

    logger.info({ chainId, tokensFound: tokens.length, totalFromAPI: data.result?.length || 0 }, 'Moralis fetch success');
    return tokens;
  } catch (error) {
    logger.error({ error, walletAddress, chainId }, 'Moralis fetch failed');
    return [];
  }
}

/**
 * Fallback: Fetch tokens via Alchemy (for chains not on Moralis)
 */
async function fetchTokensViaAlchemy(
  walletAddress: string,
  chainId: number
): Promise<TokenHolding[]> {
  try {
    const alchemyUrls: Record<number, string> = {
      1: `https://eth-mainnet.g.alchemy.com/v2/${env.NEXT_PUBLIC_ALCHEMY_API_KEY}`,
      8453: `https://base-mainnet.g.alchemy.com/v2/${env.NEXT_PUBLIC_ALCHEMY_API_KEY}`,
      42161: `https://arb-mainnet.g.alchemy.com/v2/${env.NEXT_PUBLIC_ALCHEMY_API_KEY}`,
      10: `https://opt-mainnet.g.alchemy.com/v2/${env.NEXT_PUBLIC_ALCHEMY_API_KEY}`,
      137: `https://polygon-mainnet.g.alchemy.com/v2/${env.NEXT_PUBLIC_ALCHEMY_API_KEY}`,
      324: `https://zksync-mainnet.g.alchemy.com/v2/${env.NEXT_PUBLIC_ALCHEMY_API_KEY}`,
      // 838592: Monad - Alchemy may not support yet, will try RPC fallback
    };

    const baseUrl = alchemyUrls[chainId];
    if (!baseUrl) {
      // For unsupported chains like Monad, return empty for now
      // Monad mainnet RPC token scanning requires custom implementation
      logger.warn({ chainId }, 'Chain not supported by Alchemy, returning empty');
      return [];
    }

    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'alchemy_getTokenBalances',
        params: [walletAddress],
      }),
      signal: AbortSignal.timeout(TIMEOUTS.API),
    });

    const data = await response.json();
    const tokenBalances = data.result?.tokenBalances || [];

    // Fetch metadata for each token
    const tokens: TokenHolding[] = [];
    for (const tb of tokenBalances.slice(0, 50)) { // Limit to 50 tokens
      if (tb.tokenBalance === '0x0') continue;
      
      const balance = BigInt(tb.tokenBalance).toString();
      tokens.push({
        chainId,
        address: tb.contractAddress,
        symbol: 'UNKNOWN',
        name: 'Unknown Token',
        decimals: 18,
        balance,
        balanceFormatted: (Number(balance) / 1e18).toString(),
        priceUsd: 0,
        valueUsd: 0,
      });
    }

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
 * 10 EVM Chains + Solana = 11 total chains
 */
const MAINNET_CHAIN_IDS = [
  1,      // Ethereum Mainnet
  8453,   // Base Mainnet  
  42161,  // Arbitrum One Mainnet
  10,     // Optimism Mainnet
  137,    // Polygon Mainnet
  56,     // BNB Smart Chain Mainnet
  43114,  // Avalanche C-Chain Mainnet
  324,    // zkSync Era Mainnet
  838592, // Monad Mainnet
];

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

  // Fetch EVM tokens from all chains in parallel
  const evmResults = await Promise.allSettled(
    finalChains.map(async (chainId) => {
      try {
        logger.info({ chainId, walletAddress }, `Starting scan for chain ${chainId}`);
        
        // Fetch native + ERC20 tokens
        const [native, erc20] = await Promise.allSettled([
          fetchNativeBalance(walletAddress, chainId),
          fetchTokensViaMoralis(walletAddress, chainId),
        ]);

        const tokens: TokenHolding[] = [];

        if (native.status === 'fulfilled' && native.value) {
          const nativeBalance = parseFloat(native.value.balanceFormatted);
          if (nativeBalance > 0) {
            tokens.push(native.value);
            logger.info({ chainId, nativeBalance }, `Found native balance for chain ${chainId}`);
          }
        } else if (native.status === 'rejected') {
          logger.warn({ chainId, error: native.reason }, `Native balance fetch failed for chain ${chainId}`);
        }

        if (erc20.status === 'fulfilled') {
          const erc20Count = erc20.value.length;
          tokens.push(...erc20.value);
          logger.info({ chainId, erc20Count }, `Found ${erc20Count} ERC20 tokens for chain ${chainId}`);
        } else if (erc20.status === 'rejected') {
          logger.warn({ chainId, error: erc20.reason }, `ERC20 fetch failed for chain ${chainId}, trying Alchemy fallback`);
          // Try Alchemy as fallback
          try {
            const alchemyTokens = await fetchTokensViaAlchemy(walletAddress, chainId);
            if (alchemyTokens.length > 0) {
              tokens.push(...alchemyTokens);
              logger.info({ chainId, alchemyCount: alchemyTokens.length }, `Alchemy fallback found ${alchemyTokens.length} tokens`);
            }
          } catch (alchemyError) {
            logger.error({ chainId, error: alchemyError }, `Alchemy fallback also failed`);
          }
        }

        logger.info({ chainId, totalTokens: tokens.length }, `Chain ${chainId} scan complete`);
        return tokens;
      } catch (error) {
        logger.error({ chainId, error }, `Chain ${chainId} scan error`);
        return [];
      }
    })
  );

  // Flatten EVM results and log details
  const allTokens: TokenHolding[] = [];
  evmResults.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      const chainTokens = result.value;
      allTokens.push(...chainTokens);
      logger.info({ 
        chainId: finalChains[index], 
        tokensFound: chainTokens.length 
      }, `Chain ${finalChains[index]} completed`);
    } else {
      logger.error({ 
        chainId: finalChains[index], 
        error: result.reason 
      }, `Chain ${finalChains[index]} failed`);
    }
  });

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


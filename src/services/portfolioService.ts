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
import { Redis } from '@upstash/redis';

const logger = createLogger('portfolio');

const redis = new Redis({
  url: env.UPSTASH_REDIS_REST_URL,
  token: env.UPSTASH_REDIS_REST_TOKEN,
});

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
      // Monad not yet supported by Moralis
    };

    const chain = chainMap[chainId];
    if (!chain) {
      logger.warn({ chainId }, 'Chain not supported by Moralis, using fallback');
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

    const tokens: TokenHolding[] = (data.result || []).map((token: any) => ({
      chainId,
      address: token.token_address,
      symbol: token.symbol,
      name: token.name,
      decimals: parseInt(token.decimals),
      balance: token.balance,
      balanceFormatted: (
        parseInt(token.balance) /
        10 ** parseInt(token.decimals)
      ).toString(),
      priceUsd: parseFloat(token.usd_price || '0'),
      valueUsd: parseFloat(token.usd_value || '0'),
      logoUrl: token.logo || token.thumbnail,
      liquidityUsd: 0,
      volume24hUsd: 0,
    }));

    logger.info({ chainId, tokensFound: tokens.length }, 'Moralis fetch success');
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
    };

    const baseUrl = alchemyUrls[chainId];
    if (!baseUrl) {
      logger.warn({ chainId }, 'Chain not supported by Alchemy');
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
  
  try {
    const cached = await redis.get(cacheKey);
    if (cached) return parseFloat(cached as string);
  } catch (e) {}

  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd',
      { signal: AbortSignal.timeout(TIMEOUTS.API) }
    );
    const data = await response.json();
    const price = data.solana?.usd || 0;
    
    try {
      await redis.setex(cacheKey, CACHE_TTL.TOKEN_PRICE, price.toString());
    } catch (e) {}
    
    return price;
  } catch (error) {
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
    
    // Get native token price from CoinGecko
    const priceUsd = await getNativeTokenPrice(chainId);
    const balanceFormatted = (Number(balance) / 1e18).toFixed(18);
    const valueUsd = parseFloat(balanceFormatted) * priceUsd;

    const nativeTokens: Record<number, { symbol: string; name: string }> = {
      1: { symbol: 'ETH', name: 'Ethereum' },
      8453: { symbol: 'ETH', name: 'Ethereum' },
      42161: { symbol: 'ETH', name: 'Ethereum' },
      10: { symbol: 'ETH', name: 'Ethereum' },
      137: { symbol: 'MATIC', name: 'Polygon' },
      56: { symbol: 'BNB', name: 'BNB' },
      43114: { symbol: 'AVAX', name: 'Avalanche' },
    };

    const token = nativeTokens[chainId] || { symbol: 'ETH', name: 'Ethereum' };

    return {
      chainId,
      address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', // Native token sentinel
      symbol: token.symbol,
      name: token.name,
      decimals: 18,
      balance: balance.toString(),
      balanceFormatted,
      priceUsd,
      valueUsd,
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
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      return parseFloat(cached as string);
    }
  } catch (error) {
    logger.warn({ error }, 'Cache read failed');
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
    try {
      await redis.setex(cacheKey, CACHE_TTL.TOKEN_PRICE, price.toString());
    } catch (error) {
      logger.warn({ error }, 'Cache write failed');
    }

    return price;
  } catch (error) {
    logger.error({ error, chainId }, 'Price fetch failed');
    return 0;
  }
}

/**
 * Scan wallet across all supported chains (10 EVM + Solana)
 */
export async function scanWallet(
  walletAddress: string,
  chainIds?: number[],
  options?: {
    includeSolana?: boolean;
    solanaAddress?: string;
  }
): Promise<TokenHolding[]> {
  // Default to all EVM chains
  const evmChains = chainIds || [1, 8453, 42161, 10, 137, 56, 43114, 324, 838592];

  logger.info({ walletAddress, evmChains, includeSolana: options?.includeSolana }, 'Scanning wallet');

  // Fetch EVM tokens from all chains in parallel
  const evmResults = await Promise.allSettled(
    evmChains.map(async (chainId) => {
      // Fetch native + ERC20 tokens
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

      return tokens;
    })
  );

  // Flatten EVM results
  const allTokens: TokenHolding[] = [];
  evmResults.forEach((result) => {
    if (result.status === 'fulfilled') {
      allTokens.push(...result.value);
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

  // Filter out zero balance tokens
  const nonZeroTokens = allTokens.filter((token) => {
    const balance = parseFloat(token.balanceFormatted);
    return balance > 0 && token.valueUsd >= 0.01; // Minimum $0.01
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
  const cacheKey = `metadata:${chainId}:${tokenAddress}`;

  // Check cache
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached as string);
    }
  } catch (error) {
    logger.warn({ error }, 'Cache read failed');
  }

  try {
    // Fetch from Moralis or other source
    const metadata = {
      chainId,
      address: tokenAddress,
      symbol: 'UNKNOWN',
      name: 'Unknown Token',
      decimals: 18,
      logoUrl: undefined,
    };

    // Cache for 30 minutes
    try {
      await redis.setex(cacheKey, CACHE_TTL.TOKEN_METADATA, JSON.stringify(metadata));
    } catch (error) {
      logger.warn({ error }, 'Cache write failed');
    }

    return metadata;
  } catch (error) {
    logger.error({ error, chainId, tokenAddress }, 'Metadata fetch failed');
    return {};
  }
}


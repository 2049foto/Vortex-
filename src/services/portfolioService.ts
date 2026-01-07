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
 * Fetch token holdings via Moralis
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
    };

    const chain = chainMap[chainId];
    if (!chain) {
      logger.warn({ chainId }, 'Chain not supported by Moralis');
      return [];
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

    return tokens;
  } catch (error) {
    logger.error({ error, walletAddress, chainId }, 'Moralis fetch failed');
    return [];
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
 * Scan wallet across all supported chains
 */
export async function scanWallet(
  walletAddress: string,
  chainIds?: number[]
): Promise<TokenHolding[]> {
  const chains = chainIds || getSupportedChainIds().filter((id) => id > 0); // Exclude Solana (-1)

  logger.info({ walletAddress, chains }, 'Scanning wallet');

  // Fetch tokens from all chains in parallel
  const results = await Promise.allSettled(
    chains.map(async (chainId) => {
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

  // Flatten results
  const allTokens: TokenHolding[] = [];
  results.forEach((result) => {
    if (result.status === 'fulfilled') {
      allTokens.push(...result.value);
    }
  });

  // Filter out zero balance tokens
  const nonZeroTokens = allTokens.filter((token) => {
    const balance = parseFloat(token.balanceFormatted);
    return balance > 0 && token.valueUsd >= 0.01; // Minimum $0.01
  });

  logger.info(
    {
      walletAddress,
      totalTokens: nonZeroTokens.length,
      totalValue: nonZeroTokens.reduce((sum, t) => sum + t.valueUsd, 0),
    },
    'Wallet scan complete'
  );

  return nonZeroTokens;
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


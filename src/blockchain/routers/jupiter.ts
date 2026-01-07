/**
 * Vortex Protocol - Jupiter Router Integration
 * Solana DEX aggregator
 */

import { env } from '../../config/env';
import { createLogger } from '../../utils/logger';
import { TIMEOUTS } from '../../config/constants';

const logger = createLogger('jupiter');

const JUPITER_API_URL = env.NEXT_PUBLIC_JUPITER_API_URL || 'https://quote-api.jup.ag/v6';

export interface SwapQuote {
  router: 'jupiter';
  amountOut: string;
  estimatedGas: string;
  priceImpact: number;
  routes: any[];
}

/**
 * Get Jupiter quote for Solana swap
 */
export async function getQuote(params: {
  fromToken: string; // Mint address
  toToken: string; // Mint address
  amount: string; // In lamports/smallest unit
  slippage?: number;
}): Promise<SwapQuote> {
  try {
    const slippageBps = Math.round((params.slippage || 0.5) * 100);

    const queryParams = new URLSearchParams({
      inputMint: params.fromToken,
      outputMint: params.toToken,
      amount: params.amount,
      slippageBps: slippageBps.toString(),
      onlyDirectRoutes: 'false',
      asLegacyTransaction: 'false',
    });

    const response = await fetch(
      `${JUPITER_API_URL}/quote?${queryParams}`,
      {
        signal: AbortSignal.timeout(TIMEOUTS.API),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Jupiter API error: ${error}`);
    }

    const data = await response.json();

    const quote: SwapQuote = {
      router: 'jupiter',
      amountOut: data.outAmount || '0',
      estimatedGas: '5000', // Solana fees are minimal
      priceImpact: parseFloat(data.priceImpactPct || '0'),
      routes: data.routePlan || [],
    };

    logger.debug(
      {
        fromToken: params.fromToken,
        toToken: params.toToken,
        amountOut: quote.amountOut,
        priceImpact: quote.priceImpact,
      },
      'Jupiter quote fetched'
    );

    return quote;
  } catch (error) {
    logger.error({ error, params }, 'Jupiter quote failed');
    throw error;
  }
}

/**
 * Get Jupiter swap transaction for Solana
 */
export async function getSwapTx(params: {
  fromToken: string;
  toToken: string;
  amount: string;
  userPublicKey: string;
  slippage?: number;
}): Promise<{
  quote: SwapQuote;
  swapTransaction: string; // Base64 encoded transaction
}> {
  try {
    // First get quote
    const quoteResponse = await getQuote({
      fromToken: params.fromToken,
      toToken: params.toToken,
      amount: params.amount,
      slippage: params.slippage,
    });

    // Get serialized transaction
    const response = await fetch(`${JUPITER_API_URL}/swap`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        quoteResponse: {
          inputMint: params.fromToken,
          outputMint: params.toToken,
          inAmount: params.amount,
          outAmount: quoteResponse.amountOut,
          slippageBps: Math.round((params.slippage || 0.5) * 100),
          routePlan: quoteResponse.routes,
        },
        userPublicKey: params.userPublicKey,
        wrapAndUnwrapSol: true,
        dynamicComputeUnitLimit: true,
        prioritizationFeeLamports: 'auto',
      }),
      signal: AbortSignal.timeout(TIMEOUTS.API),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Jupiter swap API error: ${error}`);
    }

    const data = await response.json();

    logger.info(
      {
        fromToken: params.fromToken,
        toToken: params.toToken,
        amountOut: quoteResponse.amountOut,
      },
      'Jupiter swap transaction built'
    );

    return {
      quote: quoteResponse,
      swapTransaction: data.swapTransaction,
    };
  } catch (error) {
    logger.error({ error, params }, 'Jupiter swap failed');
    throw error;
  }
}

/**
 * Get token list from Jupiter
 */
export async function getSolanaTokenList(): Promise<any[]> {
  try {
    const response = await fetch(
      'https://token.jup.ag/all',
      {
        signal: AbortSignal.timeout(TIMEOUTS.API),
      }
    );

    if (!response.ok) {
      throw new Error('Jupiter token list error');
    }

    const data = await response.json();
    return data || [];
  } catch (error) {
    logger.warn({ error }, 'Jupiter token list fetch failed');
    return [];
  }
}

/**
 * Get token price from Jupiter
 */
export async function getTokenPrice(mintAddress: string): Promise<number> {
  try {
    const response = await fetch(
      `https://price.jup.ag/v6/price?ids=${mintAddress}`,
      {
        signal: AbortSignal.timeout(TIMEOUTS.API),
      }
    );

    if (!response.ok) {
      throw new Error('Jupiter price API error');
    }

    const data = await response.json();
    return data.data?.[mintAddress]?.price || 0;
  } catch (error) {
    logger.warn({ error, mintAddress }, 'Jupiter price fetch failed');
    return 0;
  }
}


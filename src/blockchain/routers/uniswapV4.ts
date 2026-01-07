/**
 * Vortex Protocol - Uniswap/0x Router Integration
 * Uses 0x API for routing through Uniswap and other DEXes
 */

import { env } from '../../config/env';
import { createLogger } from '../../utils/logger';
import { TIMEOUTS } from '../../config/constants';

const logger = createLogger('uniswap-0x');

const ZEROX_API_URL = env.NEXT_PUBLIC_ZEROX_API_URL || 'https://api.0x.org';
const ZEROX_API_KEY = env.ZEROX_API_KEY;

export interface SwapQuote {
  router: 'uniswap_v4';
  amountOut: string;
  estimatedGas: string;
  priceImpact: number;
  pools: any[];
  sources?: any[];
}

/**
 * Get Uniswap/DEX quote via 0x API
 */
export async function getQuote(params: {
  chainId: number;
  fromToken: string;
  toToken: string;
  amount: string;
  fromAddress?: string;
}): Promise<SwapQuote> {
  try {
    // Chain ID to 0x API URL mapping
    const chainToApiUrl: Record<number, string> = {
      1: 'https://api.0x.org',
      8453: 'https://base.api.0x.org',
      42161: 'https://arbitrum.api.0x.org',
      10: 'https://optimism.api.0x.org',
      137: 'https://polygon.api.0x.org',
      56: 'https://bsc.api.0x.org',
      43114: 'https://avalanche.api.0x.org',
    };

    const apiUrl = chainToApiUrl[params.chainId] || ZEROX_API_URL;

    const queryParams = new URLSearchParams({
      sellToken: params.fromToken,
      buyToken: params.toToken,
      sellAmount: params.amount,
    });

    const response = await fetch(
      `${apiUrl}/swap/v1/quote?${queryParams}`,
      {
        headers: {
          '0x-api-key': ZEROX_API_KEY || '',
        },
        signal: AbortSignal.timeout(TIMEOUTS.API),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`0x API error: ${error}`);
    }

    const data = await response.json();

    const quote: SwapQuote = {
      router: 'uniswap_v4',
      amountOut: data.buyAmount || '0',
      estimatedGas: data.estimatedGas || '200000',
      priceImpact: parseFloat(data.estimatedPriceImpact || '0'),
      pools: [],
      sources: data.sources || [],
    };

    logger.debug(
      {
        chainId: params.chainId,
        fromToken: params.fromToken,
        toToken: params.toToken,
        amountOut: quote.amountOut,
      },
      '0x/Uniswap quote fetched'
    );

    return quote;
  } catch (error) {
    logger.error({ error, params }, '0x/Uniswap quote failed');
    throw error;
  }
}

/**
 * Build swap transaction via 0x API
 */
export async function getSwapTx(params: {
  chainId: number;
  fromToken: string;
  toToken: string;
  amount: string;
  fromAddress: string;
  slippage?: number;
}): Promise<SwapQuote & { calldata: string; to: string; value: string }> {
  try {
    const chainToApiUrl: Record<number, string> = {
      1: 'https://api.0x.org',
      8453: 'https://base.api.0x.org',
      42161: 'https://arbitrum.api.0x.org',
      10: 'https://optimism.api.0x.org',
      137: 'https://polygon.api.0x.org',
      56: 'https://bsc.api.0x.org',
      43114: 'https://avalanche.api.0x.org',
    };

    const apiUrl = chainToApiUrl[params.chainId] || ZEROX_API_URL;

    const queryParams = new URLSearchParams({
      sellToken: params.fromToken,
      buyToken: params.toToken,
      sellAmount: params.amount,
      takerAddress: params.fromAddress,
      slippagePercentage: ((params.slippage || 0.5) / 100).toString(),
    });

    const response = await fetch(
      `${apiUrl}/swap/v1/quote?${queryParams}`,
      {
        headers: {
          '0x-api-key': ZEROX_API_KEY || '',
        },
        signal: AbortSignal.timeout(TIMEOUTS.API),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`0x swap API error: ${error}`);
    }

    const data = await response.json();

    logger.info(
      {
        chainId: params.chainId,
        fromToken: params.fromToken,
        toToken: params.toToken,
        amountOut: data.buyAmount,
      },
      '0x/Uniswap swap built'
    );

    return {
      router: 'uniswap_v4',
      amountOut: data.buyAmount || '0',
      estimatedGas: data.estimatedGas || '200000',
      priceImpact: parseFloat(data.estimatedPriceImpact || '0'),
      pools: [],
      sources: data.sources || [],
      calldata: data.data,
      to: data.to,
      value: data.value || '0',
    };
  } catch (error) {
    logger.error({ error, params }, '0x/Uniswap swap failed');
    throw error;
  }
}


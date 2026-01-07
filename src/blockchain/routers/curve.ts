/**
 * Vortex Protocol - Curve Router Integration
 * Stablecoin-optimized swaps
 */

import { createLogger } from '../../utils/logger';
import { TIMEOUTS } from '../../config/constants';

const logger = createLogger('curve');

const CURVE_API_URL = 'https://api.curve.fi/api';

export interface SwapQuote {
  router: 'curve';
  amountOut: string;
  estimatedGas: string;
  priceImpact: number;
  pool?: string;
}

/**
 * Get Curve quote
 */
export async function getQuote(params: {
  chainId: number;
  fromToken: string;
  toToken: string;
  amount: string;
}): Promise<SwapQuote> {
  try {
    // Curve API for quotes
    const response = await fetch(
      `${CURVE_API_URL}/getExpectedSwapRoute/${params.fromToken}/${params.toToken}/${params.amount}`,
      {
        signal: AbortSignal.timeout(TIMEOUTS.API),
      }
    );

    if (!response.ok) {
      throw new Error(`Curve API error: ${response.statusText}`);
    }

    const data = await response.json();

    const quote: SwapQuote = {
      router: 'curve',
      amountOut: data.expectedOut || '0',
      estimatedGas: data.estimatedGas || '250000',
      priceImpact: parseFloat(data.priceImpact || '0'),
      pool: data.pool,
    };

    logger.debug(
      {
        chainId: params.chainId,
        fromToken: params.fromToken,
        toToken: params.toToken,
        amountOut: quote.amountOut,
      },
      'Curve quote fetched'
    );

    return quote;
  } catch (error) {
    logger.error({ error, params }, 'Curve quote failed');
    throw error;
  }
}

/**
 * Get Curve swap transaction
 */
export async function getSwapTx(params: {
  chainId: number;
  fromToken: string;
  toToken: string;
  amount: string;
  fromAddress: string;
  slippage?: number;
}): Promise<SwapQuote & { calldata: string; to: string }> {
  try {
    const quote = await getQuote(params);

    // Get swap calldata from Curve API
    const response = await fetch(`${CURVE_API_URL}/getSwapCalldata`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fromToken: params.fromToken,
        toToken: params.toToken,
        amount: params.amount,
        fromAddress: params.fromAddress,
        slippage: (params.slippage || 0.5) * 100, // Convert to basis points
      }),
      signal: AbortSignal.timeout(TIMEOUTS.API),
    });

    if (!response.ok) {
      throw new Error(`Curve API error: ${response.statusText}`);
    }

    const data = await response.json();

    logger.info(
      {
        chainId: params.chainId,
        fromToken: params.fromToken,
        toToken: params.toToken,
      },
      'Curve swap built'
    );

    return {
      ...quote,
      calldata: data.calldata || '0x',
      to: data.to || '',
    };
  } catch (error) {
    logger.error({ error, params }, 'Curve swap failed');
    throw error;
  }
}


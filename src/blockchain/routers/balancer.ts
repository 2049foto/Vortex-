/**
 * Vortex Protocol - Balancer Router Integration
 * Multi-token pool swaps
 */

import { createLogger } from '../../utils/logger';
import { TIMEOUTS } from '../../config/constants';

const logger = createLogger('balancer');

const BALANCER_API_URL = 'https://api.balancer.fi';

export interface SwapQuote {
  router: 'balancer';
  amountOut: string;
  estimatedGas: string;
  priceImpact: number;
  pools?: any[];
}

/**
 * Get Balancer quote via SOR (Smart Order Router)
 */
export async function getQuote(params: {
  chainId: number;
  fromToken: string;
  toToken: string;
  amount: string;
}): Promise<SwapQuote> {
  try {
    const response = await fetch(`${BALANCER_API_URL}/sor/${params.chainId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sellToken: params.fromToken,
        buyToken: params.toToken,
        orderKind: 'sell',
        amount: params.amount,
        gasPrice: '1000000000', // 1 gwei default
      }),
      signal: AbortSignal.timeout(TIMEOUTS.API),
    });

    if (!response.ok) {
      throw new Error(`Balancer API error: ${response.statusText}`);
    }

    const data = await response.json();

    const quote: SwapQuote = {
      router: 'balancer',
      amountOut: data.returnAmount || '0',
      estimatedGas: data.estimatedGas || '300000',
      priceImpact: parseFloat(data.priceImpact || '0'),
      pools: data.swaps || [],
    };

    logger.debug(
      {
        chainId: params.chainId,
        fromToken: params.fromToken,
        toToken: params.toToken,
        amountOut: quote.amountOut,
      },
      'Balancer quote fetched'
    );

    return quote;
  } catch (error) {
    logger.error({ error, params }, 'Balancer quote failed');
    throw error;
  }
}

/**
 * Get Balancer swap transaction
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

    // Build swap via Balancer Vault
    const BALANCER_VAULT = '0xBA12222222228d8Ba445958a75a0704d566BF2C8';

    // Simplified calldata (production should use @balancer-labs/sdk)
    const calldata = '0x'; // TODO: Build actual calldata

    logger.info(
      {
        chainId: params.chainId,
        fromToken: params.fromToken,
        toToken: params.toToken,
      },
      'Balancer swap built'
    );

    return {
      ...quote,
      calldata,
      to: BALANCER_VAULT,
    };
  } catch (error) {
    logger.error({ error, params }, 'Balancer swap failed');
    throw error;
  }
}


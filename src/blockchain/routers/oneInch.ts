/**
 * Vortex Protocol - 1inch Router Integration
 * Primary DEX aggregator
 */

import { env } from '../../config/env';
import { createLogger } from '../../utils/logger';
import { TIMEOUTS } from '../../config/constants';

const logger = createLogger('1inch');

const ONEINCH_API_URL = env.NEXT_PUBLIC_ONEINCH_API_URL;
const ONEINCH_API_KEY = env.ONEINCH_API_KEY;

export interface SwapQuote {
  router: '1inch';
  amountOut: string;
  estimatedGas: string;
  priceImpact: number;
  protocols: any[];
  tx?: {
    from: string;
    to: string;
    data: string;
    value: string;
    gasPrice: string;
    gas: string;
  };
}

/**
 * Get swap quote from 1inch
 */
export async function getQuote(params: {
  chainId: number;
  fromToken: string;
  toToken: string;
  amount: string;
  fromAddress?: string;
  slippage?: number;
}): Promise<SwapQuote> {
  try {
    const queryParams = new URLSearchParams({
      src: params.fromToken,
      dst: params.toToken,
      amount: params.amount,
      includeGas: 'true',
      ...(params.slippage && { slippage: params.slippage.toString() }),
    });

    const response = await fetch(
      `${ONEINCH_API_URL}/swap/v6.0/${params.chainId}/quote?${queryParams}`,
      {
        headers: {
          Authorization: `Bearer ${ONEINCH_API_KEY}`,
        },
        signal: AbortSignal.timeout(TIMEOUTS.API),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`1inch API error: ${error}`);
    }

    const data = await response.json();

    const quote: SwapQuote = {
      router: '1inch',
      amountOut: data.dstAmount || data.toAmount,
      estimatedGas: data.gas || data.estimatedGas || '300000',
      priceImpact: parseFloat(data.priceImpact || '0'),
      protocols: data.protocols || [],
    };

    logger.debug(
      {
        chainId: params.chainId,
        fromToken: params.fromToken,
        toToken: params.toToken,
        amountOut: quote.amountOut,
      },
      '1inch quote fetched'
    );

    return quote;
  } catch (error) {
    logger.error({ error, params }, '1inch quote failed');
    throw error;
  }
}

/**
 * Get swap transaction data from 1inch
 */
export async function getSwapTx(params: {
  chainId: number;
  fromToken: string;
  toToken: string;
  amount: string;
  fromAddress: string;
  slippage?: number;
  destReceiver?: string;
}): Promise<SwapQuote> {
  try {
    const queryParams = new URLSearchParams({
      src: params.fromToken,
      dst: params.toToken,
      amount: params.amount,
      from: params.fromAddress,
      slippage: (params.slippage || 0.5).toString(),
      disableEstimate: 'false',
      allowPartialFill: 'false',
      ...(params.destReceiver && { receiver: params.destReceiver }),
    });

    const response = await fetch(
      `${ONEINCH_API_URL}/swap/v6.0/${params.chainId}/swap?${queryParams}`,
      {
        headers: {
          Authorization: `Bearer ${ONEINCH_API_KEY}`,
        },
        signal: AbortSignal.timeout(TIMEOUTS.API),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`1inch swap API error: ${error}`);
    }

    const data = await response.json();

    const quote: SwapQuote = {
      router: '1inch',
      amountOut: data.dstAmount || data.toAmount,
      estimatedGas: data.gas || data.tx?.gas || '300000',
      priceImpact: parseFloat(data.priceImpact || '0'),
      protocols: data.protocols || [],
      tx: data.tx
        ? {
            from: data.tx.from,
            to: data.tx.to,
            data: data.tx.data,
            value: data.tx.value || '0',
            gasPrice: data.tx.gasPrice,
            gas: data.tx.gas,
          }
        : undefined,
    };

    logger.info(
      {
        chainId: params.chainId,
        fromToken: params.fromToken,
        toToken: params.toToken,
        amountOut: quote.amountOut,
      },
      '1inch swap transaction built'
    );

    return quote;
  } catch (error) {
    logger.error({ error, params }, '1inch swap transaction failed');
    throw error;
  }
}

/**
 * Get supported tokens on chain
 */
export async function getSupportedTokens(chainId: number): Promise<any> {
  try {
    const response = await fetch(
      `${ONEINCH_API_URL}/swap/v6.0/${chainId}/tokens`,
      {
        headers: {
          Authorization: `Bearer ${ONEINCH_API_KEY}`,
        },
        signal: AbortSignal.timeout(TIMEOUTS.API),
      }
    );

    if (!response.ok) {
      throw new Error(`1inch API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.tokens || {};
  } catch (error) {
    logger.warn({ error, chainId }, '1inch tokens fetch failed');
    return {};
  }
}


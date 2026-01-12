/**
 * Vortex Protocol - Relay.link Integration
 * Cross-chain bridge execution using Relay API
 * Docs: https://docs.relay.link/references/api/quickstart
 */

import { createLogger } from '../utils/logger';
import { env } from '../config/env';

const logger = createLogger('relay');

const RELAY_API_BASE = 'https://api.relay.link';

export interface RelayQuote {
  requestId: string;
  steps: RelayStep[];
  estimatedOutput?: string;
  fees?: {
    relayFee: string;
    gasFee: string;
  };
}

export interface RelayStep {
  kind: 'transaction' | 'signature';
  requestId: string;
  items: RelayStepItem[];
}

export interface RelayStepItem {
  data?: {
    to: string;
    data: string;
    value: string;
    chainId: number;
  };
  signatureKind?: string;
  message?: string;
  check?: {
    endpoint: string;
  };
}

/**
 * Get quote from Relay for cross-chain bridge
 */
export async function getRelayQuote(params: {
  user: string;
  originChainId: number;
  destinationChainId: number;
  originCurrency: string; // Token address or '0x0000000000000000000000000000000000000000' for native
  destinationCurrency: string; // Token address or '0x0000000000000000000000000000000000000000' for native
  amount: string; // Amount in wei
  tradeType?: 'EXACT_INPUT' | 'EXACT_OUTPUT';
}): Promise<RelayQuote | null> {
  // Validate chain support
  if (!isRelaySupported(params.originChainId, params.destinationChainId)) {
    logger.warn({ 
      originChainId: params.originChainId, 
      destinationChainId: params.destinationChainId 
    }, 'Relay does not support this chain pair');
    return null;
  }

  // Validate amount
  const amount = BigInt(params.amount);
  if (amount <= 0n) {
    logger.warn({ amount: params.amount }, 'Relay: Invalid amount');
    return null;
  }

  // Normalize currency addresses
  const originCurrency = toRelayCurrency(params.originCurrency);
  const destinationCurrency = toRelayCurrency(params.destinationCurrency);

  try {
    logger.info({ 
      user: params.user.slice(0, 10),
      originChainId: params.originChainId,
      destinationChainId: params.destinationChainId,
      originCurrency: originCurrency.slice(0, 10),
      destinationCurrency: destinationCurrency.slice(0, 10),
      amount: params.amount.slice(0, 20),
    }, 'Getting Relay quote');

    const response = await fetch(`${RELAY_API_BASE}/quote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        user: params.user,
        originChainId: params.originChainId,
        destinationChainId: params.destinationChainId,
        originCurrency,
        destinationCurrency,
        amount: params.amount,
        tradeType: params.tradeType || 'EXACT_INPUT',
      }),
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error({ 
        status: response.status, 
        errorText: errorText.slice(0, 300),
        originChainId: params.originChainId,
        destinationChainId: params.destinationChainId
      }, 'Relay API error response');
      return null;
    }

    const data = await response.json();
    
    // Check for API errors in response body
    if (data.error) {
      logger.error({ 
        error: data.error.message || data.error,
        code: data.error.code 
      }, 'Relay API returned error');
      return null;
    }

    if (!data.requestId || !data.steps || data.steps.length === 0) {
      logger.warn({ data }, 'Relay quote missing required fields');
      return null;
    }
    
    logger.info({ 
      requestId: data.requestId, 
      stepsCount: data.steps.length,
      hasOutput: !!data.details?.currencyOut?.amountFormatted
    }, 'Relay quote received');

    // Extract estimated output from response
    const estimatedOutput = data.details?.currencyOut?.amountFormatted || 
                          data.details?.currencyOut?.amount || 
                          data.destinationAmount ||
                          '0';

    return {
      requestId: data.requestId,
      steps: data.steps,
      estimatedOutput,
      fees: {
        relayFee: data.fees?.relayer?.amountFormatted || data.relayFee?.toString() || '0',
        gasFee: data.fees?.gas?.amountFormatted || data.gasFee?.toString() || '0',
      },
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      logger.error({ originChainId: params.originChainId }, 'Relay API timeout');
      return null;
    }
    logger.error({ error, originChain: params.originChainId }, 'Failed to get Relay quote');
    return null;
  }
}

/**
 * Check status of Relay request
 */
export async function getRelayStatus(requestId: string): Promise<{
  status: 'waiting' | 'pending' | 'success' | 'failed' | 'refunded';
  txHash?: string;
  destinationTxHash?: string;
  error?: string;
}> {
  try {
    const response = await fetch(`${RELAY_API_BASE}/intents/status/v3?requestId=${requestId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Relay status API error: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      status: data.status || 'pending',
      txHash: data.originTxHash,
      destinationTxHash: data.destinationTxHash,
      error: data.error,
    };
  } catch (error) {
    logger.error({ error, requestId }, 'Failed to get Relay status');
    throw error;
  }
}

/**
 * Execute Relay bridge transaction
 * Returns the transaction hash from the first step
 */
export async function executeRelayBridge(
  quote: RelayQuote,
  walletClient: any // Viem wallet client
): Promise<{ txHash: string; requestId: string }> {
  logger.info({ requestId: quote.requestId }, 'Executing Relay bridge');

  if (!quote.steps || quote.steps.length === 0) {
    throw new Error('No steps in Relay quote');
  }

  // Execute first step (usually the deposit transaction)
  const firstStep = quote.steps[0];
  
  if (firstStep.kind !== 'transaction') {
    throw new Error(`Expected transaction step, got ${firstStep.kind}`);
  }

  if (!firstStep.items || firstStep.items.length === 0) {
    throw new Error('No items in Relay step');
  }

  const item = firstStep.items[0];
  
  if (!item.data) {
    throw new Error('No transaction data in Relay step item');
  }

  // Send transaction using wallet client
  const txHash = await walletClient.sendTransaction({
    to: item.data.to as `0x${string}`,
    data: item.data.data as `0x${string}`,
    value: BigInt(item.data.value),
    chain: { id: item.data.chainId },
  });

  logger.info({ txHash, requestId: quote.requestId }, 'Relay bridge transaction sent');

  return {
    txHash,
    requestId: quote.requestId,
  };
}

/**
 * Convert token address to Relay format
 * Native tokens use zero address
 */
export function toRelayCurrency(tokenAddress: string | null): string {
  if (!tokenAddress) {
    return '0x0000000000000000000000000000000000000000';
  }
  
  // Native token sentinel → zero address for Relay
  if (tokenAddress.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
    return '0x0000000000000000000000000000000000000000';
  }
  
  if (tokenAddress === '0x0000000000000000000000000000000000000000') {
    return '0x0000000000000000000000000000000000000000';
  }
  
  return tokenAddress;
}

/**
 * Check if Relay supports chain pair
 */
export function isRelaySupported(originChainId: number, destinationChainId: number): boolean {
  // Relay supports most major EVM chains
  // Note: Monad (838592) is experimental - may not work yet
  const supportedChains = [
    1,      // Ethereum
    8453,   // Base
    42161,  // Arbitrum
    10,     // Optimism
    137,    // Polygon
    56,     // BNB Chain
    43114,  // Avalanche
    324,    // zkSync Era
    // 838592, // Monad - disabled until Relay confirms support
  ];
  return supportedChains.includes(originChainId) && supportedChains.includes(destinationChainId);
}

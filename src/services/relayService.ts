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
}): Promise<RelayQuote> {
  try {
    logger.info({ params }, 'Getting Relay quote');

    const response = await fetch(`${RELAY_API_BASE}/quote/v2`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user: params.user,
        originChainId: params.originChainId,
        destinationChainId: params.destinationChainId,
        originCurrency: params.originCurrency,
        destinationCurrency: params.destinationCurrency,
        amount: params.amount,
        tradeType: params.tradeType || 'EXACT_INPUT',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Relay API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    logger.info({ requestId: data.requestId, stepsCount: data.steps?.length }, 'Relay quote received');

    return {
      requestId: data.requestId,
      steps: data.steps || [],
      estimatedOutput: data.estimatedOutput,
      fees: data.fees,
    };
  } catch (error) {
    logger.error({ error, params }, 'Failed to get Relay quote');
    throw error;
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
  if (!tokenAddress || tokenAddress === '0x0000000000000000000000000000000000000000') {
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

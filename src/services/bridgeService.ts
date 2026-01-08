/**
 * Vortex Protocol - Smart Bridge Service
 * Cost analysis and bridge selection for cross-chain consolidation
 */

import { createLogger } from '../utils/logger';
import { BRIDGE_COST_THRESHOLD_PERCENT } from '../config/constants';
import { env } from '../config/env';
import { TIMEOUTS } from '../config/constants';

const logger = createLogger('bridge');

export interface BridgeQuote {
  bridge: 'across' | 'stargate' | 'debridge' | 'layerzero';
  costUsd: number;
  estimatedTimeMinutes: number;
  amountOut: string; // Amount received on destination chain
  feeUsd: number;
  available: boolean;
}

export interface BridgeDecision {
  shouldBridge: boolean;
  selectedBridge: BridgeQuote | null;
  reason: string;
}

/**
 * Get bridge quotes from multiple providers
 */
export async function getBridgeQuotes(
  fromChainId: number,
  toChainId: number,
  tokenAddress: string,
  amount: string,
  recipient: string
): Promise<BridgeQuote[]> {
  const quotes: BridgeQuote[] = [];

  // Fetch quotes in parallel
  const quotePromises = [
    getAcrossQuote(fromChainId, toChainId, tokenAddress, amount, recipient).catch(e => ({ error: e, bridge: 'across' })),
    getStargateQuote(fromChainId, toChainId, tokenAddress, amount, recipient).catch(e => ({ error: e, bridge: 'stargate' })),
    getDebridgeQuote(fromChainId, toChainId, tokenAddress, amount, recipient).catch(e => ({ error: e, bridge: 'debridge' })),
  ];

  const results = await Promise.allSettled(quotePromises);

  results.forEach((result, index) => {
    if (result.status === 'fulfilled' && !('error' in result.value)) {
      quotes.push(result.value as BridgeQuote);
    } else {
      logger.debug({ bridge: ['across', 'stargate', 'debridge'][index] }, 'Bridge quote unavailable');
    }
  });

  return quotes;
}

/**
 * Choose best bridge based on cost and value
 */
export function chooseBridge(
  quotes: BridgeQuote[],
  valueUsd: number
): BridgeDecision {
  if (quotes.length === 0) {
    return {
      shouldBridge: false,
      selectedBridge: null,
      reason: 'No bridge quotes available',
    };
  }

  // Sort by cost (lowest first)
  const sortedQuotes = [...quotes]
    .filter(q => q.available)
    .sort((a, b) => a.costUsd - b.costUsd);

  if (sortedQuotes.length === 0) {
    return {
      shouldBridge: false,
      selectedBridge: null,
      reason: 'No available bridges',
    };
  }

  const bestQuote = sortedQuotes[0];

  // Check if bridge cost is economically justified
  const costPercent = (bestQuote.costUsd / valueUsd) * 100;
  
  if (costPercent > BRIDGE_COST_THRESHOLD_PERCENT) {
    return {
      shouldBridge: false,
      selectedBridge: null,
      reason: `Bridge cost (${costPercent.toFixed(2)}%) exceeds threshold (${BRIDGE_COST_THRESHOLD_PERCENT}%)`,
    };
  }

  // Check if value is too low to bridge
  if (valueUsd < 10) {
    return {
      shouldBridge: false,
      selectedBridge: null,
      reason: `Value too low ($${valueUsd.toFixed(2)}) to justify bridging`,
    };
  }

  return {
    shouldBridge: true,
    selectedBridge: bestQuote,
    reason: `Best bridge: ${bestQuote.bridge} (cost: $${bestQuote.costUsd.toFixed(2)}, ${costPercent.toFixed(2)}% of value)`,
  };
}

/**
 * Get quote from Across Protocol
 */
async function getAcrossQuote(
  fromChainId: number,
  toChainId: number,
  tokenAddress: string,
  amount: string,
  recipient: string
): Promise<BridgeQuote> {
  try {
    // Across API endpoint (example - adjust to actual API)
    const response = await fetch(
      `https://api.across.to/v2/quote?originChainId=${fromChainId}&destinationChainId=${toChainId}&token=${tokenAddress}&amount=${amount}&recipient=${recipient}`,
      {
        signal: AbortSignal.timeout(TIMEOUTS.API),
      }
    );

    if (!response.ok) {
      throw new Error('Across API error');
    }

    const data = await response.json();
    
    // Estimate cost (fee + gas)
    const feeUsd = parseFloat(data.relayerFeeTotal || '0');
    const gasCostUsd = parseFloat(data.gasCostUsd || '0');
    const costUsd = feeUsd + gasCostUsd;

    return {
      bridge: 'across',
      costUsd,
      estimatedTimeMinutes: data.estimatedTimeMinutes || 10,
      amountOut: data.amountOut || amount,
      feeUsd,
      available: true,
    };
  } catch (error) {
    logger.warn({ error, fromChainId, toChainId }, 'Across quote failed');
    return {
      bridge: 'across',
      costUsd: 0,
      estimatedTimeMinutes: 0,
      amountOut: '0',
      feeUsd: 0,
      available: false,
    };
  }
}

/**
 * Get quote from Stargate Finance
 */
async function getStargateQuote(
  fromChainId: number,
  toChainId: number,
  tokenAddress: string,
  amount: string,
  recipient: string
): Promise<BridgeQuote> {
  try {
    // Stargate API endpoint (example - adjust to actual API)
    const response = await fetch(
      `https://api.stargate.finance/v1/quote?srcChainId=${fromChainId}&dstChainId=${toChainId}&srcToken=${tokenAddress}&amount=${amount}&dstAddress=${recipient}`,
      {
        signal: AbortSignal.timeout(TIMEOUTS.API),
      }
    );

    if (!response.ok) {
      throw new Error('Stargate API error');
    }

    const data = await response.json();
    
    const feeUsd = parseFloat(data.feeUsd || '0');
    const costUsd = feeUsd; // Stargate includes gas in fee

    return {
      bridge: 'stargate',
      costUsd,
      estimatedTimeMinutes: data.estimatedTimeMinutes || 5,
      amountOut: data.amountOut || amount,
      feeUsd,
      available: true,
    };
  } catch (error) {
    logger.warn({ error, fromChainId, toChainId }, 'Stargate quote failed');
    return {
      bridge: 'stargate',
      costUsd: 0,
      estimatedTimeMinutes: 0,
      amountOut: '0',
      feeUsd: 0,
      available: false,
    };
  }
}

/**
 * Get quote from deBridge
 */
async function getDebridgeQuote(
  fromChainId: number,
  toChainId: number,
  tokenAddress: string,
  amount: string,
  recipient: string
): Promise<BridgeQuote> {
  try {
    // deBridge API endpoint (example - adjust to actual API)
    const response = await fetch(
      `https://api.debridge.finance/v1/quote?srcChainId=${fromChainId}&dstChainId=${toChainId}&srcTokenAddress=${tokenAddress}&amount=${amount}&dstAddress=${recipient}`,
      {
        signal: AbortSignal.timeout(TIMEOUTS.API),
      }
    );

    if (!response.ok) {
      throw new Error('deBridge API error');
    }

    const data = await response.json();
    
    const feeUsd = parseFloat(data.feeUsd || '0');
    const gasCostUsd = parseFloat(data.gasCostUsd || '0');
    const costUsd = feeUsd + gasCostUsd;

    return {
      bridge: 'debridge',
      costUsd,
      estimatedTimeMinutes: data.estimatedTimeMinutes || 15,
      amountOut: data.amountOut || amount,
      feeUsd,
      available: true,
    };
  } catch (error) {
    logger.warn({ error, fromChainId, toChainId }, 'deBridge quote failed');
    return {
      bridge: 'debridge',
      costUsd: 0,
      estimatedTimeMinutes: 0,
      amountOut: '0',
      feeUsd: 0,
      available: false,
    };
  }
}

/**
 * Execute bridge transaction
 */
export async function executeBridge(
  bridge: BridgeQuote,
  fromChainId: number,
  toChainId: number,
  tokenAddress: string,
  amount: string,
  recipient: string,
  walletAddress: string,
  privateKey?: string
): Promise<{ txHash: string; bridgeId: string }> {
  logger.info(
    { bridge: bridge.bridge, fromChainId, toChainId, amount },
    'Executing bridge'
  );

  if (!bridge.available) {
    throw new Error(`Bridge ${bridge.bridge} is not available`);
  }

  try {
    // Import bridge implementations dynamically
    let result: { txHash: string; bridgeId: string };

    switch (bridge.bridge) {
      case 'across': {
        const { executeAcrossBridge } = await import('../blockchain/bridges/across');
        result = await executeAcrossBridge({
          fromChainId,
          toChainId,
          tokenAddress,
          amount,
          recipient,
          walletAddress,
          privateKey,
        });
        break;
      }

      case 'stargate': {
        const { executeStargateBridge } = await import('../blockchain/bridges/stargate');
        result = await executeStargateBridge({
          fromChainId,
          toChainId,
          tokenAddress,
          amount,
          recipient,
          walletAddress,
        });
        break;
      }

      case 'debridge': {
        const { executeDebridgeBridge } = await import('../blockchain/bridges/debridge');
        result = await executeDebridgeBridge({
          fromChainId,
          toChainId,
          tokenAddress,
          amount,
          recipient,
          walletAddress,
        });
        break;
      }

      default:
        throw new Error(`Unsupported bridge: ${bridge.bridge}`);
    }

    logger.info(
      {
        bridge: bridge.bridge,
        txHash: result.txHash,
        bridgeId: result.bridgeId,
      },
      'Bridge execution completed'
    );

    return result;
  } catch (error) {
    logger.error(
      {
        error,
        bridge: bridge.bridge,
        fromChainId,
        toChainId,
      },
      'Bridge execution failed'
    );
    throw error;
  }
}

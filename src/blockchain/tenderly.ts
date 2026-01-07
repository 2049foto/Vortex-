/**
 * Vortex Protocol - Tenderly Integration
 * Transaction simulation and honeypot detection
 */

import { env } from '../config/env';
import { createLogger } from '../utils/logger';
import { TIMEOUTS } from '../config/constants';

const logger = createLogger('tenderly');

const TENDERLY_API_URL = `https://api.tenderly.co/api/v1/account/${env.TENDERLY_USERNAME}/project/${env.TENDERLY_PROJECT}`;

export interface SimulationResult {
  success: boolean;
  gasUsed: string;
  blockNumber: string;
  logs: any[];
  trace: any[];
  errorMessage?: string;
  isHoneypot?: boolean;
}

/**
 * Simulate transaction on Tenderly
 */
export async function simulateTransaction(params: {
  chainId: number;
  from: string;
  to: string;
  data: string;
  value?: string;
  gasLimit?: string;
}): Promise<SimulationResult> {
  try {
    const response = await fetch(`${TENDERLY_API_URL}/simulate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Access-Key': env.TENDERLY_API_KEY,
      },
      body: JSON.stringify({
        network_id: params.chainId.toString(),
        from: params.from,
        to: params.to,
        input: params.data,
        value: params.value || '0',
        gas: params.gasLimit ? parseInt(params.gasLimit) : 10000000,
        gas_price: '0',
        save: false,
        save_if_fails: false,
      }),
      signal: AbortSignal.timeout(TIMEOUTS.SIMULATION),
    });

    if (!response.ok) {
      throw new Error(`Tenderly API error: ${response.statusText}`);
    }

    const data = await response.json();

    const result: SimulationResult = {
      success: data.transaction.status,
      gasUsed: data.transaction.gas_used.toString(),
      blockNumber: data.transaction.block_number.toString(),
      logs: data.transaction.transaction_info?.logs || [],
      trace: data.transaction.transaction_info?.call_trace || [],
      errorMessage: data.transaction.error_message,
    };

    // Detect honeypot patterns
    if (!result.success) {
      // Check for common honeypot errors
      const errorMsg = result.errorMessage?.toLowerCase() || '';
      result.isHoneypot = 
        errorMsg.includes('transfer failed') ||
        errorMsg.includes('insufficient allowance') ||
        errorMsg.includes('uniswap') ||
        errorMsg.includes('pair');
    }

    logger.debug(
      {
        success: result.success,
        gasUsed: result.gasUsed,
        isHoneypot: result.isHoneypot,
        from: params.from,
        to: params.to,
      },
      'Transaction simulated'
    );

    return result;
  } catch (error) {
    logger.error({ error, params }, 'Simulation failed');
    throw error;
  }
}

/**
 * Simulate swap to detect honeypot
 */
export async function detectHoneypot(params: {
  chainId: number;
  tokenAddress: string;
  routerAddress: string;
  amountIn: string;
  path: string[];
  wallet: string;
}): Promise<{ isHoneypot: boolean; reason?: string }> {
  try {
    // Build swap calldata (simplified)
    const swapData = `0x38ed1739${
      // swapExactTokensForTokens selector
      params.amountIn.padStart(64, '0')
    }`;

    const simulation = await simulateTransaction({
      chainId: params.chainId,
      from: params.wallet,
      to: params.routerAddress,
      data: swapData,
      value: '0',
    });

    if (!simulation.success) {
      return {
        isHoneypot: true,
        reason: simulation.errorMessage || 'Simulation failed',
      };
    }

    return { isHoneypot: false };
  } catch (error) {
    logger.warn({ error, token: params.tokenAddress }, 'Honeypot detection failed');
    // Fail safe: assume not honeypot if simulation fails
    return { isHoneypot: false };
  }
}

/**
 * Batch simulate multiple swaps
 */
export async function simulateBatch(
  simulations: Array<{
    chainId: number;
    from: string;
    to: string;
    data: string;
    value?: string;
  }>
): Promise<SimulationResult[]> {
  // Run simulations in parallel
  const results = await Promise.allSettled(
    simulations.map((sim) => simulateTransaction(sim))
  );

  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      logger.error(
        { error: result.reason, index },
        'Batch simulation item failed'
      );
      return {
        success: false,
        gasUsed: '0',
        blockNumber: '0',
        logs: [],
        trace: [],
        errorMessage: result.reason?.message || 'Simulation failed',
      };
    }
  });
}


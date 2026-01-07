/**
 * Vortex Protocol - Pimlico Integration
 * Primary AA bundler and paymaster
 */

import { env } from '../config/env';
import { createLogger } from '../utils/logger';
import { TIMEOUTS } from '../config/constants';

const logger = createLogger('pimlico');

const PIMLICO_BASE_URL = env.NEXT_PUBLIC_PIMLICO_BASE_URL;

export interface UserOperation {
  sender: string;
  nonce: string;
  initCode: string;
  callData: string;
  callGasLimit: string;
  verificationGasLimit: string;
  preVerificationGas: string;
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
  paymasterAndData: string;
  signature: string;
}

export interface SponsorUserOpResponse {
  paymasterAndData: string;
  preVerificationGas: string;
  verificationGasLimit: string;
  callGasLimit: string;
}

export interface UserOpReceipt {
  userOpHash: string;
  sender: string;
  nonce: string;
  actualGasCost: string;
  actualGasUsed: string;
  success: boolean;
  logs: any[];
  receipt: {
    transactionHash: string;
    blockNumber: string;
    blockHash: string;
  };
}

/**
 * Get paymaster data to sponsor a UserOperation
 */
export async function sponsorUserOp(
  userOp: Partial<UserOperation>,
  entryPoint: string = '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789'
): Promise<SponsorUserOpResponse> {
  try {
    const response = await fetch(PIMLICO_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'pm_sponsorUserOperation',
        params: [
          userOp,
          {
            entryPoint,
          },
        ],
      }),
      signal: AbortSignal.timeout(TIMEOUTS.API),
    });

    if (!response.ok) {
      throw new Error(`Pimlico API error: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(`Pimlico error: ${data.error.message}`);
    }

    logger.info({ userOpSender: userOp.sender }, 'UserOp sponsored by Pimlico');

    return data.result;
  } catch (error) {
    logger.error({ error, userOp: userOp.sender }, 'Failed to sponsor UserOp with Pimlico');
    throw error;
  }
}

/**
 * Send UserOperation to bundler
 */
export async function sendUserOp(
  userOp: UserOperation,
  entryPoint: string = '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789'
): Promise<string> {
  try {
    const response = await fetch(PIMLICO_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_sendUserOperation',
        params: [userOp, entryPoint],
      }),
      signal: AbortSignal.timeout(TIMEOUTS.API),
    });

    if (!response.ok) {
      throw new Error(`Pimlico bundler error: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(`Pimlico bundler error: ${data.error.message}`);
    }

    const userOpHash = data.result;
    logger.info({ userOpHash, sender: userOp.sender }, 'UserOp sent to Pimlico bundler');

    return userOpHash;
  } catch (error) {
    logger.error({ error, sender: userOp.sender }, 'Failed to send UserOp to bundler');
    throw error;
  }
}

/**
 * Get UserOperation receipt
 */
export async function getUserOpReceipt(userOpHash: string): Promise<UserOpReceipt | null> {
  try {
    const response = await fetch(PIMLICO_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_getUserOperationReceipt',
        params: [userOpHash],
      }),
      signal: AbortSignal.timeout(TIMEOUTS.API),
    });

    if (!response.ok) {
      throw new Error(`Pimlico API error: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.error) {
      // Not found is ok (pending)
      if (data.error.message.includes('not found')) {
        return null;
      }
      throw new Error(`Pimlico error: ${data.error.message}`);
    }

    return data.result;
  } catch (error) {
    logger.warn({ error, userOpHash }, 'Failed to get UserOp receipt');
    return null;
  }
}

/**
 * Estimate UserOperation gas
 */
export async function estimateUserOpGas(
  userOp: Partial<UserOperation>,
  entryPoint: string = '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789'
): Promise<{
  callGasLimit: string;
  verificationGasLimit: string;
  preVerificationGas: string;
}> {
  try {
    const response = await fetch(PIMLICO_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_estimateUserOperationGas',
        params: [userOp, entryPoint],
      }),
      signal: AbortSignal.timeout(TIMEOUTS.API),
    });

    if (!response.ok) {
      throw new Error(`Pimlico API error: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(`Pimlico error: ${data.error.message}`);
    }

    return data.result;
  } catch (error) {
    logger.error({ error }, 'Failed to estimate UserOp gas');
    throw error;
  }
}


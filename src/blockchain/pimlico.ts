/**
 * Vortex Protocol - Pimlico Integration
 * Primary AA bundler and paymaster for ERC-4337 Account Abstraction
 * 
 * API Documentation: https://docs.pimlico.io
 */

import { env } from '../config/env';
import { createLogger } from '../utils/logger';
import { TIMEOUTS } from '../config/constants';

const logger = createLogger('pimlico');

const PIMLICO_BASE_URL = env.NEXT_PUBLIC_PIMLICO_BASE_URL;
const PIMLICO_API_KEY = env.PIMLICO_API_KEY;

// ERC-4337 EntryPoint v0.6
const ENTRY_POINT_V06 = '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789';

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
 * Get next nonce for sender address
 */
export async function getUserOpNonce(
  sender: string,
  entryPoint: string = ENTRY_POINT_V06
): Promise<string> {
  if (!PIMLICO_BASE_URL) {
    throw new Error('Pimlico base URL not configured');
  }

  try {
    const response = await fetch(PIMLICO_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_getUserOperationNonce',
        params: [sender, entryPoint],
      }),
      signal: AbortSignal.timeout(TIMEOUTS.API),
    });

    if (!response.ok) {
      throw new Error(`Pimlico API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(`Pimlico error: ${data.error.message}`);
    }

    return data.result || '0x0';
  } catch (error) {
    logger.error({ error, sender }, 'Failed to get UserOp nonce');
    throw error;
  }
}

/**
 * Get paymaster data to sponsor a UserOperation
 */
export async function sponsorUserOp(
  userOp: Partial<UserOperation>,
  entryPoint: string = ENTRY_POINT_V06
): Promise<SponsorUserOpResponse | null> {
  if (!PIMLICO_BASE_URL) {
    logger.error('Pimlico base URL not configured');
    return null;
  }

  try {
    logger.info({ sender: userOp.sender }, 'Requesting sponsorship from Pimlico');

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
      const errorText = await response.text();
      logger.error({ 
        status: response.status, 
        error: errorText.slice(0, 200),
        sender: userOp.sender 
      }, 'Pimlico sponsorship failed');
      return null;
    }

    const data = await response.json();

    if (data.error) {
      logger.error({ 
        error: data.error.message, 
        code: data.error.code,
        sender: userOp.sender 
      }, 'Pimlico sponsorship error');
      return null;
    }

    logger.info({ sender: userOp.sender }, 'UserOp sponsored by Pimlico');

    return data.result;
  } catch (error) {
    logger.error({ error, sender: userOp.sender }, 'Failed to sponsor UserOp with Pimlico');
    return null;
  }
}

/**
 * Send UserOperation to bundler
 */
export async function sendUserOp(
  userOp: UserOperation,
  entryPoint: string = ENTRY_POINT_V06
): Promise<string> {
  if (!PIMLICO_BASE_URL) {
    throw new Error('Pimlico base URL not configured');
  }

  try {
    // Validate UserOperation has required fields
    if (!userOp.sender || !userOp.callData || !userOp.signature) {
      throw new Error('Invalid UserOperation: missing required fields');
    }

    logger.info({ 
      sender: userOp.sender, 
      nonce: userOp.nonce,
      hasPaymaster: !!userOp.paymasterAndData && userOp.paymasterAndData !== '0x'
    }, 'Sending UserOp to Pimlico bundler');

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
      const errorText = await response.text();
      logger.error({ 
        status: response.status, 
        error: errorText.slice(0, 200) 
      }, 'Pimlico bundler request failed');
      throw new Error(`Pimlico bundler error: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.error) {
      logger.error({ 
        error: data.error.message, 
        code: data.error.code,
        data: data.error.data 
      }, 'Pimlico bundler error');
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
  entryPoint: string = ENTRY_POINT_V06
): Promise<{
  callGasLimit: string;
  verificationGasLimit: string;
  preVerificationGas: string;
} | null> {
  if (!PIMLICO_BASE_URL) {
    logger.error('Pimlico base URL not configured');
    return null;
  }

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
      const errorText = await response.text();
      logger.error({ 
        status: response.status, 
        error: errorText.slice(0, 200) 
      }, 'Pimlico gas estimation failed');
      return null;
    }

    const data = await response.json();

    if (data.error) {
      logger.error({ 
        error: data.error.message, 
        code: data.error.code 
      }, 'Pimlico gas estimation error');
      return null;
    }

    return data.result;
  } catch (error) {
    logger.error({ error }, 'Failed to estimate UserOp gas');
    return null;
  }
}

/**
 * Verify Pimlico configuration and connectivity
 */
export async function verifyPimlicoConfig(): Promise<{
  configured: boolean;
  reachable: boolean;
  error?: string;
}> {
  if (!PIMLICO_BASE_URL) {
    return { configured: false, reachable: false, error: 'Base URL not configured' };
  }

  if (!PIMLICO_API_KEY) {
    return { configured: false, reachable: false, error: 'API key not configured' };
  }

  try {
    // Try to get chain ID as connectivity test
    const response = await fetch(PIMLICO_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_chainId',
        params: [],
      }),
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      return { 
        configured: true, 
        reachable: false, 
        error: `HTTP ${response.status}` 
      };
    }

    const data = await response.json();
    if (data.error) {
      return { 
        configured: true, 
        reachable: false, 
        error: data.error.message 
      };
    }

    return { configured: true, reachable: true };
  } catch (error) {
    return { 
      configured: true, 
      reachable: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}


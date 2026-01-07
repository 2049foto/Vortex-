/**
 * Vortex Protocol - Coinbase Smart Wallet Integration
 * Fallback paymaster for Base
 */

import { env } from '../config/env';
import { createLogger } from '../utils/logger';
import { TIMEOUTS } from '../config/constants';
import type { UserOperation, SponsorUserOpResponse } from './pimlico';

const logger = createLogger('coinbase');

const CDP_PAYMASTER_URL = env.NEXT_PUBLIC_CDP_PAYMASTER_URL;

/**
 * Sponsor UserOperation with Coinbase Paymaster (Base only)
 */
export async function sponsorUserOpWithCoinbase(
  userOp: Partial<UserOperation>,
  entryPoint: string = '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789'
): Promise<SponsorUserOpResponse> {
  try {
    const response = await fetch(CDP_PAYMASTER_URL, {
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
      throw new Error(`Coinbase Paymaster error: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(`Coinbase Paymaster error: ${data.error.message}`);
    }

    logger.info({ userOpSender: userOp.sender }, 'UserOp sponsored by Coinbase Paymaster');

    return data.result;
  } catch (error) {
    logger.error({ error, userOp: userOp.sender }, 'Failed to sponsor UserOp with Coinbase');
    throw error;
  }
}

/**
 * Dual paymaster strategy: Pimlico primary, Coinbase fallback
 */
export async function sponsorWithFallback(
  userOp: Partial<UserOperation>,
  entryPoint: string = '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789'
): Promise<{ result: SponsorUserOpResponse; paymaster: 'pimlico' | 'coinbase' }> {
  // Import dynamically to avoid circular dependency
  const { sponsorUserOp: sponsorWithPimlico } = await import('./pimlico');

  // Try Pimlico first
  try {
    const result = await sponsorWithPimlico(userOp, entryPoint);
    return { result, paymaster: 'pimlico' };
  } catch (pimlicoError) {
    logger.warn(
      { error: pimlicoError, sender: userOp.sender },
      'Pimlico sponsorship failed, trying Coinbase fallback'
    );

    // Fallback to Coinbase
    try {
      const result = await sponsorUserOpWithCoinbase(userOp, entryPoint);
      return { result, paymaster: 'coinbase' };
    } catch (coinbaseError) {
      logger.error(
        { 
          pimlicoError,
          coinbaseError,
          sender: userOp.sender 
        },
        'Both paymasters failed'
      );
      throw new Error('Failed to sponsor UserOp: both Pimlico and Coinbase failed');
    }
  }
}


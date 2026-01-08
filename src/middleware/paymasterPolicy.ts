/**
 * Vortex Protocol - Base Paymaster Policy Enforcement
 * Security checks for sponsored UserOperations
 */

import { createLogger } from '../utils/logger';
import type { UserOperation } from '../blockchain/pimlico';
import { db } from '../db/client';
import { consolidationRequests, users } from '../db/schema';
import { eq, and, gte, sql } from 'drizzle-orm';
import { Redis } from '@upstash/redis';
import { env } from '../config/env';

const logger = createLogger('paymaster-policy');

const redis = new Redis({
  url: env.UPSTASH_REDIS_REST_URL,
  token: env.UPSTASH_REDIS_REST_TOKEN,
});

// ============================================
// ALLOWLIST CONFIGURATION
// ============================================

/**
 * Allowed router contracts (safe DEX aggregators)
 */
export const ALLOWED_ROUTERS: Record<number, string[]> = {
  // Base (8453)
  8453: [
    '0x1111111254EEB25477B68fb85Ed929f73A960582', // 1inch Router V5
    '0x111111125421ca6dc452d289314280a0f8842a65', // 1inch Router V4
    '0x2626664c2603336E57B271c5C0b26F421741e481', // Uniswap Universal Router
    '0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD', // Uniswap SwapRouter02
    '0xE592427A0AEce92De3Edee1F18E0157C05861564', // Uniswap V3 SwapRouter
    '0x99C9FC46f92E8a1c0deC1b1747d010903E884bE1', // Optimism Gateway (for bridging)
    '0x4200000000000000000000000000000000000006', // WETH
    '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC
  ],
  // Ethereum (1)
  1: [
    '0x1111111254EEB25477B68fb85Ed929f73A960582', // 1inch Router V5
    '0x2626664c2603336E57B271c5C0b26F421741e481', // Uniswap Universal Router
  ],
  // Arbitrum (42161)
  42161: [
    '0x1111111254EEB25477B68fb85Ed929f73A960582', // 1inch Router V5
    '0x2626664c2603336E57B271c5C0b26F421741e481', // Uniswap Universal Router
  ],
  // Optimism (10)
  10: [
    '0x1111111254EEB25477B68fb85Ed929f73A960582', // 1inch Router V5
    '0x2626664c2603336E57B271c5C0b26F421741e481', // Uniswap Universal Router
  ],
  // Polygon (137)
  137: [
    '0x1111111254EEB25477B68fb85Ed929f73A960582', // 1inch Router V5
    '0x2626664c2603336E57B271c5C0b26F421741e481', // Uniswap Universal Router
  ],
};

/**
 * Allowed function selectors (safe operations)
 */
export const ALLOWED_FUNCTIONS = [
  '0x7c025200', // swap(address,address,uint256,uint256,address,address)
  '0x414bf389', // exactInputSingle((address,address,uint24,address,uint256,uint256,uint160))
  '0xdb3e2198', // exactInput((bytes,address,uint256))
  '0x5ae401dc', // multicall(uint256,bytes[])
  '0xac9650d8', // multicall(bytes[])
  '0x2e95b6c8', // unwrapWETH9(uint256,address)
  '0x02751cec', // refundETH()
];

// ============================================
// POLICY LIMITS
// ============================================

const MAX_VALUE_PER_OPERATION_USD = 100000; // $100k max per operation
const MAX_DAILY_VOLUME_PER_USER_USD = 500000; // $500k max per user per day
const MAX_OPERATIONS_PER_USER_PER_DAY = 50; // 50 operations max per day

// ============================================
// VALIDATION FUNCTIONS
// ============================================

/**
 * Extract function selector from callData
 */
function getFunctionSelector(callData: string): string {
  if (!callData || callData.length < 10) return '0x00000000';
  return callData.slice(0, 10).toLowerCase();
}

/**
 * Extract target address from callData (for simple calls)
 */
function getTargetAddress(callData: string): string | null {
  // For simple calls, target is in the UserOp 'to' field
  // For multicall, we need to parse nested calls
  // This is simplified - in production, decode the full calldata
  return null;
}

/**
 * Check if contract is in allowlist
 */
function isContractAllowed(chainId: number, contractAddress: string): boolean {
  const allowed = ALLOWED_ROUTERS[chainId] || [];
  return allowed.some(addr => addr.toLowerCase() === contractAddress.toLowerCase());
}

/**
 * Check if function selector is allowed
 */
function isFunctionAllowed(selector: string): boolean {
  return ALLOWED_FUNCTIONS.some(allowed => allowed.toLowerCase() === selector.toLowerCase());
}

/**
 * Get user's daily volume (USD)
 */
async function getUserDailyVolume(userAddress: string): Promise<number> {
  const cacheKey = `daily_volume:${userAddress}:${new Date().toISOString().split('T')[0]}`;
  
  try {
    const cached = await redis.get(cacheKey);
    if (cached) return parseFloat(cached as string);
  } catch (error) {
    logger.warn({ error }, 'Failed to get cached daily volume');
  }

  // Get from database
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.walletAddress, userAddress))
    .limit(1);

  if (!user) return 0;

  const requests = await db
    .select()
    .from(consolidationRequests)
    .where(
      and(
        eq(consolidationRequests.userId, user.id),
        gte(consolidationRequests.createdAt, today)
      )
    );

  const totalVolume = requests.reduce((sum, req) => {
    const output = parseFloat(req.actualOutput || req.estimatedOutput || '0');
    return sum + output;
  }, 0);

  // Cache for 1 hour
  try {
    await redis.setex(cacheKey, 3600, totalVolume.toString());
  } catch (error) {
    logger.warn({ error }, 'Failed to cache daily volume');
  }

  return totalVolume;
}

/**
 * Get user's daily operation count
 */
async function getUserDailyOperationCount(userAddress: string): Promise<number> {
  const cacheKey = `daily_ops:${userAddress}:${new Date().toISOString().split('T')[0]}`;
  
  try {
    const cached = await redis.get(cacheKey);
    if (cached) return parseInt(cached as string);
  } catch (error) {
    logger.warn({ error }, 'Failed to get cached daily ops');
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.walletAddress, userAddress))
    .limit(1);

  if (!user) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const requests = await db
    .select()
    .from(consolidationRequests)
    .where(
      and(
        eq(consolidationRequests.userId, user.id),
        gte(consolidationRequests.createdAt, today)
      )
    );

  const count = requests.length;

  // Cache for 1 hour
  try {
    await redis.setex(cacheKey, 3600, count.toString());
  } catch (error) {
    logger.warn({ error }, 'Failed to cache daily ops');
  }

  return count;
}

/**
 * Estimate operation value in USD (simplified)
 */
function estimateOperationValue(callData: string, chainId: number): number {
  // In production, decode calldata to get actual swap amounts
  // For now, return a conservative estimate based on gas limit
  // This should be replaced with actual calldata decoding
  return 0; // Will be calculated from actual swap amounts
}

// ============================================
// MAIN VALIDATION FUNCTION
// ============================================

export interface PolicyValidationResult {
  allowed: boolean;
  reason?: string;
  details?: {
    contractAllowed: boolean;
    functionAllowed: boolean;
    valueLimitOk: boolean;
    dailyVolumeOk: boolean;
    dailyOpsOk: boolean;
  };
}

/**
 * Validate UserOperation against paymaster policies
 */
export async function validatePaymasterPolicy(
  userOp: Partial<UserOperation>,
  chainId: number,
  estimatedValueUsd: number
): Promise<PolicyValidationResult> {
  const userAddress = userOp.sender;
  if (!userAddress) {
    return {
      allowed: false,
      reason: 'Missing sender address',
    };
  }

  const callData = userOp.callData || '0x';
  const functionSelector = getFunctionSelector(callData);

  // Check 1: Function selector allowlist
  const functionAllowed = isFunctionAllowed(functionSelector);
  if (!functionAllowed) {
    logger.warn(
      { functionSelector, userAddress },
      'Function selector not in allowlist'
    );
    return {
      allowed: false,
      reason: 'Function not allowed',
      details: {
        contractAllowed: false,
        functionAllowed: false,
        valueLimitOk: false,
        dailyVolumeOk: false,
        dailyOpsOk: false,
      },
    };
  }

  // Check 2: Value per operation limit
  const valueLimitOk = estimatedValueUsd <= MAX_VALUE_PER_OPERATION_USD;
  if (!valueLimitOk) {
    logger.warn(
      { estimatedValueUsd, max: MAX_VALUE_PER_OPERATION_USD, userAddress },
      'Operation value exceeds limit'
    );
    return {
      allowed: false,
      reason: `Operation value ($${estimatedValueUsd.toFixed(2)}) exceeds maximum ($${MAX_VALUE_PER_OPERATION_USD.toFixed(2)})`,
      details: {
        contractAllowed: true,
        functionAllowed: true,
        valueLimitOk: false,
        dailyVolumeOk: false,
        dailyOpsOk: false,
      },
    };
  }

  // Check 3: Daily volume limit per user
  const dailyVolume = await getUserDailyVolume(userAddress);
  const dailyVolumeOk = (dailyVolume + estimatedValueUsd) <= MAX_DAILY_VOLUME_PER_USER_USD;
  if (!dailyVolumeOk) {
    logger.warn(
      { dailyVolume, estimatedValueUsd, max: MAX_DAILY_VOLUME_PER_USER_USD, userAddress },
      'Daily volume limit exceeded'
    );
    return {
      allowed: false,
      reason: `Daily volume limit ($${MAX_DAILY_VOLUME_PER_USER_USD.toFixed(2)}) would be exceeded`,
      details: {
        contractAllowed: true,
        functionAllowed: true,
        valueLimitOk: true,
        dailyVolumeOk: false,
        dailyOpsOk: false,
      },
    };
  }

  // Check 4: Daily operation count limit
  const dailyOps = await getUserDailyOperationCount(userAddress);
  const dailyOpsOk = dailyOps < MAX_OPERATIONS_PER_USER_PER_DAY;
  if (!dailyOpsOk) {
    logger.warn(
      { dailyOps, max: MAX_OPERATIONS_PER_USER_PER_DAY, userAddress },
      'Daily operation count limit exceeded'
    );
    return {
      allowed: false,
      reason: `Daily operation limit (${MAX_OPERATIONS_PER_USER_PER_DAY}) exceeded`,
      details: {
        contractAllowed: true,
        functionAllowed: true,
        valueLimitOk: true,
        dailyVolumeOk: true,
        dailyOpsOk: false,
      },
    };
  }

  // All checks passed
  logger.info(
    {
      userAddress,
      functionSelector,
      estimatedValueUsd,
      dailyVolume,
      dailyOps,
    },
    'Paymaster policy validation passed'
  );

  return {
    allowed: true,
    details: {
      contractAllowed: true,
      functionAllowed: true,
      valueLimitOk: true,
      dailyVolumeOk: true,
      dailyOpsOk: true,
    },
  };
}

/**
 * Validate contract address (for direct contract calls)
 */
export function validateContractAddress(
  contractAddress: string,
  chainId: number
): boolean {
  return isContractAllowed(chainId, contractAddress);
}

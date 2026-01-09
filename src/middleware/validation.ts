/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * VORTEX PROTOCOL - Validation Middleware 2026
 * Input validation, sanitization, and security checks
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { z } from 'zod';
import { createLogger } from '../utils/logger';

const logger = createLogger('validation');

// ═══════════════════════════════════════════════════════════════════════════════
// COMMON SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Ethereum address validation
 */
export const ethereumAddressSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address format')
  .transform((val) => val.toLowerCase() as `0x${string}`);

/**
 * Solana address validation
 */
export const solanaAddressSchema = z
  .string()
  .regex(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/, 'Invalid Solana address format');

/**
 * ENS name validation
 */
export const ensNameSchema = z
  .string()
  .regex(/^[a-zA-Z0-9-]+\.eth$/, 'Invalid ENS name format')
  .transform((val) => val.toLowerCase());

/**
 * Base name validation
 */
export const baseNameSchema = z
  .string()
  .regex(/^[a-zA-Z0-9-]+\.base\.eth$/, 'Invalid Base name format')
  .transform((val) => val.toLowerCase());

/**
 * Generic wallet address (ETH or ENS)
 */
export const walletAddressSchema = z.union([
  ethereumAddressSchema,
  ensNameSchema,
  baseNameSchema,
]);

/**
 * Chain ID validation
 */
export const chainIdSchema = z
  .number()
  .int()
  .refine(
    (val) => [1, 8453, 42161, 10, 137, 56, 43114, 324, 838592, 0].includes(val),
    'Unsupported chain ID'
  );

/**
 * Token address validation (includes native token sentinel)
 */
export const tokenAddressSchema = z.union([
  ethereumAddressSchema,
  z.literal('0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'), // Native token sentinel
]);

/**
 * Amount validation (string or number, must be positive)
 */
export const amountSchema = z
  .union([z.string(), z.number()])
  .transform((val) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return num;
  })
  .refine((val) => !isNaN(val) && val > 0, 'Amount must be a positive number');

/**
 * Slippage validation (0.01 to 50%)
 */
export const slippageSchema = z
  .number()
  .min(0.01, 'Slippage too low')
  .max(50, 'Slippage too high (max 50%)')
  .default(1);

/**
 * Transaction hash validation
 */
export const txHashSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{64}$/, 'Invalid transaction hash format');

// ═══════════════════════════════════════════════════════════════════════════════
// REQUEST SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Scan request schema
 */
export const scanRequestSchema = z.object({
  walletAddress: walletAddressSchema,
  chainIds: z.array(chainIdSchema).optional(),
  includeSolana: z.boolean().optional().default(false),
  solanaAddress: solanaAddressSchema.optional(),
  turnstileToken: z.string().optional(),
});

export type ScanRequest = z.infer<typeof scanRequestSchema>;

/**
 * Swap/Consolidation request schema
 */
export const swapRequestSchema = z.object({
  walletAddress: ethereumAddressSchema,
  selectedTokens: z.array(
    z.object({
      chainId: chainIdSchema,
      address: tokenAddressSchema,
    })
  ).min(1, 'At least one token required'),
  outputToken: z.enum(['ETH', 'USDC']).default('ETH'),
  slippagePct: slippageSchema,
  dryRun: z.boolean().optional().default(false),
  turnstileToken: z.string().optional(),
});

export type SwapRequest = z.infer<typeof swapRequestSchema>;

/**
 * Status request schema
 */
export const statusRequestSchema = z.object({
  requestId: z.string().uuid('Invalid request ID format'),
});

export type StatusRequest = z.infer<typeof statusRequestSchema>;

// ═══════════════════════════════════════════════════════════════════════════════
// VALIDATION UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Validate request body with schema
 */
export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string; details?: z.ZodError['errors'] } {
  try {
    const result = schema.safeParse(data);
    
    if (result.success) {
      return { success: true, data: result.data };
    }

    const errorMessages = result.error.errors
      .map((e) => `${e.path.join('.')}: ${e.message}`)
      .join(', ');

    logger.warn({ errors: result.error.errors }, 'Validation failed');

    return {
      success: false,
      error: `Validation failed: ${errorMessages}`,
      details: result.error.errors,
    };
  } catch (error) {
    logger.error({ error }, 'Unexpected validation error');
    return { success: false, error: 'Validation error' };
  }
}

/**
 * Sanitize string to prevent injection
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove HTML brackets
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
    .trim()
    .slice(0, 10000); // Max length
}

/**
 * Check if address is a known malicious contract
 */
const BLACKLISTED_ADDRESSES = new Set([
  // Add known scam/malicious contract addresses here
  '0x0000000000000000000000000000000000000000', // Zero address
]);

export function isBlacklistedAddress(address: string): boolean {
  return BLACKLISTED_ADDRESSES.has(address.toLowerCase());
}

/**
 * Validate wallet has reasonable activity (anti-bot)
 */
export function isReasonableWallet(
  tokenCount: number,
  totalValue: number
): boolean {
  // Suspicious if wallet has > 1000 tokens or value > $10M
  if (tokenCount > 1000) return false;
  if (totalValue > 10_000_000) return false;
  return true;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECURITY CHECKS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Check for suspicious patterns in request
 */
export function detectSuspiciousRequest(request: {
  ip?: string;
  userAgent?: string;
  referer?: string;
}): { suspicious: boolean; reasons: string[] } {
  const reasons: string[] = [];

  // Check for missing user agent (likely bot)
  if (!request.userAgent || request.userAgent.length < 10) {
    reasons.push('Missing or invalid user agent');
  }

  // Check for known bot user agents
  const botPatterns = [
    /curl/i,
    /wget/i,
    /python-requests/i,
    /scrapy/i,
    /bot/i,
    /spider/i,
    /crawler/i,
  ];
  
  if (request.userAgent && botPatterns.some((p) => p.test(request.userAgent!))) {
    reasons.push('Bot-like user agent detected');
  }

  return {
    suspicious: reasons.length > 0,
    reasons,
  };
}

/**
 * Calculate request risk score
 */
export function calculateRequestRiskScore(params: {
  tokensCount: number;
  totalValue: number;
  hasValidTurnstile: boolean;
  ipReputation?: 'good' | 'neutral' | 'bad';
}): number {
  let score = 0;

  // High value transactions increase risk
  if (params.totalValue > 10000) score += 20;
  if (params.totalValue > 50000) score += 30;

  // Many tokens might indicate farming
  if (params.tokensCount > 50) score += 10;
  if (params.tokensCount > 100) score += 20;

  // No Turnstile verification increases risk
  if (!params.hasValidTurnstile) score += 25;

  // IP reputation
  if (params.ipReputation === 'bad') score += 30;
  if (params.ipReputation === 'neutral') score += 10;

  return Math.min(100, score);
}

export default {
  validateRequest,
  sanitizeString,
  isBlacklistedAddress,
  isReasonableWallet,
  detectSuspiciousRequest,
  calculateRequestRiskScore,
  schemas: {
    scan: scanRequestSchema,
    swap: swapRequestSchema,
    status: statusRequestSchema,
    ethereumAddress: ethereumAddressSchema,
    solanaAddress: solanaAddressSchema,
    chainId: chainIdSchema,
    amount: amountSchema,
    slippage: slippageSchema,
  },
};

/**
 * Vortex Protocol - Validation Schemas
 * Zod schemas for request/response validation
 */

import { z } from 'zod';

// ============================================
// COMMON SCHEMAS
// ============================================
export const addressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/);
export const chainIdSchema = z.number().int().positive();
export const amountSchema = z.string().regex(/^\d+$/);

// ============================================
// SCAN REQUEST
// ============================================
export const scanRequestSchema = z.object({
  walletAddress: addressSchema,
  chains: z.array(chainIdSchema).optional(),
  includeDustValueUsd: z.number().min(0).max(10).optional().default(0.01),
  turnstileToken: z.string().min(1),
});

export type ScanRequest = z.infer<typeof scanRequestSchema>;

// ============================================
// SWAP REQUEST
// ============================================
export const swapRequestSchema = z.object({
  walletAddress: addressSchema,
  selectedTokens: z.array(
    z.object({
      address: addressSchema,
      chainId: chainIdSchema,
      amountRaw: amountSchema.optional(),
    })
  ).min(1).max(20),
  outputToken: z.enum(['ETH', 'USDC']),
  outputChainId: chainIdSchema.optional().default(8453),
  slippagePct: z.number().min(0.1).max(5).optional().default(0.5),
  dryRun: z.boolean().optional().default(false),
  turnstileToken: z.string().min(1),
});

export type SwapRequest = z.infer<typeof swapRequestSchema>;

// ============================================
// FRAME REQUEST (Farcaster)
// ============================================
export const frameRequestSchema = z.object({
  untrustedData: z.object({
    fid: z.number(),
    url: z.string().url(),
    messageHash: z.string(),
    timestamp: z.number(),
    network: z.number(),
    buttonIndex: z.number().optional(),
    inputText: z.string().optional(),
    castId: z.object({
      fid: z.number(),
      hash: z.string(),
    }).optional(),
  }),
  trustedData: z.object({
    messageBytes: z.string(),
  }),
});

export type FrameRequest = z.infer<typeof frameRequestSchema>;

// ============================================
// NOTIFICATION TOKEN REGISTRATION
// ============================================
export const notificationTokenSchema = z.object({
  walletAddress: addressSchema,
  clientId: z.string().min(1),
  callbackUrl: z.string().url(),
  token: z.string().min(1),
});

export type NotificationTokenRequest = z.infer<typeof notificationTokenSchema>;


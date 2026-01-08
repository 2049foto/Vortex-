/**
 * Vortex Protocol - Environment Configuration
 * Validates and exports all environment variables
 * Updated: Phase 1 Production (Jan 2026)
 */

import { z } from 'zod';

const envSchema = z.object({
  // ============================================
  // SERVER & APP CONFIG
  // ============================================
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3001'),
  NEXT_PUBLIC_APP_URL: z.string().default('https://dust-sweeper-yrjq.vercel.app'),
  NEXT_PUBLIC_APP_NAME: z.string().default('Vortex Protocol'),
  NEXT_PUBLIC_API_URL: z.string().optional(),
  
  // ============================================
  // DATABASE - NEON POSTGRESQL
  // ============================================
  DATABASE_URL: z.string(),
  DATABASE_POOL_MIN: z.string().default('2'),
  DATABASE_POOL_MAX: z.string().default('10'),
  
  // ============================================
  // CACHE - UPSTASH REDIS
  // ============================================
  UPSTASH_REDIS_REST_URL: z.string(),
  UPSTASH_REDIS_REST_TOKEN: z.string(),
  
  // ============================================
  // AUTHENTICATION & SECURITY
  // ============================================
  JWT_SECRET: z.string().min(20),
  NEXTAUTH_SECRET: z.string().min(20),
  TURNSTILE_SECRET_KEY: z.string().optional(),
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().optional(),
  
  // ============================================
  // BLOCKCHAIN RPC - EVM (QuickNode, Alchemy, Infura)
  // ============================================
  NEXT_PUBLIC_QUICKNODE_BASE_HTTPS: z.string().default('https://mainnet.base.org'),
  NEXT_PUBLIC_ALCHEMY_API_KEY: z.string(),
  NEXT_PUBLIC_INFURA_PROJECT_ID: z.string(),
  
  // ============================================
  // BLOCKCHAIN RPC - SOLANA (Helius, QuickNode)
  // ============================================
  NEXT_PUBLIC_QUICKNODE_SOLANA_HTTPS: z.string().optional(),
  NEXT_PUBLIC_HELIUS_RPC: z.string().optional(),
  NEXT_PUBLIC_HELIUS_API_KEY: z.string().optional(),
  
  // ============================================
  // DATA INDEXING - MORALIS
  // ============================================
  MORALIS_API_KEY: z.string(),
  NEXT_PUBLIC_MORALIS_API_URL: z.string().default('https://deep-index.moralis.io/api/v2.2'),
  
  // ============================================
  // ACCOUNT ABSTRACTION - PIMLICO & COINBASE
  // ============================================
  PIMLICO_API_KEY: z.string(),
  NEXT_PUBLIC_PIMLICO_BASE_URL: z.string(),
  NEXT_PUBLIC_CDP_PAYMASTER_URL: z.string(),
  NEXT_PUBLIC_ONCHAINKIT_API_KEY: z.string().optional(),
  
  // ============================================
  // DEX AGGREGATORS - 1inch, 0x, Jupiter
  // ============================================
  ONEINCH_API_KEY: z.string(),
  NEXT_PUBLIC_ONEINCH_API_URL: z.string().default('https://api.1inch.dev'),
  ZEROX_API_KEY: z.string().optional(),
  NEXT_PUBLIC_ZEROX_API_URL: z.string().default('https://api.0x.org'),
  JUPITER_API_KEY: z.string().optional(),
  NEXT_PUBLIC_JUPITER_API_URL: z.string().default('https://quote-api.jup.ag/v6'),
  
  // ============================================
  // SECURITY & SIMULATION - TENDERLY, GOPLUS
  // ============================================
  TENDERLY_API_KEY: z.string(),
  TENDERLY_USERNAME: z.string(),
  TENDERLY_PROJECT: z.string(),
  GOPLUS_API_KEY: z.string(),
  NEXT_PUBLIC_GOPLUS_API_URL: z.string().default('https://api.gopluslabs.io/api/v1'),
  HONEYPOT_API_URL: z.string().default('https://api.honeypot.is/v2'),
  
  // ============================================
  // ANALYTICS - POSTHOG, SENTRY
  // ============================================
  NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_HOST: z.string().default('https://us.i.posthog.com'),
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
  
  // ============================================
  // FARCASTER INTEGRATION
  // ============================================
  FARCASTER_FRAMES_ENABLED: z.string().default('true'),
  FARCASTER_API_URL: z.string().default('https://api.warpcast.com'),
  FARCASTER_BOT_TOKEN: z.string().optional(),
  NEXT_PUBLIC_FARCASTER_HUB_URL: z.string().optional(),
  
  // ============================================
  // WALLET CONNECTION
  // ============================================
  NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID: z.string().default('69915bbd15f146b792917c4f1a657139'),
  
  // ============================================
  // SUBSCRIPTION & PAYMENTS
  // ============================================
  SUBSCRIPTION_CONTRACT_ADDRESS: z.string().optional(),
});

// Parse and validate environment variables
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(JSON.stringify(parsed.error.format(), null, 2));
  throw new Error('Invalid environment variables');
}

export const env = parsed.data;

// Helper to check if production
export const isProd = env.NODE_ENV === 'production';
export const isDev = env.NODE_ENV === 'development';
export const isTest = env.NODE_ENV === 'test';


/**
 * Vortex Protocol - Environment Configuration
 * Validates and exports all environment variables
 * Updated: Phase 1 Production (Jan 2026)
 * 
 * IMPORTANT: All variables have fallback defaults to prevent crash
 */

import { z } from 'zod';

const envSchema = z.object({
  // ============================================
  // SERVER & APP CONFIG
  // ============================================
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3001'),
  NEXT_PUBLIC_APP_URL: z.string().default('https://vortexbase.vercel.app'),
  NEXT_PUBLIC_APP_NAME: z.string().default('Vortex Protocol'),
  NEXT_PUBLIC_API_URL: z.string().optional(),
  
  // ============================================
  // DATABASE - NEON POSTGRESQL (optional for scan)
  // ============================================
  DATABASE_URL: z.string().default(''),
  DATABASE_POOL_MIN: z.string().default('2'),
  DATABASE_POOL_MAX: z.string().default('10'),
  
  // ============================================
  // CACHE - UPSTASH REDIS (optional - will use memory fallback)
  // ============================================
  UPSTASH_REDIS_REST_URL: z.string().default(''),
  UPSTASH_REDIS_REST_TOKEN: z.string().default(''),
  
  // ============================================
  // AUTHENTICATION & SECURITY
  // ============================================
  JWT_SECRET: z.string().default('vortex-dev-jwt-secret-min20chars'),
  NEXTAUTH_SECRET: z.string().default('vortex-dev-nextauth-secret-min20'),
  TURNSTILE_SECRET_KEY: z.string().optional(),
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().optional(),
  
  // ============================================
  // BLOCKCHAIN RPC - EVM (QuickNode, Alchemy, Infura)
  // ============================================
  NEXT_PUBLIC_QUICKNODE_BASE_HTTPS: z.string().default('https://mainnet.base.org'),
  NEXT_PUBLIC_ALCHEMY_API_KEY: z.string().default(''),
  NEXT_PUBLIC_INFURA_PROJECT_ID: z.string().default(''),
  
  // ============================================
  // BLOCKCHAIN RPC - SOLANA (Helius, QuickNode)
  // ============================================
  NEXT_PUBLIC_QUICKNODE_SOLANA_HTTPS: z.string().optional(),
  NEXT_PUBLIC_HELIUS_RPC: z.string().optional(),
  NEXT_PUBLIC_HELIUS_API_KEY: z.string().optional(),
  
  // ============================================
  // DATA INDEXING - MORALIS (REQUIRED for scanning)
  // ============================================
  MORALIS_API_KEY: z.string().default(''),
  NEXT_PUBLIC_MORALIS_API_URL: z.string().default('https://deep-index.moralis.io/api/v2.2'),
  
  // ============================================
  // ACCOUNT ABSTRACTION - PIMLICO & COINBASE
  // ============================================
  PIMLICO_API_KEY: z.string().default(''),
  NEXT_PUBLIC_PIMLICO_BASE_URL: z.string().default(''),
  NEXT_PUBLIC_CDP_PAYMASTER_URL: z.string().default(''),
  NEXT_PUBLIC_ONCHAINKIT_API_KEY: z.string().optional(),
  
  // ============================================
  // DEX AGGREGATORS - 1inch, 0x, Jupiter
  // ============================================
  ONEINCH_API_KEY: z.string().default(''),
  NEXT_PUBLIC_ONEINCH_API_URL: z.string().default('https://api.1inch.dev'),
  ZEROX_API_KEY: z.string().optional(),
  NEXT_PUBLIC_ZEROX_API_URL: z.string().default('https://api.0x.org'),
  JUPITER_API_KEY: z.string().optional(),
  NEXT_PUBLIC_JUPITER_API_URL: z.string().default('https://quote-api.jup.ag/v6'),
  
  // ============================================
  // SECURITY & SIMULATION - TENDERLY, GOPLUS
  // ============================================
  TENDERLY_API_KEY: z.string().default(''),
  TENDERLY_USERNAME: z.string().default(''),
  TENDERLY_PROJECT: z.string().default(''),
  GOPLUS_API_KEY: z.string().default(''),
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

// Parse and validate - never throw, just warn
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.warn('⚠️ Some environment variables are missing or invalid:');
  console.warn(JSON.stringify(parsed.error.format(), null, 2));
  console.warn('Using default values where possible...');
}

// Export parsed data or create safe defaults
export const env = parsed.success ? parsed.data : {
  NODE_ENV: 'development' as const,
  PORT: '3001',
  NEXT_PUBLIC_APP_URL: 'https://vortexbase.vercel.app',
  NEXT_PUBLIC_APP_NAME: 'Vortex Protocol',
  DATABASE_URL: '',
  DATABASE_POOL_MIN: '2',
  DATABASE_POOL_MAX: '10',
  UPSTASH_REDIS_REST_URL: '',
  UPSTASH_REDIS_REST_TOKEN: '',
  JWT_SECRET: 'vortex-dev-jwt-secret-min20chars',
  NEXTAUTH_SECRET: 'vortex-dev-nextauth-secret-min20',
  NEXT_PUBLIC_QUICKNODE_BASE_HTTPS: 'https://mainnet.base.org',
  NEXT_PUBLIC_ALCHEMY_API_KEY: '',
  NEXT_PUBLIC_INFURA_PROJECT_ID: '',
  MORALIS_API_KEY: process.env.MORALIS_API_KEY || '',
  NEXT_PUBLIC_MORALIS_API_URL: 'https://deep-index.moralis.io/api/v2.2',
  PIMLICO_API_KEY: '',
  NEXT_PUBLIC_PIMLICO_BASE_URL: '',
  NEXT_PUBLIC_CDP_PAYMASTER_URL: '',
  ONEINCH_API_KEY: '',
  NEXT_PUBLIC_ONEINCH_API_URL: 'https://api.1inch.dev',
  NEXT_PUBLIC_ZEROX_API_URL: 'https://api.0x.org',
  NEXT_PUBLIC_JUPITER_API_URL: 'https://quote-api.jup.ag/v6',
  TENDERLY_API_KEY: '',
  TENDERLY_USERNAME: '',
  TENDERLY_PROJECT: '',
  GOPLUS_API_KEY: '',
  NEXT_PUBLIC_GOPLUS_API_URL: 'https://api.gopluslabs.io/api/v1',
  HONEYPOT_API_URL: 'https://api.honeypot.is/v2',
  NEXT_PUBLIC_POSTHOG_HOST: 'https://us.i.posthog.com',
  FARCASTER_FRAMES_ENABLED: 'true',
  FARCASTER_API_URL: 'https://api.warpcast.com',
  NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID: '69915bbd15f146b792917c4f1a657139',
};

// Helper to check if production
export const isProd = env.NODE_ENV === 'production';
export const isDev = env.NODE_ENV === 'development';
export const isTest = env.NODE_ENV === 'test';


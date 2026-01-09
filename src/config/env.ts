/**
 * Vortex Protocol - Environment Configuration
 * Validates and exports all environment variables
 * Updated: Phase 1 Production Ready (Jan 9, 2026)
 * 
 * IMPORTANT: All variables have fallback defaults to prevent crash
 * Phase 1 MVP: Scan/Swap 11 chains, Farcaster integration, Base Grant ready
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
  // DATABASE - NEON POSTGRESQL (REQUIRED for Phase 1)
  // ============================================
  DATABASE_URL: z.string().default(''),
  DATABASE_POOL_MIN: z.string().default('2'),
  DATABASE_POOL_MAX: z.string().default('10'),
  
  // ============================================
  // CACHE - UPSTASH REDIS (REQUIRED for Phase 1)
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
  TURNSTILE_STRICT_MODE: z.string().optional(), // 'true' to enable strict mode in production
  
  // ============================================
  // BLOCKCHAIN RPC - EVM (QuickNode, Alchemy, Infura)
  // REQUIRED: At least one RPC provider for each chain
  // ============================================
  NEXT_PUBLIC_QUICKNODE_BASE_HTTPS: z.string().default('https://mainnet.base.org'),
  NEXT_PUBLIC_ALCHEMY_API_KEY: z.string().default(''),
  NEXT_PUBLIC_INFURA_PROJECT_ID: z.string().default(''),
  
  // ============================================
  // BLOCKCHAIN RPC - SOLANA (Helius for scanning)
  // REQUIRED for Solana chain support
  // ============================================
  NEXT_PUBLIC_QUICKNODE_SOLANA_HTTPS: z.string().optional(),
  NEXT_PUBLIC_HELIUS_RPC: z.string().optional(),
  NEXT_PUBLIC_HELIUS_API_KEY: z.string().optional(),
  
  // ============================================
  // DATA INDEXING - MORALIS (REQUIRED for scanning)
  // Primary API for EVM token scanning
  // ============================================
  MORALIS_API_KEY: z.string().default(''),
  NEXT_PUBLIC_MORALIS_API_URL: z.string().default('https://deep-index.moralis.io/api/v2.2'),
  
  // ============================================
  // ACCOUNT ABSTRACTION - PIMLICO & COINBASE (REQUIRED for gasless)
  // Pimlico: Primary bundler + paymaster
  // Coinbase: Fallback paymaster for Base
  // ============================================
  PIMLICO_API_KEY: z.string().default(''),
  NEXT_PUBLIC_PIMLICO_BASE_URL: z.string().default(''),
  NEXT_PUBLIC_CDP_PAYMASTER_URL: z.string().default(''),
  NEXT_PUBLIC_ONCHAINKIT_API_KEY: z.string().optional(),
  
  // ============================================
  // DEX AGGREGATORS - 1inch, 0x, Jupiter (REQUIRED for swaps)
  // 1inch: Primary multi-chain aggregator
  // Jupiter: Solana DEX aggregator
  // ============================================
  ONEINCH_API_KEY: z.string().default(''),
  NEXT_PUBLIC_ONEINCH_API_URL: z.string().default('https://api.1inch.dev'),
  ZEROX_API_KEY: z.string().optional(),
  NEXT_PUBLIC_ZEROX_API_URL: z.string().default('https://api.0x.org'),
  JUPITER_API_KEY: z.string().optional(),
  NEXT_PUBLIC_JUPITER_API_URL: z.string().default('https://quote-api.jup.ag/v6'),
  
  // ============================================
  // SECURITY & SIMULATION - TENDERLY, GOPLUS
  // Optional for Phase 1 - Enhanced in Phase 2
  // ============================================
  TENDERLY_API_KEY: z.string().optional(),
  TENDERLY_USERNAME: z.string().optional(),
  TENDERLY_PROJECT: z.string().optional(),
  GOPLUS_API_KEY: z.string().optional(),
  NEXT_PUBLIC_GOPLUS_API_URL: z.string().default('https://api.gopluslabs.io/api/v1'),
  HONEYPOT_API_URL: z.string().default('https://api.honeypot.is/v2'),
  HONEYPOT_ENABLED: z.string().default('true'),
  
  // ============================================
  // ANALYTICS - POSTHOG, SENTRY
  // Optional but recommended for production
  // ============================================
  NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_HOST: z.string().default('https://us.i.posthog.com'),
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
  
  // ============================================
  // FARCASTER INTEGRATION (REQUIRED for Phase 1 Grant)
  // Frames v2 + Mini App for viral distribution
  // ============================================
  FARCASTER_FRAMES_ENABLED: z.string().default('true'),
  FARCASTER_API_URL: z.string().default('https://api.warpcast.com'),
  FARCASTER_BOT_TOKEN: z.string().optional(),
  NEXT_PUBLIC_FARCASTER_HUB_URL: z.string().optional(),
  
  // ============================================
  // WALLET CONNECTION (REQUIRED)
  // WalletConnect for multi-wallet support
  // ============================================
  NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID: z.string().default('69915bbd15f146b792917c4f1a657139'),
  
  // ============================================
  // SUBSCRIPTION & PAYMENTS - Phase 2
  // OnchainKit Checkout for Pro tiers
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
  NEXT_PUBLIC_API_URL: undefined as string | undefined,
  DATABASE_URL: '',
  DATABASE_POOL_MIN: '2',
  DATABASE_POOL_MAX: '10',
  UPSTASH_REDIS_REST_URL: '',
  UPSTASH_REDIS_REST_TOKEN: '',
  JWT_SECRET: 'vortex-dev-jwt-secret-min20chars',
  NEXTAUTH_SECRET: 'vortex-dev-nextauth-secret-min20',
  TURNSTILE_SECRET_KEY: undefined as string | undefined,
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: undefined as string | undefined,
  TURNSTILE_STRICT_MODE: undefined as string | undefined,
  NEXT_PUBLIC_QUICKNODE_BASE_HTTPS: 'https://mainnet.base.org',
  NEXT_PUBLIC_ALCHEMY_API_KEY: '',
  NEXT_PUBLIC_INFURA_PROJECT_ID: '',
  NEXT_PUBLIC_QUICKNODE_SOLANA_HTTPS: undefined as string | undefined,
  NEXT_PUBLIC_HELIUS_RPC: undefined as string | undefined,
  NEXT_PUBLIC_HELIUS_API_KEY: undefined as string | undefined,
  MORALIS_API_KEY: process.env.MORALIS_API_KEY || '',
  NEXT_PUBLIC_MORALIS_API_URL: 'https://deep-index.moralis.io/api/v2.2',
  PIMLICO_API_KEY: '',
  NEXT_PUBLIC_PIMLICO_BASE_URL: '',
  NEXT_PUBLIC_CDP_PAYMASTER_URL: '',
  NEXT_PUBLIC_ONCHAINKIT_API_KEY: undefined as string | undefined,
  ONEINCH_API_KEY: '',
  NEXT_PUBLIC_ONEINCH_API_URL: 'https://api.1inch.dev',
  ZEROX_API_KEY: undefined as string | undefined,
  NEXT_PUBLIC_ZEROX_API_URL: 'https://api.0x.org',
  JUPITER_API_KEY: undefined as string | undefined,
  NEXT_PUBLIC_JUPITER_API_URL: 'https://quote-api.jup.ag/v6',
  TENDERLY_API_KEY: undefined as string | undefined,
  TENDERLY_USERNAME: undefined as string | undefined,
  TENDERLY_PROJECT: undefined as string | undefined,
  GOPLUS_API_KEY: undefined as string | undefined,
  NEXT_PUBLIC_GOPLUS_API_URL: 'https://api.gopluslabs.io/api/v1',
  HONEYPOT_API_URL: 'https://api.honeypot.is/v2',
  HONEYPOT_ENABLED: 'true',
  NEXT_PUBLIC_POSTHOG_KEY: undefined as string | undefined,
  NEXT_PUBLIC_POSTHOG_HOST: 'https://us.i.posthog.com',
  NEXT_PUBLIC_SENTRY_DSN: undefined as string | undefined,
  FARCASTER_FRAMES_ENABLED: 'true',
  FARCASTER_API_URL: 'https://api.warpcast.com',
  FARCASTER_BOT_TOKEN: undefined as string | undefined,
  NEXT_PUBLIC_FARCASTER_HUB_URL: undefined as string | undefined,
  NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID: '69915bbd15f146b792917c4f1a657139',
  SUBSCRIPTION_CONTRACT_ADDRESS: undefined as string | undefined,
};

// Helper to check if production
export const isProd = env.NODE_ENV === 'production';
export const isDev = env.NODE_ENV === 'development';
export const isTest = env.NODE_ENV === 'test';


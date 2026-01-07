/**
 * Vortex Protocol - Environment Configuration
 * Validates and exports all environment variables
 */

import { z } from 'zod';

const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3001'),
  
  // Database
  DATABASE_URL: z.string().url(),
  DATABASE_POOL_MIN: z.string().default('2'),
  DATABASE_POOL_MAX: z.string().default('10'),
  
  // Cache
  UPSTASH_REDIS_REST_URL: z.string().url(),
  UPSTASH_REDIS_REST_TOKEN: z.string(),
  
  // Authentication
  JWT_SECRET: z.string().min(32),
  NEXTAUTH_SECRET: z.string().min(32),
  
  // Blockchain RPC
  NEXT_PUBLIC_QUICKNODE_BASE_HTTPS: z.string().url(),
  NEXT_PUBLIC_ALCHEMY_API_KEY: z.string(),
  MORALIS_API_KEY: z.string(),
  NEXT_PUBLIC_INFURA_PROJECT_ID: z.string(),
  
  // Account Abstraction
  PIMLICO_API_KEY: z.string(),
  NEXT_PUBLIC_PIMLICO_BASE_URL: z.string().url(),
  NEXT_PUBLIC_CDP_PAYMASTER_URL: z.string().url(),
  
  // DEX Aggregators
  ONEINCH_API_KEY: z.string(),
  NEXT_PUBLIC_ONEINCH_API_URL: z.string().url(),
  ZEROX_API_KEY: z.string().optional(),
  
  // Security & Simulation
  TENDERLY_API_KEY: z.string(),
  TENDERLY_USERNAME: z.string(),
  TENDERLY_PROJECT: z.string(),
  TURNSTILE_SECRET_KEY: z.string(),
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string(),
  
  // Token Security APIs
  GOPLUS_API_KEY: z.string(),
  NEXT_PUBLIC_GOPLUS_API_URL: z.string().url(),
  
  // Analytics
  NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  
  // Farcaster
  FARCASTER_FRAMES_ENABLED: z.string().default('true'),
  NEXT_PUBLIC_FARCASTER_HUB_URL: z.string().url().optional(),
  
  // App Config
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_API_URL: z.string().url().optional(),
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


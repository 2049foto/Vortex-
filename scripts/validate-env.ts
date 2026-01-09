#!/usr/bin/env tsx
/**
 * Vortex Protocol - Environment Variables Validation Script
 * Checks for missing or invalid environment variables
 * 
 * Usage: bun run scripts/validate-env.ts
 */

import { readFileSync } from 'fs';
import { join } from 'path';

interface EnvCheck {
  key: string;
  required: boolean;
  description: string;
  category: string;
  validator?: (value: string) => boolean;
  warning?: string;
}

const envChecks: EnvCheck[] = [
  // Critical - App won't work without these
  {
    key: 'DATABASE_URL',
    required: true,
    description: 'Neon PostgreSQL connection string',
    category: 'Database',
    validator: (v) => v.startsWith('postgresql://'),
  },
  {
    key: 'MORALIS_API_KEY',
    required: true,
    description: 'Moralis API key for token data',
    category: 'APIs',
    validator: (v) => v.length > 20,
  },
  {
    key: 'PIMLICO_API_KEY',
    required: true,
    description: 'Pimlico API key for AA bundler',
    category: 'Account Abstraction',
    validator: (v) => v.startsWith('pim_'),
  },
  {
    key: 'ONEINCH_API_KEY',
    required: true,
    description: '1inch API key for DEX aggregation',
    category: 'DEX',
  },
  
  // Important - Features may be limited
  {
    key: 'UPSTASH_REDIS_REST_URL',
    required: false,
    description: 'Upstash Redis URL (uses memory fallback if missing)',
    category: 'Cache',
    warning: 'Cache will use memory fallback (not persistent)',
  },
  {
    key: 'UPSTASH_REDIS_REST_TOKEN',
    required: false,
    description: 'Upstash Redis token',
    category: 'Cache',
    warning: 'Cache will use memory fallback (not persistent)',
  },
  {
    key: 'NEXT_PUBLIC_CDP_PAYMASTER_URL',
    required: false,
    description: 'Coinbase CDP Paymaster URL (fallback paymaster)',
    category: 'Account Abstraction',
    warning: 'Only Pimlico paymaster will be available',
  },
  
  // Security - Recommended for production
  {
    key: 'TURNSTILE_SECRET_KEY',
    required: false,
    description: 'Cloudflare Turnstile secret key',
    category: 'Security',
    warning: 'Bot protection disabled (fail-open mode)',
  },
  {
    key: 'NEXT_PUBLIC_TURNSTILE_SITE_KEY',
    required: false,
    description: 'Cloudflare Turnstile site key',
    category: 'Security',
    warning: 'Bot protection disabled (fail-open mode)',
  },
  {
    key: 'JWT_SECRET',
    required: false,
    description: 'JWT secret for session encryption',
    category: 'Security',
    warning: 'Using default dev secret (not secure for production)',
    validator: (v) => v.length >= 20,
  },
  
  // Optional - Enhanced features
  {
    key: 'GOPLUS_API_KEY',
    required: false,
    description: 'GoPlus API key for security analysis',
    category: 'Security APIs',
    warning: 'Risk scoring may be less accurate',
  },
  {
    key: 'NEXT_PUBLIC_HELIUS_API_KEY',
    required: false,
    description: 'Helius API key for Solana support',
    category: 'Solana',
    warning: 'Solana token scanning disabled',
  },
  {
    key: 'JUPITER_API_KEY',
    required: false,
    description: 'Jupiter API key for Solana DEX',
    category: 'Solana',
    warning: 'Solana swaps disabled',
  },
  {
    key: 'TENDERLY_API_KEY',
    required: false,
    description: 'Tenderly API key for transaction simulation',
    category: 'Simulation',
    warning: 'Transaction simulation disabled',
  },
  {
    key: 'TENDERLY_USERNAME',
    required: false,
    description: 'Tenderly username',
    category: 'Simulation',
  },
  {
    key: 'TENDERLY_PROJECT',
    required: false,
    description: 'Tenderly project name',
    category: 'Simulation',
  },
  
  // Analytics - Optional
  {
    key: 'NEXT_PUBLIC_POSTHOG_KEY',
    required: false,
    description: 'PostHog key for product analytics',
    category: 'Analytics',
  },
  {
    key: 'NEXT_PUBLIC_SENTRY_DSN',
    required: false,
    description: 'Sentry DSN for error tracking',
    category: 'Analytics',
  },
];

function loadEnvFile(): Record<string, string> {
  const envPath = join(process.cwd(), '.env.local');
  try {
    const content = readFileSync(envPath, 'utf-8');
    const env: Record<string, string> = {};
    
    content.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          env[key.trim()] = valueParts.join('=').trim();
        }
      }
    });
    
    return env;
  } catch (error) {
    console.warn('⚠️  .env.local not found, checking process.env only');
    return {};
  }
}

function validateEnv() {
  const env = { ...process.env, ...loadEnvFile() };
  const results: {
    passed: EnvCheck[];
    failed: Array<EnvCheck & { reason: string }>;
    warnings: Array<EnvCheck & { reason: string }>;
  } = {
    passed: [],
    failed: [],
    warnings: [],
  };

  console.log('🔍 Validating environment variables...\n');

  for (const check of envChecks) {
    const value = env[check.key];
    const isPlaceholder = value && (
      value.includes('your-') || 
      value.includes('placeholder') ||
      value === 'your-turnstile-secret-key' ||
      value === 'your-turnstile-site-key' ||
      value === 'your-goplus-api-key' ||
      value === 'your-helius-api-key' ||
      value === 'your-jupiter-key' ||
      value === 'your-tenderly-api-key' ||
      value === 'your-tenderly-username' ||
      value === 'your-tenderly-project'
    );
    const hasValue = value && value.trim() !== '' && !isPlaceholder;

    if (!hasValue) {
      if (isPlaceholder) {
        if (check.required) {
          results.failed.push({
            ...check,
            reason: 'Still using placeholder value (needs real key)',
          });
        } else {
          results.warnings.push({
            ...check,
            reason: 'Still using placeholder value - ' + (check.warning || 'Optional but recommended'),
          });
        }
      } else {
        if (check.required) {
          results.failed.push({
            ...check,
            reason: 'Missing required variable',
          });
        } else {
          results.warnings.push({
            ...check,
            reason: check.warning || 'Optional variable not set',
          });
        }
      }
      continue;
    }

    if (check.validator && !check.validator(value)) {
      results.failed.push({
        ...check,
        reason: 'Invalid format or value',
      });
      continue;
    }

    results.passed.push(check);
  }

  // Print results
  console.log('✅ PASSED:\n');
  if (results.passed.length === 0) {
    console.log('  (none)\n');
  } else {
    results.passed.forEach((check) => {
      console.log(`  ✓ ${check.key} - ${check.description}`);
    });
    console.log('');
  }

  if (results.warnings.length > 0) {
    console.log('⚠️  WARNINGS (Optional but recommended):\n');
    results.warnings.forEach((check) => {
      console.log(`  ⚠ ${check.key} - ${check.reason}`);
      console.log(`    ${check.description}\n`);
    });
  }

  if (results.failed.length > 0) {
    console.log('❌ FAILED (Required):\n');
    results.failed.forEach((check) => {
      console.log(`  ✗ ${check.key} - ${check.reason}`);
      console.log(`    ${check.description}\n`);
    });
    console.log('\n❌ Validation failed! Please fix the issues above.');
    process.exit(1);
  }

  console.log('✅ All required environment variables are set!\n');
  
  // Summary by category
  const byCategory: Record<string, number> = {};
  results.passed.forEach((check) => {
    byCategory[check.category] = (byCategory[check.category] || 0) + 1;
  });
  
  console.log('📊 Summary by category:');
  Object.entries(byCategory).forEach(([category, count]) => {
    console.log(`  ${category}: ${count} configured`);
  });
  
  if (results.warnings.length > 0) {
    console.log(`\n⚠️  ${results.warnings.length} optional variables not set (see warnings above)`);
  }
}

// Run validation
validateEnv();

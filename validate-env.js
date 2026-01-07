#!/usr/bin/env node

/**
 * VORTEX PROTOCOL - Environment Validation Script
 * 
 * This script validates your .env.local configuration
 * Run: node validate-env.js
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// Required environment variables by category
const requiredVars = {
  'Core App': [
    'NEXT_PUBLIC_APP_NAME',
    'NEXT_PUBLIC_APP_URL',
    'NODE_ENV',
    'NEXT_PUBLIC_ADMIN_WALLET',
  ],
  'Security': [
    'JWT_SECRET',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
    'CSRF_TOKEN_SECRET',
  ],
  'Database': [
    'DATABASE_URL',
  ],
  'Cache': [
    'UPSTASH_REDIS_REST_URL',
    'UPSTASH_REDIS_REST_TOKEN',
  ],
  'RPC - QuickNode': [
    'NEXT_PUBLIC_QUICKNODE_BASE_HTTPS',
    'NEXT_PUBLIC_QUICKNODE_SOLANA_HTTPS',
  ],
  'RPC - Alchemy': [
    'NEXT_PUBLIC_ALCHEMY_API_KEY',
    'NEXT_PUBLIC_ALCHEMY_BASE_RPC',
  ],
  'RPC - Infura': [
    'NEXT_PUBLIC_INFURA_PROJECT_ID',
    'NEXT_PUBLIC_INFURA_BASE_HTTPS',
  ],
  'Solana': [
    'NEXT_PUBLIC_HELIUS_API_KEY',
    'NEXT_PUBLIC_HELIUS_RPC',
  ],
  'Security APIs': [
    'GOPLUS_API_KEY',
    'NEXT_PUBLIC_GOPLUS_API_URL',
  ],
  'Swap Aggregators': [
    'ONEINCH_API_KEY',
    'ZEROX_API_KEY',
  ],
  'Account Abstraction': [
    'PIMLICO_API_KEY',
    'NEXT_PUBLIC_ONCHAINKIT_API_KEY',
  ],
  'Wallet Connection': [
    'NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID',
    'NEXT_PUBLIC_PRIVY_APP_ID',
  ],
  'Analytics': [
    'NEXT_PUBLIC_POSTHOG_KEY',
    'NEXT_PUBLIC_SENTRY_DSN',
  ],
};

// Load .env.local file
function loadEnvFile() {
  const envPath = path.join(process.cwd(), '.env.local');
  
  if (!fs.existsSync(envPath)) {
    console.error(`${colors.red}❌ Error: .env.local file not found!${colors.reset}`);
    console.log(`${colors.yellow}Expected location: ${envPath}${colors.reset}`);
    process.exit(1);
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = {};

  // Parse .env file
  envContent.split('\n').forEach(line => {
    line = line.trim();
    
    // Skip comments and empty lines
    if (!line || line.startsWith('#')) return;
    
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      envVars[key] = value;
    }
  });

  return envVars;
}

// Validate environment variables
function validateEnv(envVars) {
  console.log(`\n${colors.bright}${colors.cyan}🔍 VORTEX PROTOCOL - Environment Validation${colors.reset}\n`);
  console.log(`${colors.blue}${'='.repeat(60)}${colors.reset}\n`);

  let totalChecks = 0;
  let passedChecks = 0;
  let failedChecks = 0;
  const issues = [];

  // Check each category
  for (const [category, vars] of Object.entries(requiredVars)) {
    console.log(`${colors.bright}📦 ${category}${colors.reset}`);
    
    for (const varName of vars) {
      totalChecks++;
      const value = envVars[varName];
      
      if (!value || value === '') {
        console.log(`  ${colors.red}❌ ${varName}${colors.reset}`);
        failedChecks++;
        issues.push({ category, varName, issue: 'Missing or empty' });
      } else if (value.includes('your_') || value.includes('optional_') || value.includes('demo_')) {
        console.log(`  ${colors.yellow}⚠️  ${varName} (placeholder value)${colors.reset}`);
        passedChecks++;
        issues.push({ category, varName, issue: 'Placeholder value - update before production' });
      } else {
        console.log(`  ${colors.green}✅ ${varName}${colors.reset}`);
        passedChecks++;
      }
    }
    console.log('');
  }

  // Additional validations
  console.log(`${colors.bright}🔐 Security Checks${colors.reset}`);
  
  // Check JWT secret length
  if (envVars.JWT_SECRET && envVars.JWT_SECRET.length < 32) {
    console.log(`  ${colors.yellow}⚠️  JWT_SECRET is too short (should be 32+ characters)${colors.reset}`);
    issues.push({ category: 'Security', varName: 'JWT_SECRET', issue: 'Too short' });
  } else {
    console.log(`  ${colors.green}✅ JWT_SECRET length OK${colors.reset}`);
  }

  // Check admin wallet format
  if (envVars.NEXT_PUBLIC_ADMIN_WALLET) {
    const isValidAddress = /^0x[a-fA-F0-9]{40}$/.test(envVars.NEXT_PUBLIC_ADMIN_WALLET);
    if (isValidAddress) {
      console.log(`  ${colors.green}✅ Admin wallet address format valid${colors.reset}`);
    } else {
      console.log(`  ${colors.red}❌ Admin wallet address format invalid${colors.reset}`);
      issues.push({ category: 'Security', varName: 'NEXT_PUBLIC_ADMIN_WALLET', issue: 'Invalid format' });
    }
  }

  // Check database URL format
  if (envVars.DATABASE_URL) {
    const hasSSL = envVars.DATABASE_URL.includes('sslmode=require');
    if (hasSSL) {
      console.log(`  ${colors.green}✅ Database SSL enabled${colors.reset}`);
    } else {
      console.log(`  ${colors.yellow}⚠️  Database SSL not enforced${colors.reset}`);
      issues.push({ category: 'Security', varName: 'DATABASE_URL', issue: 'SSL not enforced' });
    }
  }

  console.log('');

  // Feature flags check
  console.log(`${colors.bright}🚀 Feature Flags${colors.reset}`);
  const featureFlags = [
    'NEXT_PUBLIC_ENABLE_ANALYTICS',
    'NEXT_PUBLIC_ENABLE_GASLESS',
    'NEXT_PUBLIC_ENABLE_SESSION_KEYS',
    'NEXT_PUBLIC_ENABLE_AI_CLASSIFICATION',
  ];

  featureFlags.forEach(flag => {
    const value = envVars[flag];
    if (value === 'true') {
      console.log(`  ${colors.green}✅ ${flag.replace('NEXT_PUBLIC_ENABLE_', '')}${colors.reset}`);
    } else {
      console.log(`  ${colors.yellow}⚠️  ${flag.replace('NEXT_PUBLIC_ENABLE_', '')} (disabled)${colors.reset}`);
    }
  });

  console.log('');

  // Summary
  console.log(`${colors.blue}${'='.repeat(60)}${colors.reset}\n`);
  console.log(`${colors.bright}📊 Validation Summary${colors.reset}\n`);
  console.log(`  Total checks: ${totalChecks}`);
  console.log(`  ${colors.green}Passed: ${passedChecks}${colors.reset}`);
  console.log(`  ${colors.red}Failed: ${failedChecks}${colors.reset}`);
  console.log(`  Success rate: ${Math.round((passedChecks / totalChecks) * 100)}%\n`);

  // Show issues
  if (issues.length > 0) {
    console.log(`${colors.yellow}⚠️  Issues Found:${colors.reset}\n`);
    issues.forEach((issue, index) => {
      console.log(`  ${index + 1}. [${issue.category}] ${issue.varName}`);
      console.log(`     ${colors.yellow}→ ${issue.issue}${colors.reset}\n`);
    });
  }

  // Final status
  if (failedChecks === 0) {
    console.log(`${colors.green}${colors.bright}✅ Environment configuration is valid!${colors.reset}\n`);
    console.log(`${colors.cyan}You're ready to start development! 🚀${colors.reset}\n`);
    return true;
  } else {
    console.log(`${colors.red}${colors.bright}❌ Environment configuration has issues!${colors.reset}\n`);
    console.log(`${colors.yellow}Please fix the issues above before proceeding.${colors.reset}\n`);
    return false;
  }
}

// Additional statistics
function showStatistics(envVars) {
  const totalVars = Object.keys(envVars).length;
  const publicVars = Object.keys(envVars).filter(k => k.startsWith('NEXT_PUBLIC_')).length;
  const secretVars = totalVars - publicVars;

  console.log(`${colors.bright}📈 Configuration Statistics${colors.reset}\n`);
  console.log(`  Total variables: ${totalVars}`);
  console.log(`  Public variables (NEXT_PUBLIC_*): ${publicVars}`);
  console.log(`  Secret variables: ${secretVars}`);
  console.log('');

  // Count by category
  const categories = {
    'RPC URLs': Object.keys(envVars).filter(k => k.includes('RPC') || k.includes('HTTPS')).length,
    'API Keys': Object.keys(envVars).filter(k => k.includes('API_KEY')).length,
    'Secrets': Object.keys(envVars).filter(k => k.includes('SECRET')).length,
    'URLs': Object.keys(envVars).filter(k => k.includes('URL') && !k.includes('RPC')).length,
  };

  console.log(`${colors.bright}📦 By Category${colors.reset}\n`);
  for (const [category, count] of Object.entries(categories)) {
    console.log(`  ${category}: ${count}`);
  }
  console.log('');
}

// Main execution
try {
  console.clear();
  const envVars = loadEnvFile();
  const isValid = validateEnv(envVars);
  showStatistics(envVars);

  console.log(`${colors.blue}${'='.repeat(60)}${colors.reset}\n`);
  console.log(`${colors.cyan}For more information, see:${colors.reset}`);
  console.log(`  - ENV_SETUP_SUMMARY.md (detailed configuration)`);
  console.log(`  - QUICK_START.md (quick reference guide)`);
  console.log('');

  process.exit(isValid ? 0 : 1);
} catch (error) {
  console.error(`${colors.red}❌ Error: ${error.message}${colors.reset}`);
  process.exit(1);
}


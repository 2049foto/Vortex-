#!/usr/bin/env bun
/**
 * Vortex Protocol - Phase 1 Integration Test
 * Tests all critical paths for Base Grant submission
 * Run: bun run scripts/test-phase1.ts
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

// Colors for output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
};

const log = {
  success: (msg: string) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg: string) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warn: (msg: string) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg: string) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  header: (msg: string) => console.log(`\n${colors.bold}${colors.blue}═══ ${msg} ═══${colors.reset}\n`),
};

interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
  duration?: number;
}

const results: TestResult[] = [];

// Test environment variables
async function testEnvVars() {
  log.header('Environment Variables');
  
  const requiredVars = [
    { key: 'MORALIS_API_KEY', name: 'Moralis API Key' },
    { key: 'NEXT_PUBLIC_ALCHEMY_API_KEY', name: 'Alchemy API Key' },
    { key: 'PIMLICO_API_KEY', name: 'Pimlico API Key' },
    { key: 'ONEINCH_API_KEY', name: '1inch API Key' },
    { key: 'DATABASE_URL', name: 'Database URL' },
    { key: 'UPSTASH_REDIS_REST_URL', name: 'Upstash Redis URL' },
    { key: 'NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID', name: 'WalletConnect ID' },
  ];

  const optionalVars = [
    { key: 'NEXT_PUBLIC_HELIUS_API_KEY', name: 'Helius API Key (Solana)' },
    { key: 'NEXT_PUBLIC_CDP_PAYMASTER_URL', name: 'Coinbase Paymaster URL' },
    { key: 'GOPLUS_API_KEY', name: 'GoPlus Security API Key' },
    { key: 'TENDERLY_API_KEY', name: 'Tenderly API Key' },
    { key: 'TURNSTILE_SECRET_KEY', name: 'Cloudflare Turnstile Key' },
  ];

  for (const v of requiredVars) {
    const value = process.env[v.key];
    if (value && !value.startsWith('your-') && value.trim() !== '') {
      log.success(`${v.name}: Configured`);
      results.push({ name: v.name, status: 'pass', message: 'Configured' });
    } else {
      log.error(`${v.name}: Missing or placeholder`);
      results.push({ name: v.name, status: 'fail', message: 'Missing or placeholder' });
    }
  }

  console.log('\nOptional (but recommended):');
  for (const v of optionalVars) {
    const value = process.env[v.key];
    if (value && !value.startsWith('your-') && value.trim() !== '') {
      log.success(`${v.name}: Configured`);
      results.push({ name: v.name, status: 'pass', message: 'Configured' });
    } else {
      log.warn(`${v.name}: Not configured`);
      results.push({ name: v.name, status: 'warn', message: 'Not configured' });
    }
  }
}

// Test RPC connections
async function testRpcConnections() {
  log.header('RPC Connections');
  
  const chains = [
    { name: 'Ethereum', chainId: 1, rpc: `https://eth-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}` },
    { name: 'Base', chainId: 8453, rpc: process.env.NEXT_PUBLIC_QUICKNODE_BASE_HTTPS || 'https://mainnet.base.org' },
    { name: 'Arbitrum', chainId: 42161, rpc: `https://arb-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}` },
    { name: 'Optimism', chainId: 10, rpc: `https://opt-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}` },
    { name: 'Polygon', chainId: 137, rpc: `https://polygon-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}` },
  ];

  for (const chain of chains) {
    const start = Date.now();
    try {
      const response = await fetch(chain.rpc, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_blockNumber',
          params: [],
        }),
        signal: AbortSignal.timeout(10000),
      });
      
      if (response.ok) {
        const data = await response.json();
        const duration = Date.now() - start;
        const blockNumber = parseInt(data.result, 16);
        log.success(`${chain.name} (${chain.chainId}): Block ${blockNumber} [${duration}ms]`);
        results.push({ name: `RPC ${chain.name}`, status: 'pass', message: `Block ${blockNumber}`, duration });
      } else {
        log.error(`${chain.name}: HTTP ${response.status}`);
        results.push({ name: `RPC ${chain.name}`, status: 'fail', message: `HTTP ${response.status}` });
      }
    } catch (error) {
      log.error(`${chain.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      results.push({ name: `RPC ${chain.name}`, status: 'fail', message: error instanceof Error ? error.message : 'Unknown error' });
    }
  }
}

// Test Moralis API
async function testMoralisApi() {
  log.header('Moralis API');
  
  const apiKey = process.env.MORALIS_API_KEY;
  if (!apiKey || apiKey.startsWith('your-')) {
    log.error('Moralis API key not configured');
    results.push({ name: 'Moralis API', status: 'fail', message: 'API key not configured' });
    return;
  }

  const testWallet = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'; // vitalik.eth
  
  try {
    const response = await fetch(
      `https://deep-index.moralis.io/api/v2.2/${testWallet}/erc20?chain=eth`,
      {
        headers: { 'X-API-Key': apiKey },
        signal: AbortSignal.timeout(10000),
      }
    );

    if (response.ok) {
      const data = await response.json();
      log.success(`Moralis API: Working (Found ${data.result?.length || 0} tokens for test wallet)`);
      results.push({ name: 'Moralis API', status: 'pass', message: `Found ${data.result?.length || 0} tokens` });
    } else {
      const error = await response.text();
      log.error(`Moralis API: HTTP ${response.status} - ${error}`);
      results.push({ name: 'Moralis API', status: 'fail', message: `HTTP ${response.status}` });
    }
  } catch (error) {
    log.error(`Moralis API: ${error instanceof Error ? error.message : 'Unknown error'}`);
    results.push({ name: 'Moralis API', status: 'fail', message: error instanceof Error ? error.message : 'Unknown error' });
  }
}

// Test 1inch API
async function test1inchApi() {
  log.header('1inch API');
  
  const apiKey = process.env.ONEINCH_API_KEY;
  if (!apiKey || apiKey.startsWith('your-')) {
    log.error('1inch API key not configured');
    results.push({ name: '1inch API', status: 'fail', message: 'API key not configured' });
    return;
  }

  try {
    // Test quote endpoint on Base
    const response = await fetch(
      'https://api.1inch.dev/swap/v6.0/8453/quote?' + new URLSearchParams({
        src: '0x4200000000000000000000000000000000000006', // WETH on Base
        dst: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC on Base
        amount: '1000000000000000', // 0.001 ETH
      }),
      {
        headers: { 'Authorization': `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(10000),
      }
    );

    if (response.ok) {
      const data = await response.json();
      const outputUSDC = (parseInt(data.dstAmount || '0') / 1e6).toFixed(2);
      log.success(`1inch API: Working (0.001 ETH = $${outputUSDC} USDC)`);
      results.push({ name: '1inch API', status: 'pass', message: `Quote: $${outputUSDC}` });
    } else {
      const error = await response.text();
      log.error(`1inch API: HTTP ${response.status} - ${error}`);
      results.push({ name: '1inch API', status: 'fail', message: `HTTP ${response.status}` });
    }
  } catch (error) {
    log.error(`1inch API: ${error instanceof Error ? error.message : 'Unknown error'}`);
    results.push({ name: '1inch API', status: 'fail', message: error instanceof Error ? error.message : 'Unknown error' });
  }
}

// Test Pimlico API
async function testPimlicoApi() {
  log.header('Pimlico API');
  
  const baseUrl = process.env.NEXT_PUBLIC_PIMLICO_BASE_URL;
  if (!baseUrl || baseUrl.startsWith('your-') || baseUrl.trim() === '') {
    log.error('Pimlico base URL not configured');
    results.push({ name: 'Pimlico API', status: 'fail', message: 'Base URL not configured' });
    return;
  }

  try {
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_chainId',
        params: [],
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (response.ok) {
      const data = await response.json();
      log.success(`Pimlico API: Connected (Chain ID: ${parseInt(data.result, 16)})`);
      results.push({ name: 'Pimlico API', status: 'pass', message: `Chain ID: ${parseInt(data.result, 16)}` });
    } else {
      log.error(`Pimlico API: HTTP ${response.status}`);
      results.push({ name: 'Pimlico API', status: 'fail', message: `HTTP ${response.status}` });
    }
  } catch (error) {
    log.error(`Pimlico API: ${error instanceof Error ? error.message : 'Unknown error'}`);
    results.push({ name: 'Pimlico API', status: 'fail', message: error instanceof Error ? error.message : 'Unknown error' });
  }
}

// Test Database Connection
async function testDatabase() {
  log.header('Database Connection');
  
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl || dbUrl.startsWith('your-') || dbUrl.trim() === '') {
    log.error('Database URL not configured');
    results.push({ name: 'Database', status: 'fail', message: 'URL not configured' });
    return;
  }

  try {
    // Use postgres package to test connection
    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(dbUrl);
    const result = await sql`SELECT 1 as test`;
    
    if (result[0]?.test === 1) {
      log.success('Database: Connected successfully');
      results.push({ name: 'Database', status: 'pass', message: 'Connected' });
    } else {
      log.error('Database: Query failed');
      results.push({ name: 'Database', status: 'fail', message: 'Query failed' });
    }
  } catch (error) {
    log.error(`Database: ${error instanceof Error ? error.message : 'Unknown error'}`);
    results.push({ name: 'Database', status: 'fail', message: error instanceof Error ? error.message : 'Unknown error' });
  }
}

// Test Redis Connection
async function testRedis() {
  log.header('Redis Connection');
  
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  
  if (!redisUrl || !redisToken || redisUrl.startsWith('your-')) {
    log.error('Redis credentials not configured');
    results.push({ name: 'Redis', status: 'fail', message: 'Credentials not configured' });
    return;
  }

  try {
    const { Redis } = await import('@upstash/redis');
    const redis = new Redis({ url: redisUrl, token: redisToken });
    
    // Test ping
    const pong = await redis.ping();
    
    if (pong === 'PONG') {
      log.success('Redis: Connected successfully');
      results.push({ name: 'Redis', status: 'pass', message: 'Connected' });
    } else {
      log.error('Redis: Unexpected response');
      results.push({ name: 'Redis', status: 'fail', message: 'Unexpected response' });
    }
  } catch (error) {
    log.error(`Redis: ${error instanceof Error ? error.message : 'Unknown error'}`);
    results.push({ name: 'Redis', status: 'fail', message: error instanceof Error ? error.message : 'Unknown error' });
  }
}

// Print summary
function printSummary() {
  log.header('PHASE 1 TEST SUMMARY');
  
  const passed = results.filter(r => r.status === 'pass').length;
  const failed = results.filter(r => r.status === 'fail').length;
  const warned = results.filter(r => r.status === 'warn').length;
  
  console.log(`\n${colors.bold}Results:${colors.reset}`);
  console.log(`  ${colors.green}✅ Passed: ${passed}${colors.reset}`);
  console.log(`  ${colors.red}❌ Failed: ${failed}${colors.reset}`);
  console.log(`  ${colors.yellow}⚠️  Warnings: ${warned}${colors.reset}`);
  
  const requiredTests = results.filter(r => 
    !['Helius API Key (Solana)', 'Coinbase Paymaster URL', 'GoPlus Security API Key', 'Tenderly API Key', 'Cloudflare Turnstile Key'].includes(r.name)
  );
  const requiredPassed = requiredTests.filter(r => r.status === 'pass').length;
  const requiredTotal = requiredTests.length;
  
  console.log(`\n${colors.bold}Phase 1 Readiness: ${requiredPassed}/${requiredTotal} required checks passed${colors.reset}`);
  
  if (failed === 0 || requiredPassed === requiredTotal) {
    console.log(`\n${colors.green}${colors.bold}🚀 PHASE 1 MVP READY FOR BASE GRANT! 🚀${colors.reset}\n`);
  } else {
    console.log(`\n${colors.yellow}${colors.bold}⚠️  Some required services need configuration.${colors.reset}`);
    console.log(`${colors.yellow}See PHASE_1_GRANT_READY.md for requirements.${colors.reset}\n`);
  }
}

// Run all tests
async function main() {
  console.log(`\n${colors.bold}${colors.blue}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bold}${colors.blue}║        VORTEX PROTOCOL - PHASE 1 INTEGRATION TEST         ║${colors.reset}`);
  console.log(`${colors.bold}${colors.blue}╚════════════════════════════════════════════════════════════╝${colors.reset}`);
  
  await testEnvVars();
  await testRpcConnections();
  await testMoralisApi();
  await test1inchApi();
  await testPimlicoApi();
  await testDatabase();
  await testRedis();
  
  printSummary();
}

main().catch(console.error);

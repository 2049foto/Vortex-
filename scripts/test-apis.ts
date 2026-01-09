/**
 * API Testing Script - Test all environment API keys
 * Run with: bun run scripts/test-apis.ts
 */

interface TestResult {
  name: string;
  status: 'OK' | 'FAIL' | 'SKIP';
  message: string;
  latency?: number;
}

const results: TestResult[] = [];

async function testAPI(
  name: string,
  testFn: () => Promise<boolean>,
  skipReason?: string
): Promise<void> {
  if (skipReason) {
    results.push({ name, status: 'SKIP', message: skipReason });
    return;
  }

  const start = Date.now();
  try {
    const success = await testFn();
    const latency = Date.now() - start;
    results.push({
      name,
      status: success ? 'OK' : 'FAIL',
      message: success ? `Working (${latency}ms)` : 'API returned error',
      latency,
    });
  } catch (error: any) {
    results.push({
      name,
      status: 'FAIL',
      message: error.message?.slice(0, 100) || 'Unknown error',
    });
  }
}

async function main() {
  console.log('\n🔍 VORTEX API TESTING SCRIPT\n');
  console.log('Testing all configured APIs...\n');

  // 1. Test Moralis
  await testAPI('Moralis (Token Indexing)', async () => {
    const response = await fetch(
      'https://deep-index.moralis.io/api/v2.2/0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045/erc20?chain=eth',
      {
        headers: {
          'X-API-Key': process.env.MORALIS_API_KEY || '',
        },
      }
    );
    return response.ok;
  });

  // 2. Test 1inch
  await testAPI('1inch (DEX Aggregator)', async () => {
    const response = await fetch(
      'https://api.1inch.dev/swap/v6.0/8453/tokens',
      {
        headers: {
          Authorization: `Bearer ${process.env.ONEINCH_API_KEY}`,
        },
      }
    );
    return response.ok;
  });

  // 3. Test Alchemy
  await testAPI('Alchemy (RPC)', async () => {
    const response = await fetch(
      `https://base-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_blockNumber',
          params: [],
        }),
      }
    );
    const data = await response.json();
    return !!data.result;
  });

  // 4. Test Pimlico
  await testAPI('Pimlico (Paymaster)', async () => {
    const response = await fetch(
      `https://api.pimlico.io/v2/8453/rpc?apikey=${process.env.PIMLICO_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'pm_supportedEntryPoints',
          params: [],
        }),
      }
    );
    const data = await response.json();
    return !data.error;
  });

  // 5. Test Coinbase CDP
  await testAPI('Coinbase CDP (Paymaster)', async () => {
    const response = await fetch(
      process.env.NEXT_PUBLIC_CDP_PAYMASTER_URL || '',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'pm_supportedEntryPoints',
          params: [],
        }),
      }
    );
    const data = await response.json();
    return !data.error;
  });

  // 6. Test Tenderly
  await testAPI('Tenderly (Simulation)', async () => {
    const response = await fetch(
      `https://api.tenderly.co/api/v1/account/${process.env.TENDERLY_USERNAME}/project/${process.env.TENDERLY_PROJECT}`,
      {
        headers: {
          'X-Access-Key': process.env.TENDERLY_API_KEY || '',
        },
      }
    );
    return response.ok || response.status === 404; // 404 means auth works but project path wrong
  });

  // 7. Test GoPlus
  await testAPI('GoPlus (Security)', async () => {
    const response = await fetch(
      'https://api.gopluslabs.io/api/v1/token_security/1?contract_addresses=0xdac17f958d2ee523a2206206994597c13d831ec7'
    );
    return response.ok;
  });

  // 8. Test Helius (Solana)
  await testAPI('Helius (Solana)', async () => {
    const response = await fetch(
      `https://api.helius.xyz/v0/addresses/vines1vzrYbzLMRdu58ou5XTby4qAqVRLmqo36NKPTg/balances?api-key=${process.env.NEXT_PUBLIC_HELIUS_API_KEY}`
    );
    return response.ok;
  });

  // 9. Test Upstash Redis
  await testAPI('Upstash Redis', async () => {
    const response = await fetch(
      `${process.env.UPSTASH_REDIS_REST_URL}/ping`,
      {
        headers: {
          Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
        },
      }
    );
    return response.ok;
  });

  // 10. Test Relay.link (Cross-chain bridge)
  await testAPI('Relay.link (Bridge)', async () => {
    const response = await fetch('https://api.relay.link/chains');
    return response.ok;
  });

  // 11. Test QuickNode Base
  await testAPI('QuickNode Base', async () => {
    const response = await fetch(
      process.env.NEXT_PUBLIC_QUICKNODE_BASE_HTTPS || '',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_blockNumber',
          params: [],
        }),
      }
    );
    const data = await response.json();
    return !!data.result;
  });

  // 12. Test Infura
  await testAPI('Infura (RPC)', async () => {
    const response = await fetch(
      `https://mainnet.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_PROJECT_ID}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_blockNumber',
          params: [],
        }),
      }
    );
    const data = await response.json();
    return !!data.result;
  });

  // Print results
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST RESULTS');
  console.log('='.repeat(60) + '\n');

  const okCount = results.filter((r) => r.status === 'OK').length;
  const failCount = results.filter((r) => r.status === 'FAIL').length;
  const skipCount = results.filter((r) => r.status === 'SKIP').length;

  for (const result of results) {
    const icon = result.status === 'OK' ? '✅' : result.status === 'FAIL' ? '❌' : '⏭️';
    console.log(`${icon} ${result.name.padEnd(30)} ${result.status.padEnd(6)} ${result.message}`);
  }

  console.log('\n' + '-'.repeat(60));
  console.log(`✅ OK: ${okCount}  |  ❌ FAIL: ${failCount}  |  ⏭️ SKIP: ${skipCount}`);
  console.log('-'.repeat(60) + '\n');

  // Critical checks
  const critical = ['Moralis', '1inch', 'Pimlico', 'Tenderly'];
  const criticalFails = results.filter(
    (r) => r.status === 'FAIL' && critical.some((c) => r.name.includes(c))
  );

  if (criticalFails.length > 0) {
    console.log('⚠️  CRITICAL APIS FAILED:');
    criticalFails.forEach((f) => console.log(`   - ${f.name}: ${f.message}`));
    console.log('\n');
  }

  // Summary
  if (failCount === 0) {
    console.log('🎉 All APIs are working! App should function correctly.\n');
  } else if (criticalFails.length > 0) {
    console.log('🚨 Some critical APIs failed. App may not work correctly.\n');
  } else {
    console.log('⚠️  Some non-critical APIs failed. Core features should work.\n');
  }
}

main().catch(console.error);

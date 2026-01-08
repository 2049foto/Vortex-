/**
 * k6 Performance Test - Consolidation Endpoint
 * Tests consolidation execution performance
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const consolidateDuration = new Trend('consolidate_duration');

export const options = {
  stages: [
    { duration: '30s', target: 5 },   // Ramp up to 5 users (consolidation is heavier)
    { duration: '1m', target: 5 },
    { duration: '30s', target: 10 },
    { duration: '1m', target: 10 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<10000'], // 95% should be below 10s
    http_req_failed: ['rate<0.1'],      // Error rate < 10%
    errors: ['rate<0.1'],
    consolidate_duration: ['p(95)<15000'], // 95% should complete in 15s
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  const startTime = Date.now();
  
  const response = http.post(`${BASE_URL}/api/v1/swap`, JSON.stringify({
    walletAddress: '0x1234567890123456789012345678901234567890',
    selectedTokens: [
      {
        address: '0x1111111111111111111111111111111111111111',
        chainId: 8453,
      },
    ],
    outputToken: 'USDC',
    slippagePct: 0.5,
    turnstileToken: 'test-token',
  }), {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const duration = Date.now() - startTime;
  consolidateDuration.add(duration);

  const success = check(response, {
    'status is 200 or 400/403': (r) => [200, 400, 403].includes(r.status),
    'response time < 15s': (r) => r.timings.duration < 15000,
    'has response body': (r) => r.body.length > 0,
  });

  if (!success) {
    errorRate.add(1);
  } else {
    errorRate.add(0);
  }

  sleep(2);
}

export function handleSummary(data) {
  return {
    'stdout': JSON.stringify(data, null, 2),
    'test-results/consolidate-performance.json': JSON.stringify(data, null, 2),
  };
}

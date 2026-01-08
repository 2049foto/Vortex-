/**
 * k6 Performance Test - Scan Endpoint
 * Tests wallet scanning performance under load
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const scanDuration = new Trend('scan_duration');

export const options = {
  stages: [
    { duration: '30s', target: 10 },   // Ramp up to 10 users
    { duration: '1m', target: 10 },    // Stay at 10 users
    { duration: '30s', target: 20 },   // Ramp up to 20 users
    { duration: '1m', target: 20 },   // Stay at 20 users
    { duration: '30s', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests should be below 2s
    http_req_failed: ['rate<0.05'],    // Error rate should be less than 5%
    errors: ['rate<0.05'],
    scan_duration: ['p(95)<5000'],     // 95% of scans should complete in 5s
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Test wallet addresses (mock)
const WALLET_ADDRESSES = [
  '0x1234567890123456789012345678901234567890',
  '0x2345678901234567890123456789012345678901',
  '0x3456789012345678901234567890123456789012',
];

export default function () {
  const walletAddress = WALLET_ADDRESSES[Math.floor(Math.random() * WALLET_ADDRESSES.length)];
  
  const startTime = Date.now();
  
  const response = http.post(`${BASE_URL}/api/v1/scan`, JSON.stringify({
    walletAddress,
    turnstileToken: 'test-token', // Mock token for testing
  }), {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const duration = Date.now() - startTime;
  scanDuration.add(duration);

  const success = check(response, {
    'status is 200 or 400/403': (r) => [200, 400, 403].includes(r.status),
    'response time < 5s': (r) => r.timings.duration < 5000,
    'has response body': (r) => r.body.length > 0,
  });

  if (!success) {
    errorRate.add(1);
  } else {
    errorRate.add(0);
  }

  sleep(1);
}

export function handleSummary(data) {
  return {
    'stdout': JSON.stringify(data, null, 2),
    'test-results/scan-performance.json': JSON.stringify(data, null, 2),
  };
}

/**
 * k6 Performance Test - Analytics Dashboard
 * Tests public metrics endpoint performance
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const analyticsDuration = new Trend('analytics_duration');

export const options = {
  stages: [
    { duration: '30s', target: 50 },   // Ramp up to 50 users (public endpoint)
    { duration: '2m', target: 50 },
    { duration: '30s', target: 100 },
    { duration: '2m', target: 100 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],   // 95% should be below 500ms
    http_req_failed: ['rate<0.01'],     // Error rate < 1%
    errors: ['rate<0.01'],
    analytics_duration: ['p(95)<1000'], // 95% should complete in 1s
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  const startTime = Date.now();
  
  const response = http.get(`${BASE_URL}/api/v1/analytics/dashboard`);

  const duration = Date.now() - startTime;
  analyticsDuration.add(duration);

  const success = check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 1s': (r) => r.timings.duration < 1000,
    'has metrics data': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.success && body.data;
      } catch {
        return false;
      }
    },
  });

  if (!success) {
    errorRate.add(1);
  } else {
    errorRate.add(0);
  }

  sleep(0.5);
}

export function handleSummary(data) {
  return {
    'stdout': JSON.stringify(data, null, 2),
    'test-results/analytics-performance.json': JSON.stringify(data, null, 2),
  };
}

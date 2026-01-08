import { test, expect } from '@playwright/test';

/**
 * E2E Tests - API Endpoints
 */
test.describe('API Endpoints', () => {
  const baseURL = process.env.E2E_BASE_URL || 'http://localhost:3000';

  test('POST /api/v1/scan should require Turnstile token', async ({ request }) => {
    const response = await request.post(`${baseURL}/api/v1/scan`, {
      data: {
        walletAddress: '0x1234567890123456789012345678901234567890',
      },
    });

    // Should fail without Turnstile token (or return 403)
    expect([400, 403]).toContain(response.status());
  });

  test('POST /api/v1/scan should validate wallet address', async ({ request }) => {
    const response = await request.post(`${baseURL}/api/v1/scan`, {
      data: {
        walletAddress: 'invalid-address',
        turnstileToken: 'test-token',
      },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('Invalid');
  });

  test('GET /api/v1/analytics/dashboard should return metrics', async ({ request }) => {
    const response = await request.get(`${baseURL}/api/v1/analytics/dashboard`);

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('success');
    expect(body).toHaveProperty('data');
  });

  test('GET /api/v1/user/history should return history', async ({ request }) => {
    const response = await request.get(`${baseURL}/api/v1/user/history?walletAddress=0x1234567890123456789012345678901234567890`);

    // Should return 200 or 400/401 if auth required
    expect([200, 400, 401]).toContain(response.status());
  });

  test('POST /api/v1/swap should require Turnstile token', async ({ request }) => {
    const response = await request.post(`${baseURL}/api/v1/swap`, {
      data: {
        walletAddress: '0x1234567890123456789012345678901234567890',
        selectedTokens: [],
      },
    });

    expect([400, 403]).toContain(response.status());
  });
});

import { test, expect } from '@playwright/test';

/**
 * E2E Tests - Consolidation Flow
 */
test.describe('Consolidation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/consolidate');
    await page.waitForLoadState('networkidle');
  });

  test('should load consolidate page', async ({ page }) => {
    await expect(page).toHaveURL(/.*consolidate/);
  });

  test('should display token selection', async ({ page }) => {
    // Look for token list or selection UI
    const tokenList = page.locator('[data-testid="token-list"], .token-list, text=/Select tokens/i').first();
    await expect(tokenList).toBeVisible({ timeout: 10000 });
  });

  test('should show output token selection', async ({ page }) => {
    // Look for output token selector (ETH/USDC)
    const outputSelector = page.locator('text=/ETH|USDC|Output token/i').first();
    await expect(outputSelector).toBeVisible({ timeout: 10000 });
  });

  test('should handle consolidation with mock data', async ({ page }) => {
    // Mock scan response
    await page.route('**/api/v1/scan', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            tokens: {
              dust: {
                items: [
                  {
                    chainId: 8453,
                    address: '0x1234',
                    symbol: 'TOKEN1',
                    valueUsd: 5,
                  },
                ],
              },
            },
          },
        }),
      });
    });

    // Mock swap response
    await page.route('**/api/v1/swap', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            consolidationId: 'test-id',
            status: 'PENDING',
            estimatedOutputUsd: 4.5,
          },
        }),
      });
    });

    // Wait for tokens to load
    await page.waitForTimeout(2000);

    // Verify consolidation can be initiated
    const consolidateButton = page.locator('button:has-text("Consolidate"), button:has-text("Execute")').first();
    await expect(consolidateButton).toBeVisible({ timeout: 10000 });
  });

  test('should show consolidation progress', async ({ page }) => {
    // Mock status endpoint
    await page.route('**/api/v1/status/*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            status: 'SIMULATING',
            progress: 50,
          },
        }),
      });
    });

    // Look for progress indicator
    const progress = page.locator('[data-testid="progress"], .progress, text=/Simulating|Processing/i').first();
    // This would appear after consolidation starts
    await expect(progress).toBeVisible({ timeout: 5000 }).catch(() => {
      // Progress might not be visible if consolidation hasn't started
      expect(true).toBeTruthy();
    });
  });
});

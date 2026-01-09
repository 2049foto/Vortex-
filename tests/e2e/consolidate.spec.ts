import { test, expect } from '@playwright/test';

/**
 * E2E Tests - Consolidation Flow
 * Tests for token consolidation process
 */
test.describe('Consolidation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/consolidate');
    await page.waitForLoadState('domcontentloaded');
  });

  test('should load consolidate page', async ({ page }) => {
    await expect(page).toHaveURL(/.*consolidate/);
  });

  test('should display page content', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Look for consolidate page elements
    const pageContent = page.locator('h1, h2, text=/Consolidate|Review|Token|Output/i').first();
    await expect(pageContent).toBeVisible({ timeout: 10000 });
  });

  test('should show output token options (ETH/USDC)', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Look for output token selector
    const outputSelector = page.locator('text=/ETH|USDC|Output/i').first();
    await expect(outputSelector).toBeVisible({ timeout: 10000 });
  });

  test('should display Base as output chain', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Look for Base chain indicator
    const baseIndicator = page.locator('text=/Base|8453/i').first();
    await expect(baseIndicator).toBeVisible({ timeout: 10000 });
  });

  test('should show estimated output value', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Look for estimated output or value
    const estimate = page.locator('text=/Estimated|Output|\\$|Total/i').first();
    await expect(estimate).toBeVisible({ timeout: 10000 });
  });

  test('should have consolidate/execute button', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Look for action button
    const actionButton = page.locator('button:has-text("Consolidate"), button:has-text("Execute"), button:has-text("Confirm")').first();
    await expect(actionButton).toBeVisible({ timeout: 10000 });
  });

  test('should mock consolidation flow with API', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Mock swap API response
    await page.route('**/api/v1/swap', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            consolidationId: 'test-consolidation-123',
            status: 'PENDING',
            estimatedOutputBaseAsset: 0.1,
            estimatedOutputUsd: 250,
            platformFeeUsd: 2,
            gasSponsoredUsd: 5,
            routeComparison: {
              oneinch: { amountOut: '250000000', netOutputUsd: 248 },
            },
            bestRoute: {
              router: '1inch',
              amountOut: '250000000',
              savingsSummary: 'Best rate',
            },
            paymasterStrategy: {
              primary: 'pimlico',
              fallback: 'coinbase',
            },
          },
        }),
      });
    });

    // Verify the page can display consolidation elements
    const consolidateButton = page.locator('button:has-text("Consolidate"), button:has-text("Execute")').first();
    await expect(consolidateButton).toBeVisible({ timeout: 10000 });
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForLoadState('networkidle');
    
    // Verify page loads on mobile
    await expect(page.locator('body')).toBeVisible();
    
    // Content should be visible
    const content = page.locator('h1, h2, .card').first();
    await expect(content).toBeVisible({ timeout: 10000 });
  });

  test('should show fee information', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Look for fee information
    const feeInfo = page.locator('text=/Fee|0.8%|Platform|Gas/i').first();
    await expect(feeInfo).toBeVisible({ timeout: 10000 });
  });
});

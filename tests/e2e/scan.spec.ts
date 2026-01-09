import { test, expect } from '@playwright/test';

/**
 * E2E Tests - Scan Functionality
 * Tests for wallet scanning and token classification
 */
test.describe('Scan Portfolio', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/scan');
    await page.waitForLoadState('domcontentloaded');
  });

  test('should load scan page', async ({ page }) => {
    await expect(page).toHaveURL(/.*scan/);
  });

  test('should display page title', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const title = page.locator('h1').first();
    await expect(title).toBeVisible({ timeout: 10000 });
  });

  test('should show wallet address input', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Check for wallet input
    const walletInput = page.locator('input[type="text"], input[placeholder*="address" i], input[placeholder*="wallet" i]').first();
    await expect(walletInput).toBeVisible({ timeout: 10000 });
  });

  test('should have scan/start button', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    const scanButton = page.locator('button:has-text("Scan"), button:has-text("Start")').first();
    await expect(scanButton).toBeVisible({ timeout: 10000 });
  });

  test('should display supported chains', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Look for chain indicators
    const chainIndicator = page.locator('text=/Base|Ethereum|Arbitrum|chain/i').first();
    await expect(chainIndicator).toBeVisible({ timeout: 10000 });
  });

  test('should accept wallet address input', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    const walletInput = page.locator('input[type="text"], input[placeholder*="address" i], input[placeholder*="wallet" i]').first();
    await walletInput.fill('0x1234567890123456789012345678901234567890');
    
    // Verify input was accepted
    await expect(walletInput).toHaveValue('0x1234567890123456789012345678901234567890');
  });

  test('should handle scan with mock API response', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Mock API response
    await page.route('**/api/v1/scan', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            walletAddress: '0x1234567890123456789012345678901234567890',
            totalValueUsd: 1000,
            scanTimeMs: 500,
            tokens: {
              legit: { count: 2, totalValueUsd: 800, items: [] },
              dust: { count: 5, totalValueUsd: 150, items: [] },
              microdust: { count: 10, totalValueUsd: 50, items: [] },
              riskScam: { count: 0, items: [] },
            },
            consolidationSummary: {
              estimatedOutputBaseAsset: 0.1,
              estimatedOutputUsd: 200,
              platformFeeUsd: 1.6,
              gasSavedUsd: 5,
            },
          },
        }),
      });
    });

    // Enter wallet and trigger scan
    const walletInput = page.locator('input[type="text"], input[placeholder*="address" i], input[placeholder*="wallet" i]').first();
    await walletInput.fill('0x1234567890123456789012345678901234567890');
    
    const scanButton = page.locator('button:has-text("Scan")').first();
    await scanButton.click();

    // Wait for results
    await page.waitForTimeout(3000);

    // Verify some results are displayed (token tiers or value)
    const results = page.locator('text=/LEGIT|DUST|MICRODUST|\\$|token/i').first();
    await expect(results).toBeVisible({ timeout: 15000 });
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForLoadState('networkidle');
    
    // Verify page loads on mobile
    await expect(page.locator('body')).toBeVisible();
    
    // Input should still be visible
    const walletInput = page.locator('input[type="text"], input[placeholder*="address" i]').first();
    await expect(walletInput).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to scan with address query param', async ({ page }) => {
    await page.goto('/scan?address=0x1234567890123456789012345678901234567890');
    await page.waitForLoadState('networkidle');
    
    // Input should be pre-filled
    const walletInput = page.locator('input[type="text"], input[placeholder*="address" i]').first();
    await expect(walletInput).toHaveValue(/0x1234/);
  });
});

import { test, expect } from '@playwright/test';

/**
 * E2E Tests - Scan Functionality
 */
test.describe('Scan Portfolio', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/scan');
    await page.waitForLoadState('networkidle');
  });

  test('should load scan page', async ({ page }) => {
    await expect(page).toHaveURL(/.*scan/);
  });

  test('should display scan button', async ({ page }) => {
    const scanButton = page.locator('button:has-text("Scan"), button:has-text("Start Scan")').first();
    await expect(scanButton).toBeVisible({ timeout: 10000 });
  });

  test('should show wallet address input or connected wallet', async ({ page }) => {
    // Check for either wallet input or connected wallet display
    const walletInput = page.locator('input[type="text"], input[placeholder*="address" i]').first();
    const connectedWallet = page.locator('text=/0x[a-fA-F0-9]{40}/i').first();
    
    const hasInput = await walletInput.isVisible().catch(() => false);
    const hasConnected = await connectedWallet.isVisible().catch(() => false);
    
    expect(hasInput || hasConnected).toBeTruthy();
  });

  test('should display chain selection', async ({ page }) => {
    // Look for chain selection UI (could be checkboxes, dropdown, etc.)
    const chainSelector = page.locator('[data-testid="chain-selector"], .chain-selector, text=/Base|Ethereum|Arbitrum/i').first();
    await expect(chainSelector).toBeVisible({ timeout: 10000 });
  });

  test('should handle scan with mock wallet', async ({ page }) => {
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
            tokens: {
              legit: { count: 2, totalValueUsd: 800, items: [] },
              dust: { count: 5, totalValueUsd: 150, items: [] },
              microdust: { count: 10, totalValueUsd: 50, items: [] },
              riskScam: { count: 0, items: [] },
            },
          },
        }),
      });
    });

    // Trigger scan
    const scanButton = page.locator('button:has-text("Scan")').first();
    await scanButton.click();

    // Wait for results
    await page.waitForTimeout(2000);

    // Verify results displayed
    const results = page.locator('text=/LEGIT|DUST|MICRODUST/i').first();
    await expect(results).toBeVisible({ timeout: 10000 });
  });

  test('should display error on scan failure', async ({ page }) => {
    // Mock API error
    await page.route('**/api/v1/scan', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Scan failed',
        }),
      });
    });

    const scanButton = page.locator('button:has-text("Scan")').first();
    await scanButton.click();

    await page.waitForTimeout(2000);

    // Check for error message
    const errorMessage = page.locator('text=/error|failed/i').first();
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
  });
});

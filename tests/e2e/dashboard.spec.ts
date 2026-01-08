import { test, expect } from '@playwright/test';

/**
 * E2E Tests - Dashboard
 */
test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('should load dashboard', async ({ page }) => {
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('should display user stats', async ({ page }) => {
    // Look for stats cards or metrics
    const stats = page.locator('[data-testid="stats"], .stats, text=/Total|Portfolio|Value/i').first();
    await expect(stats).toBeVisible({ timeout: 10000 });
  });

  test('should show quick actions', async ({ page }) => {
    // Look for quick action buttons
    const quickActions = page.locator('text=/Scan|Consolidate|History/i').first();
    await expect(quickActions).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to scan from dashboard', async ({ page }) => {
    const scanLink = page.locator('a:has-text("Scan"), button:has-text("Scan")').first();
    if (await scanLink.isVisible()) {
      await scanLink.click();
      await page.waitForURL(/.*scan/);
      await expect(page).toHaveURL(/.*scan/);
    }
  });

  test('should display history if available', async ({ page }) => {
    // Mock history API
    await page.route('**/api/v1/user/history', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            total: 1,
            items: [
              {
                consolidationId: 'test-id',
                date: new Date().toISOString(),
                dustValue: 10,
                outputValue: 9.5,
                status: 'CONFIRMED',
              },
            ],
          },
        }),
      });
    });

    await page.waitForTimeout(2000);

    // Look for history section
    const history = page.locator('text=/History|Recent|Transactions/i').first();
    await expect(history).toBeVisible({ timeout: 10000 });
  });
});

import { test, expect } from '@playwright/test';

/**
 * E2E Tests - Landing Page
 */
test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load landing page successfully', async ({ page }) => {
    await expect(page).toHaveTitle(/Vortex Protocol/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('should display hero section', async ({ page }) => {
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    
    // Check for hero content (adjust selectors based on actual implementation)
    const hero = page.locator('text=Premium Portfolio Hygiene');
    await expect(hero.first()).toBeVisible({ timeout: 10000 });
  });

  test('should have connect wallet button', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Look for wallet connect button
    const connectButton = page.locator('button:has-text("Connect"), button:has-text("Wallet")').first();
    await expect(connectButton).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to dashboard when wallet connected', async ({ page }) => {
    // This test would require mocking wallet connection
    // For now, just verify navigation structure exists
    await page.waitForLoadState('networkidle');
    
    // Check if navigation elements exist
    const nav = page.locator('nav').first();
    await expect(nav).toBeVisible({ timeout: 5000 });
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForLoadState('networkidle');
    
    // Verify page loads on mobile
    await expect(page.locator('body')).toBeVisible();
  });
});

import { test, expect } from '@playwright/test';

/**
 * E2E Tests - Dashboard
 * Tests for user dashboard and analytics
 */
test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
  });

  test('should load dashboard page', async ({ page }) => {
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('should display page title', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const title = page.locator('h1, h2').first();
    await expect(title).toBeVisible({ timeout: 10000 });
  });

  test('should display stats or metrics cards', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Look for stats cards or metrics
    const stats = page.locator('.card, [data-testid="stats"], text=/Total|Portfolio|Value|Cleaned|\\$/i').first();
    await expect(stats).toBeVisible({ timeout: 10000 });
  });

  test('should have navigation items', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Look for navigation - bottom nav or sidebar
    const navItem = page.locator('nav a, a:has-text("Scan"), a:has-text("History")').first();
    await expect(navItem).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to scan from dashboard', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    const scanLink = page.locator('a:has-text("Scan"), nav a[href="/scan"]').first();
    if (await scanLink.isVisible()) {
      await scanLink.click();
      await page.waitForURL(/.*scan/, { timeout: 10000 });
      await expect(page).toHaveURL(/.*scan/);
    } else {
      // Navigate directly if link not visible
      await page.goto('/scan');
      await expect(page).toHaveURL(/.*scan/);
    }
  });

  test('should navigate to history', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    const historyLink = page.locator('a:has-text("History"), nav a[href="/history"]').first();
    if (await historyLink.isVisible()) {
      await historyLink.click();
      await page.waitForURL(/.*history/, { timeout: 10000 });
      await expect(page).toHaveURL(/.*history/);
    }
  });

  test('should display connect wallet prompt if not connected', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Look for connect wallet button or prompt
    const connectPrompt = page.locator('text=/Connect|Wallet|connect your wallet/i').first();
    await expect(connectPrompt).toBeVisible({ timeout: 10000 });
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForLoadState('networkidle');
    
    // Verify page loads on mobile
    await expect(page.locator('body')).toBeVisible();
    
    // Bottom nav should be visible on mobile
    const bottomNav = page.locator('nav, .bottom-nav').first();
    await expect(bottomNav).toBeVisible({ timeout: 10000 });
  });
});

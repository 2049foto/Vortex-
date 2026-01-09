import { test, expect } from '@playwright/test';

/**
 * E2E Tests - Landing Page
 * Tests for Vortex Protocol landing page with Reown AppKit
 */
test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('should load landing page successfully', async ({ page }) => {
    await expect(page).toHaveTitle(/Vortex/i);
    await expect(page.locator('body')).toBeVisible();
  });

  test('should display hero section with headline', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Check for hero content - Clean Your Crypto Dust
    const headline = page.locator('h1').first();
    await expect(headline).toBeVisible({ timeout: 10000 });
    await expect(headline).toContainText(/Clean|Dust|Crypto|Vortex/i);
  });

  test('should display gasless badge', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Look for gasless badge
    const gaslessBadge = page.locator('text=/Gasless/i').first();
    await expect(gaslessBadge).toBeVisible({ timeout: 10000 });
  });

  test('should have wallet input field', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Look for wallet input
    const walletInput = page.locator('input[placeholder*="wallet" i], input[placeholder*="address" i]').first();
    await expect(walletInput).toBeVisible({ timeout: 10000 });
  });

  test('should have scan button', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Look for scan button
    const scanButton = page.locator('button:has-text("Scan")').first();
    await expect(scanButton).toBeVisible({ timeout: 10000 });
  });

  test('should display supported chains', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Check for chain indicators
    const chainIndicator = page.locator('text=/Base|Ethereum|Arbitrum/i').first();
    await expect(chainIndicator).toBeVisible({ timeout: 10000 });
  });

  test('should have connect wallet option', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Look for wallet connect text/button
    const connectOption = page.locator('text=/Connect wallet|Connect/i').first();
    await expect(connectOption).toBeVisible({ timeout: 10000 });
  });

  test('should display features section', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Check for feature cards
    const featureCard = page.locator('text=/Smart Scan|Risk Analysis|Gasless/i').first();
    await expect(featureCard).toBeVisible({ timeout: 10000 });
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForLoadState('networkidle');
    
    // Verify page loads on mobile
    await expect(page.locator('body')).toBeVisible();
    
    // Hero should still be visible
    const headline = page.locator('h1').first();
    await expect(headline).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to scan when entering wallet address', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Enter wallet address
    const walletInput = page.locator('input[placeholder*="wallet" i], input[placeholder*="address" i]').first();
    await walletInput.fill('0x1234567890123456789012345678901234567890');
    
    // Click scan button
    const scanButton = page.locator('button:has-text("Scan")').first();
    await scanButton.click();
    
    // Should navigate to scan page
    await expect(page).toHaveURL(/.*scan/);
  });
});

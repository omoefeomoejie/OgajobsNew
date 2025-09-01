import { test, expect } from '@playwright/test';

test.describe('Visual Regression Tests', () => {
  test('homepage visual regression', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Wait for dynamic content to load
    await page.waitForTimeout(2000);
    
    // Take full page screenshot
    await expect(page).toHaveScreenshot('homepage-full.png', {
      fullPage: true,
      threshold: 0.2
    });
  });

  test('dashboard visual regression', async ({ page }) => {
    // Mock auth state
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Wait for dashboard components to render
    await page.waitForTimeout(2000);
    
    await expect(page).toHaveScreenshot('dashboard-full.png', {
      fullPage: true,
      threshold: 0.2
    });
  });

  test('mobile responsive design', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 390, height: 844 });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Test mobile navigation
    await expect(page.locator('[data-testid="mobile-nav"]')).toBeVisible();
    await expect(page).toHaveScreenshot('mobile-homepage.png', {
      threshold: 0.2
    });
  });

  test('dark mode visual consistency', async ({ page }) => {
    await page.goto('/');
    
    // Switch to dark mode
    await page.locator('[data-testid="theme-toggle"]').click();
    await page.waitForTimeout(1000);
    
    await expect(page).toHaveScreenshot('dark-mode-homepage.png', {
      fullPage: true,
      threshold: 0.2
    });
  });
});
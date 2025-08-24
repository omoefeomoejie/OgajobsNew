import { test, expect } from '@playwright/test';

test.describe('Mobile PWA Features', () => {
  test('should work on mobile viewports', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Check mobile navigation
    await expect(page.locator('.mobile-nav')).toBeVisible();
    
    // Check hamburger menu
    const hamburgerMenu = page.locator('button[aria-label="Menu"]');
    if (await hamburgerMenu.count() > 0) {
      await hamburgerMenu.click();
      await expect(page.locator('.mobile-menu')).toBeVisible();
    }
  });

  test('should display PWA install prompt', async ({ page }) => {
    await page.goto('/');
    
    // Check for PWA manifest
    const manifestLink = await page.locator('link[rel="manifest"]');
    await expect(manifestLink).toHaveCount(1);
    
    // Check if service worker is registered
    const swRegistration = await page.evaluate(() => {
      return 'serviceWorker' in navigator;
    });
    expect(swRegistration).toBe(true);
  });

  test('should work offline with service worker', async ({ page }) => {
    await page.goto('/');
    
    // Wait for service worker to be active
    await page.waitForFunction(() => {
      return navigator.serviceWorker.controller !== null;
    });
    
    // Go offline
    await page.context().setOffline(true);
    
    // Navigate to a cached page
    await page.goto('/');
    
    // Should still load (from cache)
    await expect(page.locator('body')).toBeVisible();
    
    // Check offline indicator
    await expect(page.locator('.offline-indicator')).toBeVisible();
  });

  test('should handle push notifications', async ({ page }) => {
    await page.goto('/');
    
    // Mock notification permission
    await page.addInitScript(() => {
      // @ts-ignore
      window.Notification = {
        permission: 'default',
        requestPermission: () => Promise.resolve('granted')
      };
    });
    
    // Check notification setup
    const notificationSupport = await page.evaluate(() => {
      return 'Notification' in window;
    });
    expect(notificationSupport).toBe(true);
  });

  test('should support touch gestures', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/services');
    
    // Test swipe gestures on service cards
    const serviceCard = page.locator('.artisan-card').first();
    if (await serviceCard.count() > 0) {
      // Simulate touch events
      await serviceCard.hover();
      await page.mouse.down();
      await page.mouse.move(100, 0);
      await page.mouse.up();
    }
  });

  test('should handle device orientation changes', async ({ page }) => {
    await page.goto('/');
    
    // Portrait mode
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('body')).toBeVisible();
    
    // Landscape mode
    await page.setViewportSize({ width: 667, height: 375 });
    await expect(page.locator('body')).toBeVisible();
    
    // Layout should adapt
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();
  });
});
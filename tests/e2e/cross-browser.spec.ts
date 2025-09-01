import { test, expect, devices } from '@playwright/test';

const deviceTests = [
  { name: 'Desktop Chrome', ...devices['Desktop Chrome'] },
  { name: 'Desktop Firefox', ...devices['Desktop Firefox'] },
  { name: 'Desktop Safari', ...devices['Desktop Safari'] },
  { name: 'iPhone 13', ...devices['iPhone 13'] },
  { name: 'Pixel 7', ...devices['Pixel 7'] },
  { name: 'iPad Pro', ...devices['iPad Pro'] }
];

for (const device of deviceTests) {
  test.describe(`Cross-browser tests - ${device.name}`, () => {
    test.use({ ...device });

    test('homepage loads correctly', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('h1')).toBeVisible({ timeout: 10000 });
      
      // Check for responsive design elements
      const isMobile = device.name.includes('iPhone') || device.name.includes('Pixel');
      if (isMobile) {
        await expect(page.locator('[data-testid="mobile-nav"]')).toBeVisible();
      } else {
        await expect(page.locator('[data-testid="desktop-nav"]')).toBeVisible();
      }
    });

    test('service worker registration', async ({ page }) => {
      await page.goto('/');
      
      const swRegistered = await page.evaluate(async () => {
        return 'serviceWorker' in navigator && await navigator.serviceWorker.ready;
      });
      
      expect(swRegistered).toBeTruthy();
    });

    test('PWA manifest validation', async ({ page }) => {
      await page.goto('/');
      
      const manifestLink = await page.locator('link[rel="manifest"]').getAttribute('href');
      expect(manifestLink).toBe('/manifest.json');
      
      // Check manifest is accessible
      const response = await page.request.get('/manifest.json');
      expect(response.ok()).toBeTruthy();
      
      const manifest = await response.json();
      expect(manifest).toHaveProperty('name');
      expect(manifest).toHaveProperty('short_name');
      expect(manifest).toHaveProperty('start_url');
    });

    test('touch gestures (mobile only)', async ({ page }) => {
      if (!device.name.includes('iPhone') && !device.name.includes('Pixel')) {
        test.skip('Touch gestures only relevant for mobile devices');
      }

      await page.goto('/services');
      
      // Test swipe gesture on service cards
      const firstCard = page.locator('[data-testid="service-card"]').first();
      await firstCard.hover();
      
      // Simulate swipe
      await firstCard.touchAction([
        { action: 'down', x: 100, y: 100 },
        { action: 'move', x: 50, y: 100 },
        { action: 'up' }
      ]);
      
      // Should not crash or show errors
      await expect(page.locator('body')).toBeVisible();
    });
  });
}
import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Mock admin authentication
    await page.route('**/auth/v1/**', route => {
      if (route.request().url().includes('user')) {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user: {
              id: 'admin-user-id',
              email: 'admin@ogajobs.ng',
              role: 'admin'
            }
          })
        });
      } else {
        route.continue();
      }
    });
    
    await page.goto('/');
  });

  test('should access admin dashboard with proper authentication', async ({ page }) => {
    // Navigate to admin login
    await page.goto('/admin-login');
    
    // Fill admin credentials
    await page.fill('input[type="email"]', 'admin@ogajobs.ng');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Should redirect to admin dashboard
    await expect(page).toHaveURL('/admin');
    
    // Check dashboard elements
    await expect(page.locator('h1:has-text("Admin Dashboard")')).toBeVisible();
    await expect(page.locator('text=Total Users')).toBeVisible();
    await expect(page.locator('text=Active Bookings')).toBeVisible();
    await expect(page.locator('text=Revenue')).toBeVisible();
  });

  test('should display admin navigation and features', async ({ page }) => {
    await page.goto('/admin');
    
    // Check admin navigation
    await expect(page.locator('a[href="/admin/users"]')).toBeVisible();
    await expect(page.locator('a[href="/admin/bookings"]')).toBeVisible();
    await expect(page.locator('a[href="/admin/financial-reports"]')).toBeVisible();
    
    // Check dashboard cards
    const dashboardCards = page.locator('.dashboard-card');
    const count = await dashboardCards.count();
    expect(count).toBeGreaterThanOrEqual(4);
  });

  test('should manage users from admin panel', async ({ page }) => {
    await page.goto('/admin/users');
    
    // Should show users table
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('th:has-text("Email")')).toBeVisible();
    await expect(page.locator('th:has-text("Role")')).toBeVisible();
    await expect(page.locator('th:has-text("Status")')).toBeVisible();
    
    // Check user actions
    await expect(page.locator('button:has-text("Edit")')).toBeVisible();
    await expect(page.locator('button:has-text("Suspend")')).toBeVisible();
  });

  test('should display financial reports', async ({ page }) => {
    await page.goto('/admin/financial-reports');
    
    // Should show financial metrics
    await expect(page.locator('text=Total Revenue')).toBeVisible();
    await expect(page.locator('text=Commission Earned')).toBeVisible();
    await expect(page.locator('text=Pending Payouts')).toBeVisible();
    
    // Check charts/graphs
    await expect(page.locator('.chart-container')).toBeVisible();
  });

  test('should handle admin security and permissions', async ({ page }) => {
    // Try to access admin without proper auth
    await page.goto('/admin');
    
    // Should redirect to login or show unauthorized
    const url = page.url();
    expect(url).toMatch(/(admin-login|auth|unauthorized)/);
  });
});
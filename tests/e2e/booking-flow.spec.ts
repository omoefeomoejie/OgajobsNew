import { test, expect } from '@playwright/test';

test.describe('Booking Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('complete booking flow from search to request', async ({ page }) => {
    // Search for services
    await page.fill('input[placeholder*="search"]', 'plumber');
    await page.selectOption('select:has-text("City")', 'Lagos');
    await page.click('button:has-text("Search")');
    
    // Should navigate to services page
    await expect(page).toHaveURL('/services');
    
    // Click on first artisan
    await page.click('.artisan-card:first-child');
    
    // Should show artisan profile
    await expect(page.locator('h1')).toBeVisible();
    
    // Click book now button
    await page.click('button:has-text("Book Now")');
    
    // Should navigate to booking request
    await expect(page).toHaveURL('/booking-request');
    
    // Fill booking form
    await page.fill('textarea[name="description"]', 'I need help with kitchen sink');
    await page.fill('input[name="budget"]', '5000');
    await page.selectOption('select[name="urgency"]', 'normal');
    
    // Set preferred date (tomorrow)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];
    await page.fill('input[type="date"]', dateStr);
    
    // Submit booking request
    await page.click('button[type="submit"]:has-text("Send Request")');
    
    // Should show success message or redirect
    await expect(
      page.locator('text=Booking request sent successfully')
    ).toBeVisible({ timeout: 10000 });
  });

  test('should validate required fields in booking form', async ({ page }) => {
    await page.goto('/booking-request');
    
    // Try to submit empty form
    await page.click('button[type="submit"]');
    
    // Should show validation errors
    await expect(page.locator('text=Description is required')).toBeVisible();
    await expect(page.locator('text=Budget is required')).toBeVisible();
  });

  test('should handle service search with filters', async ({ page }) => {
    // Use the search functionality
    await page.fill('input[placeholder*="search"]', 'electrician');
    await page.selectOption('select:has-text("City")', 'Abuja');
    await page.click('button:has-text("Search")');
    
    // Should show filtered results
    await expect(page).toHaveURL('/services');
    await expect(page.locator('.artisan-card')).toBeVisible();
    
    // Check if results are filtered correctly
    const artisanCards = page.locator('.artisan-card');
    const count = await artisanCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should show artisan profile with correct information', async ({ page }) => {
    await page.goto('/services');
    
    // Click on first artisan
    await page.click('.artisan-card:first-child');
    
    // Should show profile elements
    await expect(page.locator('h1')).toBeVisible(); // Artisan name
    await expect(page.locator('text=Rating')).toBeVisible();
    await expect(page.locator('text=Experience')).toBeVisible();
    await expect(page.locator('button:has-text("Book Now")')).toBeVisible();
  });
});
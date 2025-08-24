import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display auth page and switch between login/signup', async ({ page }) => {
    // Navigate to auth page
    await page.click('text=Sign In');
    await expect(page).toHaveURL('/auth');
    
    // Should show login form by default
    await expect(page.locator('h1')).toContainText('Welcome Back');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    
    // Switch to signup
    await page.click('text=Sign up');
    await expect(page.locator('h1')).toContainText('Create Account');
    
    // Switch back to login
    await page.click('text=Sign in');
    await expect(page.locator('h1')).toContainText('Welcome Back');
  });

  test('should show validation errors for invalid email', async ({ page }) => {
    await page.goto('/auth');
    
    // Enter invalid email
    await page.fill('input[type="email"]', 'invalid-email');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Should show validation error
    await expect(page.locator('text=Invalid email address')).toBeVisible();
  });

  test('should show validation errors for short password on signup', async ({ page }) => {
    await page.goto('/auth');
    
    // Switch to signup
    await page.click('text=Sign up');
    
    // Enter short password
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', '123');
    await page.click('button[type="submit"]');
    
    // Should show validation error
    await expect(page.locator('text=Password must be at least 6 characters')).toBeVisible();
  });

  test('should handle authentication errors gracefully', async ({ page }) => {
    await page.goto('/auth');
    
    // Mock authentication error
    await page.route('**/auth/v1/token**', route => {
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error_description: 'Invalid credentials' })
      });
    });
    
    // Try to login with invalid credentials
    await page.fill('input[type="email"]', 'wrong@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Should show error message
    await expect(page.locator('text=Invalid credentials')).toBeVisible();
  });
});
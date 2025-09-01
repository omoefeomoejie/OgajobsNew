import { test, expect } from '@playwright/test';

test.describe('API Integration Tests', () => {
  test('edge functions health check', async ({ request }) => {
    const healthCheck = await request.get('/api/health-check');
    expect(healthCheck.ok()).toBeTruthy();
    
    const response = await healthCheck.json();
    expect(response).toHaveProperty('status', 'healthy');
  });

  test('authentication flow', async ({ page, request }) => {
    // Test signup API
    const signupResponse = await request.post('/auth/v1/signup', {
      data: {
        email: 'test@example.com',
        password: 'testpassword123'
      }
    });
    
    expect(signupResponse.status()).toBe(200);
    
    // Test login API
    const loginResponse = await request.post('/auth/v1/token?grant_type=password', {
      data: {
        email: 'test@example.com',
        password: 'testpassword123'
      }
    });
    
    expect(loginResponse.status()).toBe(200);
  });

  test('real-time subscriptions', async ({ page }) => {
    let receivedMessage = false;
    
    // Mock WebSocket connection
    await page.addInitScript(() => {
      window.testWebSocket = new WebSocket('ws://localhost:54321/realtime/v1/websocket');
      window.testWebSocket.onmessage = () => {
        window.realtimeConnected = true;
      };
    });
    
    await page.goto('/dashboard');
    
    // Wait for real-time connection
    await page.waitForFunction(() => window.realtimeConnected, { timeout: 5000 });
    
    expect(await page.evaluate(() => window.realtimeConnected)).toBe(true);
  });

  test('push notification registration', async ({ page }) => {
    // Grant notification permissions
    await page.context().grantPermissions(['notifications']);
    
    await page.goto('/dashboard');
    
    // Test push subscription
    const subscriptionResult = await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: 'test-key'
      });
      return !!subscription;
    });
    
    expect(subscriptionResult).toBe(true);
  });

  test('rate limiting compliance', async ({ request }) => {
    const requests = [];
    
    // Send multiple requests rapidly
    for (let i = 0; i < 15; i++) {
      requests.push(request.get('/api/health-check'));
    }
    
    const responses = await Promise.all(requests);
    const rateLimitedResponses = responses.filter(r => r.status() === 429);
    
    // Should have some rate limited responses
    expect(rateLimitedResponses.length).toBeGreaterThan(0);
  });
});
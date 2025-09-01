import { test, expect } from '@playwright/test';

test.describe('Performance Tests', () => {
  test('Core Web Vitals compliance', async ({ page }) => {
    await page.goto('/');
    
    // Measure performance metrics
    const metrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const webVitals = {
            lcp: 0,
            fid: 0,
            cls: 0,
            fcp: 0
          };
          
          entries.forEach((entry) => {
            if (entry.entryType === 'largest-contentful-paint') {
              webVitals.lcp = entry.startTime;
            }
            if (entry.entryType === 'first-input') {
              webVitals.fid = entry.processingStart - entry.startTime;
            }
            if (entry.entryType === 'layout-shift' && !entry.hadRecentInput) {
              webVitals.cls += entry.value;
            }
            if (entry.entryType === 'paint' && entry.name === 'first-contentful-paint') {
              webVitals.fcp = entry.startTime;
            }
          });
          
          setTimeout(() => resolve(webVitals), 3000);
        });
        
        observer.observe({ type: 'largest-contentful-paint', buffered: true });
        observer.observe({ type: 'first-input', buffered: true });
        observer.observe({ type: 'layout-shift', buffered: true });
        observer.observe({ type: 'paint', buffered: true });
      });
    });
    
    // Core Web Vitals thresholds
    expect(metrics.lcp).toBeLessThan(2500); // Good LCP < 2.5s
    expect(metrics.fid).toBeLessThan(100);  // Good FID < 100ms
    expect(metrics.cls).toBeLessThan(0.1);  // Good CLS < 0.1
    expect(metrics.fcp).toBeLessThan(1800); // Good FCP < 1.8s
  });

  test('bundle size optimization', async ({ page }) => {
    const response = await page.goto('/');
    
    // Check main bundle size
    const resourceSizes = await page.evaluate(() => {
      const resources = performance.getEntriesByType('resource');
      return resources
        .filter(r => r.name.includes('.js'))
        .map(r => ({ name: r.name, size: r.transferSize }));
    });
    
    const mainBundle = resourceSizes.find(r => r.name.includes('index'));
    expect(mainBundle?.size).toBeLessThan(500000); // < 500KB
  });

  test('lazy loading effectiveness', async ({ page }) => {
    await page.goto('/');
    
    // Initial resource count
    const initialResources = await page.evaluate(() => 
      performance.getEntriesByType('resource').length
    );
    
    // Navigate to heavy page
    await page.click('a[href="/services"]');
    await page.waitForLoadState('networkidle');
    
    // Check additional resources were loaded lazily
    const finalResources = await page.evaluate(() => 
      performance.getEntriesByType('resource').length
    );
    
    expect(finalResources).toBeGreaterThan(initialResources);
  });

  test('service worker cache performance', async ({ page }) => {
    // First visit
    await page.goto('/');
    const firstLoadTime = await page.evaluate(() => 
      performance.timing.loadEventEnd - performance.timing.navigationStart
    );
    
    // Second visit (should use cache)
    await page.reload();
    const secondLoadTime = await page.evaluate(() => 
      performance.timing.loadEventEnd - performance.timing.navigationStart
    );
    
    // Second load should be faster due to caching
    expect(secondLoadTime).toBeLessThan(firstLoadTime * 0.8);
  });

  test('memory usage monitoring', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Monitor memory usage during navigation
    const memoryUsage = await page.evaluate(() => {
      if ('memory' in performance) {
        return {
          used: performance.memory.usedJSHeapSize,
          total: performance.memory.totalJSHeapSize,
          limit: performance.memory.jsHeapSizeLimit
        };
      }
      return null;
    });
    
    if (memoryUsage) {
      // Memory usage should be reasonable
      expect(memoryUsage.used).toBeLessThan(50 * 1024 * 1024); // < 50MB
      expect(memoryUsage.used / memoryUsage.total).toBeLessThan(0.9); // < 90% of total
    }
  });
});
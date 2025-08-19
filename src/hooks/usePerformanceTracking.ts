import { useEffect, useState } from 'react';

interface PerformanceMetrics {
  loadTime: number;
  firstPaint: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
}

export function usePerformanceMonitoring() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const measurePerformance = () => {
      try {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        const paint = performance.getEntriesByType('paint');
        
        const firstPaint = paint.find(entry => entry.name === 'first-paint')?.startTime || 0;
        const firstContentfulPaint = paint.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0;

        setMetrics({
          loadTime: navigation.loadEventEnd - navigation.fetchStart,
          firstPaint,
          firstContentfulPaint,
          largestContentfulPaint: 0, // Would need PerformanceObserver for this
          cumulativeLayoutShift: 0   // Would need PerformanceObserver for this
        });
      } catch (error) {
        console.warn('Performance monitoring not available:', error);
      }
    };

    // Measure after page load
    if (document.readyState === 'complete') {
      measurePerformance();
    } else {
      window.addEventListener('load', measurePerformance);
      return () => window.removeEventListener('load', measurePerformance);
    }
  }, []);

  return metrics;
}

// Simple performance tracking for critical user actions
export function trackUserAction(action: string, startTime?: number) {
  if (typeof window === 'undefined') return;
  
  const endTime = performance.now();
  const duration = startTime ? endTime - startTime : 0;
  
  console.log(`Performance: ${action} took ${duration.toFixed(2)}ms`);
  
  // Could send to analytics service here
  if ((window as any).gtag) {
    (window as any).gtag('event', 'timing_complete', {
      name: action,
      value: Math.round(duration)
    });
  }
}

// Preload critical resources
export function preloadResource(href: string, as: 'script' | 'style' | 'font' | 'image' = 'script') {
  if (typeof document === 'undefined') return;
  
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  link.as = as;
  
  if (as === 'font') {
    link.crossOrigin = 'anonymous';
  }
  
  document.head.appendChild(link);
}
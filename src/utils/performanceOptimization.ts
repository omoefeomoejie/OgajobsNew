// Bundle size monitoring and optimization utilities
import { logger } from '@/lib/logger';

export const reportBundleSize = () => {
  if (typeof window !== 'undefined' && 'performance' in window) {
    const entries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    const navigationEntry = entries[0];
    
    if (navigationEntry) {
      console.group('📊 Bundle Performance Metrics');
      // Performance metrics logged
      logger.debug('DOM Content Loaded', { 
        duration: `${navigationEntry.domContentLoadedEventEnd - navigationEntry.domContentLoadedEventStart}ms`
      });
      logger.debug('Load Complete', { 
        duration: `${navigationEntry.loadEventEnd - navigationEntry.loadEventStart}ms`
      });
      logger.debug('Transfer Size', { 
        size: `${navigationEntry.transferSize} bytes`
      });
      console.groupEnd();
    }
  }
};

export const measureComponentRender = (componentName: string, startTime: number) => {
  const endTime = performance.now();
  const renderTime = endTime - startTime;
  
  if (renderTime > 100) {
    console.warn(`⚠️ Slow render detected: ${componentName} took ${renderTime.toFixed(2)}ms`);
  }
  
  return renderTime;
};

// Image optimization utilities
export const optimizeImage = (src: string, width?: number, height?: number): string => {
  // Add image optimization parameters for supported services
  if (src.includes('supabase')) {
    const url = new URL(src);
    if (width) url.searchParams.set('width', width.toString());
    if (height) url.searchParams.set('height', height.toString());
    url.searchParams.set('resize', 'cover');
    url.searchParams.set('quality', '85');
    return url.toString();
  }
  
  return src;
};

// Lazy loading intersection observer
export const createLazyLoadObserver = (callback: (entries: IntersectionObserverEntry[]) => void) => {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
    return null;
  }
  
  return new IntersectionObserver(callback, {
    rootMargin: '50px 0px',
    threshold: 0.1
  });
};

// Critical resource hints
export const addResourceHints = () => {
  if (typeof document === 'undefined') return;
  
  const hints = [
    { rel: 'dns-prefetch', href: '//fonts.googleapis.com' },
    { rel: 'dns-prefetch', href: '//fonts.gstatic.com' },
    { rel: 'preconnect', href: 'https://api.supabase.co' },
  ];
  
  hints.forEach(hint => {
    const existing = document.querySelector(`link[href="${hint.href}"]`);
    if (!existing) {
      const link = document.createElement('link');
      link.rel = hint.rel;
      link.href = hint.href;
      if (hint.rel === 'preconnect') {
        link.crossOrigin = 'anonymous';
      }
      document.head.appendChild(link);
    }
  });
};

// Service Worker registration for PWA
export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      // SW registered successfully
      return registration;
    } catch (registrationError) {
      // SW registration failed
    }
  }
};

// Performance observer for Web Vitals
export const observeWebVitals = () => {
  if (typeof window === 'undefined' || !('performance' in window)) return;
  
  // Observe CLS (Cumulative Layout Shift)
  const clsObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      // CLS observed
    }
  });
  
  // Observe LCP (Largest Contentful Paint)
  const lcpObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      // LCP observed
    }
  });
  
  try {
    clsObserver.observe({ type: 'layout-shift', buffered: true });
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
  } catch (e) {
    // Observers not supported
  }
};
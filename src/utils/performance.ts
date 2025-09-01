// Performance optimization utilities
import { logger } from '@/lib/logger';

export interface PerformanceMetrics {
  renderTime: number;
  componentCount: number;
  memoryUsage: number;
  networkRequests: number;
}

// Debounce function for performance optimization
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
}

// Throttle function for performance optimization
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func.apply(null, args);
    }
  };
}

// Memoization utility
export function memoize<T extends (...args: any[]) => any>(
  func: T,
  getKey?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();
  
  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = getKey ? getKey(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    
    const result = func(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

// Bundle size analyzer
export const analyzeBundleSize = () => {
  if (typeof window === 'undefined') return;
  
  const scripts = Array.from(document.querySelectorAll('script[src]'));
  const stylesheets = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
  
  console.group('📦 Bundle Analysis');
  // Performance metrics logged
  logger.debug('Scripts loaded', { count: scripts.length });
  logger.debug('Stylesheets loaded', { count: stylesheets.length });
  
  // Measure script sizes (approximation)
  scripts.forEach((script, index) => {
    const src = (script as HTMLScriptElement).src;
    if (src) {
      fetch(src, { method: 'HEAD' })
        .then(response => {
          const size = response.headers.get('content-length');
          if (size) {
            logger.debug(`Script ${index + 1}: ${(parseInt(size) / 1024).toFixed(2)}KB`);
          }
        })
        .catch(() => {
          logger.debug(`Script ${index + 1}: Size unknown`);
        });
    }
  });
  
  console.groupEnd();
};

// Performance monitoring utilities
export const performanceObserver = {
  observeLCP: (callback: (value: number) => void) => {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lcp = entries[entries.length - 1] as any;
        callback(lcp.startTime);
      });
      observer.observe({ type: 'largest-contentful-paint', buffered: true });
      return observer;
    }
  },
  
  observeFID: (callback: (value: number) => void) => {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          callback(entry.processingStart - entry.startTime);
        });
      });
      observer.observe({ type: 'first-input', buffered: true });
      return observer;
    }
  },
  
  observeCLS: (callback: (value: number) => void) => {
    if ('PerformanceObserver' in window) {
      let clsValue = 0;
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            callback(clsValue);
          }
        });
      });
      observer.observe({ type: 'layout-shift', buffered: true });
      return observer;
    }
  }
};

// Memory usage monitoring
export const getMemoryUsage = (): any => {
  if ('memory' in performance) {
    return (performance as any).memory;
  }
  return null;
};

// Network performance monitoring
export const monitorNetworkRequests = () => {
  if ('PerformanceObserver' in window) {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.entryType === 'navigation') {
          logger.debug('Navigation timing:', entry);
        } else if (entry.entryType === 'resource') {
          const resource = entry as PerformanceResourceTiming;
          if (resource.duration > 1000) { // Log slow resources
            console.warn(`Slow resource: ${resource.name} (${resource.duration}ms)`);
          }
        }
      });
    });
    
    observer.observe({ type: 'navigation', buffered: true });
    observer.observe({ type: 'resource', buffered: true });
    return observer;
  }
};

// Code splitting utilities
export const loadComponentChunk = async (chunkName: string) => {
  try {
    const start = performance.now();
    const module = await import(/* webpackChunkName: "[request]" */ `../components/${chunkName}`);
    const end = performance.now();
    
    logger.debug(`Chunk ${chunkName} loaded in ${(end - start).toFixed(2)}ms`);
    return module.default;
  } catch (error) {
    console.error(`Failed to load chunk ${chunkName}:`, error);
    throw error;
  }
};

// Preload critical resources
export const preloadCriticalResources = (resources: string[]) => {
  resources.forEach(resource => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = resource;
    
    if (resource.endsWith('.js')) {
      link.as = 'script';
    } else if (resource.endsWith('.css')) {
      link.as = 'style';
    } else if (resource.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      link.as = 'image';
    }
    
    document.head.appendChild(link);
  });
};
import { useEffect, useState, useCallback } from 'react';

interface PerformanceMetrics {
  // Core Web Vitals
  fcp: number | null; // First Contentful Paint
  lcp: number | null; // Largest Contentful Paint
  fid: number | null; // First Input Delay
  cls: number | null; // Cumulative Layout Shift
  
  // Additional metrics
  ttfb: number | null; // Time to First Byte
  domContentLoaded: number | null;
  loadComplete: number | null;
  
  // Memory usage (if available)
  usedJSHeapSize: number | null;
  totalJSHeapSize: number | null;
  
  // Network information
  connectionType: string | null;
  effectiveType: string | null;
  
  // Bundle size estimate
  bundleSize: number | null;
}

interface PerformanceObserverEntry {
  name: string;
  entryType: string;
  startTime: number;
  value?: number;
}

export function usePerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fcp: null,
    lcp: null,
    fid: null,
    cls: null,
    ttfb: null,
    domContentLoaded: null,
    loadComplete: null,
    usedJSHeapSize: null,
    totalJSHeapSize: null,
    connectionType: null,
    effectiveType: null,
    bundleSize: null,
  });

  const [performanceScore, setPerformanceScore] = useState<number>(0);

  // Calculate performance score based on Core Web Vitals
  const calculateScore = useCallback((metrics: PerformanceMetrics) => {
    let score = 100;
    
    // LCP scoring (40% weight)
    if (metrics.lcp) {
      if (metrics.lcp > 4000) score -= 40;
      else if (metrics.lcp > 2500) score -= 20;
    }
    
    // FID scoring (30% weight)
    if (metrics.fid) {
      if (metrics.fid > 300) score -= 30;
      else if (metrics.fid > 100) score -= 15;
    }
    
    // CLS scoring (30% weight)
    if (metrics.cls) {
      if (metrics.cls > 0.25) score -= 30;
      else if (metrics.cls > 0.1) score -= 15;
    }
    
    return Math.max(0, score);
  }, []);

  const measureWebVitals = useCallback(() => {
    // Measure FCP
    if ('PerformanceObserver' in window) {
      try {
        const fcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
          if (fcpEntry) {
            setMetrics(prev => ({ ...prev, fcp: fcpEntry.startTime }));
          }
        });
        fcpObserver.observe({ entryTypes: ['paint'] });

        // Measure LCP
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          if (lastEntry) {
            setMetrics(prev => ({ ...prev, lcp: lastEntry.startTime }));
          }
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

        // Measure FID
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries() as any[];
          const fidEntry = entries[0];
          if (fidEntry) {
            setMetrics(prev => ({ ...prev, fid: fidEntry.processingStart - fidEntry.startTime }));
          }
        });
        fidObserver.observe({ entryTypes: ['first-input'] });

        // Measure CLS
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries() as any[];
          entries.forEach((entry) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
              setMetrics(prev => ({ ...prev, cls: clsValue }));
            }
          });
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });

        // Measure navigation timing
        const navObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries() as any[];
          const navEntry = entries[0];
          if (navEntry) {
            setMetrics(prev => ({
              ...prev,
              ttfb: navEntry.responseStart - navEntry.requestStart,
              domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.navigationStart,
              loadComplete: navEntry.loadEventEnd - navEntry.navigationStart,
            }));
          }
        });
        navObserver.observe({ entryTypes: ['navigation'] });

      } catch (error) {
        console.warn('Performance Observer not fully supported:', error);
      }
    }

    // Measure memory usage
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      setMetrics(prev => ({
        ...prev,
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
      }));
    }

    // Get network information
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      setMetrics(prev => ({
        ...prev,
        connectionType: connection.type || null,
        effectiveType: connection.effectiveType || null,
      }));
    }

    // Estimate bundle size from resource timing
    const resources = performance.getEntriesByType('resource') as any[];
    const jsResources = resources.filter(r => r.name.includes('.js'));
    const totalSize = jsResources.reduce((sum, resource) => {
      return sum + (resource.transferSize || 0);
    }, 0);
    
    setMetrics(prev => ({ ...prev, bundleSize: totalSize }));
  }, []);

  const getPerformanceReport = useCallback(() => {
    return {
      metrics,
      score: performanceScore,
      recommendations: getRecommendations(metrics),
      grade: getPerformanceGrade(performanceScore),
    };
  }, [metrics, performanceScore]);

  const getRecommendations = (metrics: PerformanceMetrics) => {
    const recommendations: string[] = [];
    
    if (metrics.lcp && metrics.lcp > 2500) {
      recommendations.push('Optimize Largest Contentful Paint by reducing server response times and optimizing images');
    }
    
    if (metrics.fid && metrics.fid > 100) {
      recommendations.push('Improve First Input Delay by reducing JavaScript execution time');
    }
    
    if (metrics.cls && metrics.cls > 0.1) {
      recommendations.push('Reduce Cumulative Layout Shift by setting dimensions for images and ads');
    }
    
    if (metrics.bundleSize && metrics.bundleSize > 1000000) {
      recommendations.push('Consider code splitting to reduce bundle size');
    }
    
    if (metrics.ttfb && metrics.ttfb > 600) {
      recommendations.push('Optimize server response time');
    }
    
    return recommendations;
  };

  const getPerformanceGrade = (score: number) => {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  };

  // Send performance data to analytics
  const reportToAnalytics = useCallback((metrics: PerformanceMetrics) => {
    // Here you would send to your analytics service
    console.log('Performance Metrics:', metrics);
    
    // Example: Send to Google Analytics 4
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'web_vitals', {
        event_category: 'Web Vitals',
        event_label: 'Core Web Vitals',
        custom_map: {
          metric_1: 'lcp',
          metric_2: 'fid', 
          metric_3: 'cls'
        },
        metric_1: metrics.lcp,
        metric_2: metrics.fid,
        metric_3: metrics.cls,
      });
    }
  }, []);

  useEffect(() => {
    measureWebVitals();
    
    // Report metrics after page load
    window.addEventListener('load', () => {
      setTimeout(() => {
        reportToAnalytics(metrics);
      }, 1000);
    });

    // Periodic monitoring every 30 seconds
    const interval = setInterval(() => {
      measureWebVitals();
    }, 30000);

    return () => clearInterval(interval);
  }, [measureWebVitals, reportToAnalytics, metrics]);

  // Update performance score when metrics change
  useEffect(() => {
    const score = calculateScore(metrics);
    setPerformanceScore(score);
  }, [metrics, calculateScore]);

  return {
    metrics,
    performanceScore,
    getPerformanceReport,
    measureWebVitals,
  };
}
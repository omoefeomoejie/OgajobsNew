import React, { createContext, useContext, useEffect, useState } from 'react';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';
import { cacheUtils } from '@/lib/queryClient';

interface PerformanceMetrics {
  fcp: number | null;
  lcp: number | null;
  fid: number | null;
  cls: number | null;
  ttfb: number | null;
  domContentLoaded: number | null;
  loadComplete: number | null;
  usedJSHeapSize: number | null;
  totalJSHeapSize: number | null;
  connectionType: string | null;
  effectiveType: string | null;
  bundleSize: number | null;
}

interface PerformanceContextType {
  metrics: PerformanceMetrics | null;
  performanceScore: number;
  optimizationRecommendations: string[];
  clearCache: () => void;
  reportSlowComponent: (componentName: string, renderTime: number) => void;
}

const PerformanceContext = createContext<PerformanceContextType | null>(null);

interface PerformanceProviderProps {
  children: React.ReactNode;
  enableMonitoring?: boolean;
  performanceBudget?: {
    maxBundleSize: number;
    maxLoadTime: number;
    maxRenderTime: number;
  };
}

export function PerformanceProvider({ 
  children, 
  enableMonitoring = true,
  performanceBudget = {
    maxBundleSize: 500 * 1024, // 500KB
    maxLoadTime: 3000, // 3 seconds
    maxRenderTime: 16, // 16ms (60fps)
  }
}: PerformanceProviderProps) {
  const { metrics, performanceScore, getPerformanceReport } = usePerformanceMonitor();
  const [slowComponents, setSlowComponents] = useState<Map<string, number>>(new Map());
  const [optimizationRecommendations, setOptimizationRecommendations] = useState<string[]>([]);

  // Monitor performance budget violations
  useEffect(() => {
    if (!metrics || !enableMonitoring) return;

    const recommendations: string[] = [];
    
    // Check bundle size (estimated)
    if (metrics.bundleSize && metrics.bundleSize > performanceBudget.maxBundleSize) {
      recommendations.push(`Bundle size (${(metrics.bundleSize / 1024).toFixed(0)}KB) exceeds budget (${(performanceBudget.maxBundleSize / 1024).toFixed(0)}KB)`);
    }
    
    // Check FCP timing instead of load time
    if (metrics.fcp && metrics.fcp > performanceBudget.maxLoadTime) {
      recommendations.push('First Contentful Paint is slow. Consider optimizing critical resources.');
    }
    
    // Check LCP
    if (metrics.lcp && metrics.lcp > 4000) {
      recommendations.push('Largest Contentful Paint is slow. Optimize largest elements and images.');
    }
    
    // Check CLS
    if (metrics.cls && metrics.cls > 0.25) {
      recommendations.push('High Cumulative Layout Shift detected. Fix layout shifts in components.');
    }
    
    // Check memory usage
    if (metrics.usedJSHeapSize && metrics.usedJSHeapSize > 50 * 1024 * 1024) {
      recommendations.push('High memory usage detected. Consider implementing memory optimization.');
    }
    
    // Check slow components
    Array.from(slowComponents.entries()).forEach(([component, time]) => {
      if (time > performanceBudget.maxRenderTime) {
        recommendations.push(`Component "${component}" is slow (${time.toFixed(1)}ms). Consider memoization.`);
      }
    });
    
    setOptimizationRecommendations(recommendations);
  }, [metrics, enableMonitoring, performanceBudget, slowComponents]);

  // Report slow component renders
  const reportSlowComponent = (componentName: string, renderTime: number) => {
    setSlowComponents(prev => new Map(prev.set(componentName, renderTime)));
  };

  // Clear caches and report performance impact
  const clearCache = () => {
    const beforeClear = cacheUtils.getCacheStats();
    cacheUtils.clearExpiredCache();
    
    // Report cache clearing impact
    if (typeof window !== 'undefined' && 'gtag' in window) {
      (window as any).gtag('event', 'cache_cleared', {
        queries_cleared: beforeClear.totalQueries,
        memory_freed: beforeClear.memoryUsage,
      });
    }
  };

  // Monitor and report performance metrics to analytics
  useEffect(() => {
    if (!metrics || !enableMonitoring) return;

    const report = getPerformanceReport();
    
    // Send performance data to analytics
    if (typeof window !== 'undefined' && 'gtag' in window) {
      (window as any).gtag('event', 'performance_report', {
        performance_score: performanceScore,
        fcp: metrics.fcp,
        lcp: metrics.lcp,
        cls: metrics.cls,
        memory_usage: metrics.usedJSHeapSize || 0,
      });
    }

    // Log performance issues to console in development
    if (process.env.NODE_ENV === 'development' && optimizationRecommendations.length > 0) {
      console.group('🚀 Performance Optimization Recommendations');
      optimizationRecommendations.forEach(rec => console.warn('⚠️', rec));
      console.groupEnd();
    }
  }, [metrics, performanceScore, getPerformanceReport, optimizationRecommendations, enableMonitoring]);

  const contextValue: PerformanceContextType = {
    metrics,
    performanceScore,
    optimizationRecommendations,
    clearCache,
    reportSlowComponent,
  };

  return (
    <PerformanceContext.Provider value={contextValue}>
      {children}
    </PerformanceContext.Provider>
  );
}

export function usePerformanceContext() {
  const context = useContext(PerformanceContext);
  if (!context) {
    throw new Error('usePerformanceContext must be used within a PerformanceProvider');
  }
  return context;
}

// HOC for monitoring component render performance
export function withPerformanceMonitoring<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) {
  const PerformanceMonitoredComponent = React.memo((props: P) => {
    const { reportSlowComponent } = usePerformanceContext();
    
    useEffect(() => {
      const startTime = performance.now();
      
      return () => {
        const endTime = performance.now();
        const renderTime = endTime - startTime;
        
        if (renderTime > 16) { // 60fps threshold
          reportSlowComponent(componentName, renderTime);
        }
      };
    });
    
    return <Component {...props} />;
  });
  
  PerformanceMonitoredComponent.displayName = `withPerformanceMonitoring(${componentName})`;
  
  return PerformanceMonitoredComponent;
}
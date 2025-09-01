import { useEffect, useRef, useState, useMemo } from 'react';

interface PerformanceMetrics {
  renderCount: number;
  averageRenderTime: number;
  lastRenderTime: number;
  componentName: string;
  memoryUsage?: number;
  timestamp: number;
  // Web Vitals compatibility
  fcp?: number | null;
  lcp?: number | null;
  fid?: number | null;
  cls?: number | null;
  ttfb?: number | null;
  domContentLoaded?: number | null;
  loadComplete?: number | null;
  usedJSHeapSize?: number | null;
  totalJSHeapSize?: number | null;
  connectionType?: string | null;
  effectiveType?: string | null;
  bundleSize?: number | null;
}

interface PerformanceRecommendation {
  type: 'memo' | 'callback' | 'memo-deep' | 'virtualization' | 'lazy-loading';
  message: string;
  severity: 'low' | 'medium' | 'high';
}

// Global performance tracking
const performanceRegistry = new Map<string, PerformanceMetrics>();
const PERFORMANCE_THRESHOLD = 16; // 16ms for 60fps
const HIGH_RENDER_COUNT_THRESHOLD = 10;

export const usePerformanceMonitor = (componentName: string = 'Unknown') => {
  const renderStartTime = useRef<number>();
  const renderCount = useRef(0);
  const mountTime = useRef(Date.now());
  const [recommendations, setRecommendations] = useState<PerformanceRecommendation[]>([]);

  // Track render start
  useEffect(() => {
    renderStartTime.current = performance.now();
    renderCount.current += 1;
  });

  // Track render end and calculate metrics
  useEffect(() => {
    if (renderStartTime.current) {
      const renderTime = performance.now() - renderStartTime.current;
      
      // Update metrics
      const existingMetrics = performanceRegistry.get(componentName);
      const webVitals = measureWebVitalsData();
      const newMetrics: PerformanceMetrics = {
        renderCount: renderCount.current,
        averageRenderTime: existingMetrics 
          ? (existingMetrics.averageRenderTime + renderTime) / 2
          : renderTime,
        lastRenderTime: renderTime,
        componentName,
        timestamp: Date.now(),
        memoryUsage: (performance as any)?.memory?.usedJSHeapSize || undefined,
        // Web Vitals
        fcp: webVitals.fcp,
        lcp: webVitals.lcp,
        fid: webVitals.fid,
        cls: webVitals.cls,
        ttfb: webVitals.ttfb,
        usedJSHeapSize: (performance as any)?.memory?.usedJSHeapSize || null,
        totalJSHeapSize: (performance as any)?.memory?.totalJSHeapSize || null,
        bundleSize: null // Would need to be calculated elsewhere
      };

      performanceRegistry.set(componentName, newMetrics);

      // Generate recommendations
      generateRecommendations(newMetrics);
    }
  });

  const generateRecommendations = (metrics: PerformanceMetrics) => {
    const newRecommendations: PerformanceRecommendation[] = [];

    // High render time
    if (metrics.lastRenderTime > PERFORMANCE_THRESHOLD) {
      newRecommendations.push({
        type: 'memo',
        message: `${componentName} took ${metrics.lastRenderTime.toFixed(2)}ms to render. Consider using React.memo()`,
        severity: metrics.lastRenderTime > PERFORMANCE_THRESHOLD * 2 ? 'high' : 'medium'
      });
    }

    // Frequent re-renders
    if (metrics.renderCount > HIGH_RENDER_COUNT_THRESHOLD) {
      newRecommendations.push({
        type: 'callback',
        message: `${componentName} has re-rendered ${metrics.renderCount} times. Check useCallback/useMemo usage`,
        severity: 'medium'
      });
    }

    // High average render time
    if (metrics.averageRenderTime > PERFORMANCE_THRESHOLD * 1.5) {
      newRecommendations.push({
        type: 'memo-deep',
        message: `${componentName} average render time is ${metrics.averageRenderTime.toFixed(2)}ms. Consider deep optimization`,
        severity: 'high'
      });
    }

    setRecommendations(newRecommendations);
  };

  // Memoized performance summary
  const performanceSummary = useMemo(() => {
    const metrics = performanceRegistry.get(componentName);
    if (!metrics) return null;

    const score = Math.max(0, 100 - (metrics.averageRenderTime * 2) - (metrics.renderCount * 0.5));
    
    return {
      score: Math.round(score),
      grade: score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F',
      metrics,
      recommendations: recommendations.length > 0 ? recommendations : undefined,
      isOptimal: score >= 85 && recommendations.length === 0
    };
  }, [componentName, recommendations]);

  // Backward compatibility - provide old API alongside new API
  const metrics = performanceSummary?.metrics || null;
  const performanceScore = performanceSummary?.score || 0;
  
  const getPerformanceReport = () => {
    return {
      score: performanceScore,
      grade: performanceSummary?.grade || 'F',
      recommendations: recommendations,
      isOptimal: performanceSummary?.isOptimal || false,
      renderCount: renderCount.current,
      componentName
    };
  };

  const measureWebVitalsData = () => {
    try {
      const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        fcp: performance.getEntriesByType('paint').find(entry => entry.name === 'first-contentful-paint')?.startTime || null,
        lcp: performance.getEntriesByType('largest-contentful-paint')[0]?.startTime || null,
        cls: 0, // Would need PerformanceObserver for real CLS
        fid: 0, // Would need PerformanceObserver for real FID
        ttfb: navigationEntry?.responseStart || null
      };
    } catch (error) {
      return {
        fcp: null,
        lcp: null,
        cls: 0,
        fid: 0,
        ttfb: null
      };
    }
  };

  const measureWebVitals = () => {
    return measureWebVitalsData();
  };

  return {
    // New API
    performanceSummary,
    recommendations,
    renderCount: renderCount.current,
    // Old API for backward compatibility
    metrics,
    performanceScore,
    getPerformanceReport,
    measureWebVitals
  };
};

// Hook for global performance monitoring
export const useGlobalPerformanceStats = () => {
  const [stats, setStats] = useState<PerformanceMetrics[]>([]);

  useEffect(() => {
    const updateStats = () => {
      setStats(Array.from(performanceRegistry.values()));
    };

    const interval = setInterval(updateStats, 5000); // Update every 5 seconds
    updateStats(); // Initial update

    return () => clearInterval(interval);
  }, []);

  const overallScore = useMemo(() => {
    if (stats.length === 0) return 100;
    
    const totalScore = stats.reduce((sum, metric) => {
      const componentScore = Math.max(0, 100 - (metric.averageRenderTime * 2) - (metric.renderCount * 0.5));
      return sum + componentScore;
    }, 0);

    return Math.round(totalScore / stats.length);
  }, [stats]);

  const slowestComponents = useMemo(() => 
    stats
      .filter(metric => metric.averageRenderTime > PERFORMANCE_THRESHOLD)
      .sort((a, b) => b.averageRenderTime - a.averageRenderTime)
      .slice(0, 5),
    [stats]
  );

  const mostActiveComponents = useMemo(() =>
    stats
      .filter(metric => metric.renderCount > HIGH_RENDER_COUNT_THRESHOLD)
      .sort((a, b) => b.renderCount - a.renderCount)
      .slice(0, 5),
    [stats]
  );

  return {
    overallScore,
    totalComponents: stats.length,
    slowestComponents,
    mostActiveComponents,
    averageRenderTime: stats.length > 0 
      ? stats.reduce((sum, metric) => sum + metric.averageRenderTime, 0) / stats.length 
      : 0
  };
};

// Clear performance data (useful for testing)
export const clearPerformanceData = () => {
  performanceRegistry.clear();
};
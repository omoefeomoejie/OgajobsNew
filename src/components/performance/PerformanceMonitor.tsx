import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle, Zap, Clock, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface PerformanceMetrics {
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  fcp: number; // First Contentful Paint
  ttfb: number; // Time to First Byte
}

interface PerformanceThresholds {
  lcp: { good: number; needs: number };
  fid: { good: number; needs: number };
  cls: { good: number; needs: number };
  fcp: { good: number; needs: number };
  ttfb: { good: number; needs: number };
}

const PERFORMANCE_THRESHOLDS: PerformanceThresholds = {
  lcp: { good: 2500, needs: 4000 },
  fid: { good: 100, needs: 300 },
  cls: { good: 0.1, needs: 0.25 },
  fcp: { good: 1800, needs: 3000 },
  ttfb: { good: 800, needs: 1800 },
};

export function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [networkInfo, setNetworkInfo] = useState<any>(null);
  const [memoryInfo, setMemoryInfo] = useState<any>(null);

  useEffect(() => {
    collectPerformanceMetrics();
    collectNetworkInfo();
    collectMemoryInfo();

    // Subscribe to real-time performance updates
    const channel = supabase
      .channel('performance-monitoring')
      .on('broadcast', { event: 'performance-update' }, (payload) => {
        // Performance update received
        collectPerformanceMetrics();
      })
      .subscribe();

    // Initial collection and periodic backup (reduced frequency)
    const interval = setInterval(collectPerformanceMetrics, 30000); // Every 30 seconds as backup

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  const collectPerformanceMetrics = () => {
    if ('performance' in window) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paint = performance.getEntriesByType('paint');
      
      const fcp = paint.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0;
      const lcp = getLargestContentfulPaint();
      
      setMetrics({
        lcp: lcp,
        fid: getFirstInputDelay(),
        cls: getCumulativeLayoutShift(),
        fcp: fcp,
        ttfb: navigation?.responseStart - navigation?.requestStart || 0,
      });
    }
  };

  const collectNetworkInfo = () => {
    if ('navigator' in window && 'connection' in navigator) {
      const connection = (navigator as any).connection;
      setNetworkInfo({
        effectiveType: connection?.effectiveType || 'unknown',
        downlink: connection?.downlink || 0,
        rtt: connection?.rtt || 0,
      });
    }
  };

  const collectMemoryInfo = () => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      setMemoryInfo({
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
      });
    }
  };

  const getLargestContentfulPaint = (): number => {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        return lastEntry?.startTime || 0;
      });
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch {
      return 0;
    }
    return 0;
  };

  const getFirstInputDelay = (): number => {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const entry = entries[0] as any;
        return entry?.processingStart - entry?.startTime || 0;
      });
      observer.observe({ entryTypes: ['first-input'] });
    } catch {
      return 0;
    }
    return 0;
  };

  const getCumulativeLayoutShift = (): number => {
    try {
      let clsValue = 0;
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }
      });
      observer.observe({ entryTypes: ['layout-shift'] });
      return clsValue;
    } catch {
      return 0;
    }
  };

  const getMetricStatus = (value: number, metric: keyof PerformanceThresholds): 'good' | 'needs' | 'poor' => {
    const thresholds = PERFORMANCE_THRESHOLDS[metric];
    if (value <= thresholds.good) return 'good';
    if (value <= thresholds.needs) return 'needs';
    return 'poor';
  };

  const getMetricColor = (status: 'good' | 'needs' | 'poor') => {
    switch (status) {
      case 'good': return 'bg-green-500';
      case 'needs': return 'bg-yellow-500';
      case 'poor': return 'bg-red-500';
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!metrics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Performance Monitor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Collecting performance metrics...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Core Web Vitals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Core Web Vitals
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* LCP */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Largest Contentful Paint (LCP)</span>
              <Badge variant={getMetricStatus(metrics.lcp, 'lcp') === 'good' ? 'default' : 'destructive'}>
                {Math.round(metrics.lcp)}ms
              </Badge>
            </div>
            <Progress 
              value={Math.min((metrics.lcp / PERFORMANCE_THRESHOLDS.lcp.needs) * 100, 100)} 
              className="h-2"
            />
          </div>

          {/* FID */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">First Input Delay (FID)</span>
              <Badge variant={getMetricStatus(metrics.fid, 'fid') === 'good' ? 'default' : 'destructive'}>
                {Math.round(metrics.fid)}ms
              </Badge>
            </div>
            <Progress 
              value={Math.min((metrics.fid / PERFORMANCE_THRESHOLDS.fid.needs) * 100, 100)} 
              className="h-2"
            />
          </div>

          {/* CLS */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Cumulative Layout Shift (CLS)</span>
              <Badge variant={getMetricStatus(metrics.cls, 'cls') === 'good' ? 'default' : 'destructive'}>
                {metrics.cls.toFixed(3)}
              </Badge>
            </div>
            <Progress 
              value={Math.min((metrics.cls / PERFORMANCE_THRESHOLDS.cls.needs) * 100, 100)} 
              className="h-2"
            />
          </div>
        </CardContent>
      </Card>

      {/* Network Info */}
      {networkInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Network Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Connection</div>
                <div className="font-medium">{networkInfo.effectiveType?.toUpperCase() || 'Unknown'}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Downlink</div>
                <div className="font-medium">{networkInfo.downlink} Mbps</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">RTT</div>
                <div className="font-medium">{networkInfo.rtt}ms</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Memory Info */}
      {memoryInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Memory Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">JS Heap Usage</span>
                  <span className="text-sm">
                    {formatBytes(memoryInfo.usedJSHeapSize)} / {formatBytes(memoryInfo.totalJSHeapSize)}
                  </span>
                </div>
                <Progress 
                  value={(memoryInfo.usedJSHeapSize / memoryInfo.totalJSHeapSize) * 100} 
                  className="h-2"
                />
              </div>
              
              <div className="text-xs text-muted-foreground">
                Limit: {formatBytes(memoryInfo.jsHeapSizeLimit)}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {metrics.lcp > PERFORMANCE_THRESHOLDS.lcp.good && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  LCP is slower than recommended. Consider optimizing largest image or text block.
                </AlertDescription>
              </Alert>
            )}
            
            {metrics.fid > PERFORMANCE_THRESHOLDS.fid.good && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  FID is higher than recommended. Consider reducing JavaScript execution time.
                </AlertDescription>
              </Alert>
            )}
            
            {metrics.cls > PERFORMANCE_THRESHOLDS.cls.good && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  CLS is higher than recommended. Ensure size attributes on images and avoid dynamic content insertion.
                </AlertDescription>
              </Alert>
            )}
            
            {metrics.lcp <= PERFORMANCE_THRESHOLDS.lcp.good && 
             metrics.fid <= PERFORMANCE_THRESHOLDS.fid.good && 
             metrics.cls <= PERFORMANCE_THRESHOLDS.cls.good && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  All Core Web Vitals are performing well! 🎉
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
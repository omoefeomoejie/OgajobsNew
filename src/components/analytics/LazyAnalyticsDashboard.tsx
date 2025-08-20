import React, { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { withPerformanceMonitoring } from '@/components/performance/PerformanceProvider';
import { ErrorBoundary } from 'react-error-boundary';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

// Lazy load the heavy analytics dashboard
const AnalyticsDashboard = React.lazy(() => 
  import('./AnalyticsDashboard').then(module => ({ 
    default: module.AnalyticsDashboard 
  }))
);

// Memoized chart components to prevent unnecessary re-renders
const MemoizedChart = React.memo(function MemoizedChart({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return <>{children}</>;
});

// Loading fallback for analytics dashboard
function AnalyticsLoadingFallback() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>

      {/* Real-time metrics skeleton */}
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-4 rounded" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Overview cards skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4 rounded" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20 mb-2" />
              <Skeleton className="h-4 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts skeleton */}
      <div className="grid gap-6 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-80 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Error fallback for analytics dashboard
function AnalyticsErrorFallback({ error, resetErrorBoundary }: { 
  error: Error; 
  resetErrorBoundary: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
      <h2 className="text-2xl font-semibold mb-2">Analytics Dashboard Error</h2>
      <p className="text-muted-foreground mb-4 max-w-md">
        Failed to load the analytics dashboard. This might be due to a network issue or server problem.
      </p>
      <p className="text-sm text-muted-foreground mb-4">
        Error: {error.message}
      </p>
      <button 
        onClick={resetErrorBoundary}
        className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
      >
        Try Again
      </button>
    </div>
  );
}

// Performance-optimized lazy analytics dashboard
const OptimizedAnalyticsDashboard = withPerformanceMonitoring(
  function OptimizedAnalyticsDashboard() {
    return (
      <ErrorBoundary 
        FallbackComponent={AnalyticsErrorFallback}
        onReset={() => window.location.reload()}
      >
        <Suspense fallback={<AnalyticsLoadingFallback />}>
          <MemoizedChart>
            <AnalyticsDashboard />
          </MemoizedChart>
        </Suspense>
      </ErrorBoundary>
    );
  },
  'AnalyticsDashboard'
);

export default OptimizedAnalyticsDashboard;

// Export preload function for route-based preloading
export const preloadAnalyticsDashboard = () => {
  // Preload the analytics dashboard component
  import('./AnalyticsDashboard');
  
  // Preload critical chart dependencies
  import('recharts');
  
  return Promise.resolve();
};
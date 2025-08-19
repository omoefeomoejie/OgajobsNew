import React, { Suspense, lazy, ComponentType } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { ComponentErrorBoundary } from '@/components/error/ComponentErrorBoundary';
import { Loader2 } from 'lucide-react';

interface LazyLoadWrapperProps {
  fallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
  componentName?: string;
}

// Loading fallback component
export function DefaultLoadingFallback({ componentName }: { componentName?: string }) {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          Loading {componentName || 'component'}...
        </span>
      </div>
    </div>
  );
}

// Skeleton fallback for different component types
export function SkeletonFallback({ type = 'default' }: { type?: 'card' | 'list' | 'table' | 'default' }) {
  switch (type) {
    case 'card':
      return (
        <div className="border rounded-lg p-4 space-y-3">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <div className="space-y-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      );
    
    case 'list':
      return (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      );
    
    case 'table':
      return (
        <div className="space-y-3">
          <Skeleton className="h-8 w-full" />
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-6 w-full" />
          ))}
        </div>
      );
    
    default:
      return <Skeleton className="h-32 w-full" />;
  }
}

// Higher-order component for lazy loading
export function withLazyLoading<P extends object>(
  importFunc: () => Promise<{ default: ComponentType<P> }>,
  options?: LazyLoadWrapperProps & { skeletonType?: 'card' | 'list' | 'table' | 'default' }
) {
  const LazyComponent = lazy(importFunc);
  
  return function LazyLoadedComponent(props: P) {
    const fallback = options?.fallback || (
      options?.skeletonType ? 
        <SkeletonFallback type={options.skeletonType} /> : 
        <DefaultLoadingFallback componentName={options?.componentName} />
    );

    return (
      <ComponentErrorBoundary
        componentName={options?.componentName}
        fallback={options?.errorFallback}
      >
        <Suspense fallback={fallback}>
          <LazyComponent {...(props as any)} />
        </Suspense>
      </ComponentErrorBoundary>
    );
  };
}

// Hook for dynamic imports with error handling
export function useDynamicImport<T>(importFunc: () => Promise<T>) {
  const [state, setState] = React.useState<{
    loading: boolean;
    data: T | null;
    error: Error | null;
  }>({
    loading: true,
    data: null,
    error: null,
  });

  React.useEffect(() => {
    let mounted = true;
    
    importFunc()
      .then((data) => {
        if (mounted) {
          setState({ loading: false, data, error: null });
        }
      })
      .catch((error) => {
        if (mounted) {
          setState({ loading: false, data: null, error });
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const retry = React.useCallback(() => {
    setState({ loading: true, data: null, error: null });
  }, []);

  return { ...state, retry };
}

// Preload utility
export function preloadComponent(importFunc: () => Promise<any>) {
  // Start loading the component
  const componentImport = importFunc();
  
  // Return a function to get the preloaded component
  return () => componentImport;
}
import { memo, useMemo, Suspense } from 'react';
import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cacheConfig } from '@/lib/queryClient';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';

interface OptimizedQueryWrapperProps<TData = unknown, TError = Error> {
  queryKey: any[];
  queryFn: () => Promise<TData>;
  cacheType?: keyof typeof cacheConfig;
  children: (data: TData) => React.ReactNode;
  fallback?: React.ReactNode;
  errorFallback?: (error: TError) => React.ReactNode;
  enablePerformanceMonitoring?: boolean;
  componentName?: string;
}

export const OptimizedQueryWrapper = memo(<TData, TError = Error>({
  queryKey,
  queryFn,
  cacheType = 'dynamic',
  children,
  fallback = <LoadingSpinner />,
  errorFallback,
  enablePerformanceMonitoring = true,
  componentName = 'OptimizedQuery'
}: OptimizedQueryWrapperProps<TData, TError>) => {
  const { performanceSummary } = usePerformanceMonitor(componentName);

  // Memoize query options to prevent unnecessary re-renders
  const queryOptions = useMemo((): UseQueryOptions<TData, TError> => ({
    queryKey,
    queryFn,
    ...cacheConfig[cacheType],
    // Add performance monitoring
    meta: {
      componentName,
      performanceScore: performanceSummary?.score || 0,
    },
  }), [queryKey, queryFn, cacheType, componentName, performanceSummary?.score]);

  const { data, isLoading, error, isError } = useQuery(queryOptions);

  // Error boundary
  if (isError && error) {
    if (errorFallback) {
      return <>{errorFallback(error)}</>;
    }
    
    return (
      <Alert variant="destructive" className="m-4">
        <AlertDescription>
          Failed to load data: {error instanceof Error ? error.message : 'Unknown error'}
        </AlertDescription>
      </Alert>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <Suspense fallback={fallback}>
        {fallback}
      </Suspense>
    );
  }

  // Success state - data is guaranteed to be available here
  if (data) {
    return <>{children(data)}</>;
  }

  // Fallback for edge cases
  return <>{fallback}</>;
}) as <TData, TError = Error>(props: OptimizedQueryWrapperProps<TData, TError>) => JSX.Element;

(OptimizedQueryWrapper as any).displayName = 'OptimizedQueryWrapper';

// HOC version for easier integration with existing components
export function withOptimizedQuery<TProps extends object, TData>(
  Component: React.ComponentType<TProps & { data: TData }>,
  queryKey: any[],
  queryFn: () => Promise<TData>,
  options?: {
    cacheType?: keyof typeof cacheConfig;
    componentName?: string;
  }
) {
  const WrappedComponent = memo((props: TProps) => (
    <OptimizedQueryWrapper
      queryKey={queryKey}
      queryFn={queryFn}
      cacheType={options?.cacheType}
      componentName={options?.componentName || Component.displayName || Component.name}
    >
      {(data) => <Component {...props} data={data} />}
    </OptimizedQueryWrapper>
  ));

  WrappedComponent.displayName = `withOptimizedQuery(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

export default OptimizedQueryWrapper;
import React, { memo, Suspense, lazy, useCallback, useMemo } from 'react';
import { ErrorBoundary, FallbackProps } from 'react-error-boundary';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PerformanceOptimizedComponentProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  errorFallback?: React.ComponentType<FallbackProps>;
  enableVirtualization?: boolean;
  chunkSize?: number;
}

// Performance optimization wrapper component
export const PerformanceOptimizedComponent = memo<PerformanceOptimizedComponentProps>(({
  children,
  fallback = <LoadingSpinner />,
  errorFallback,
  enableVirtualization = false,
  chunkSize = 10
}) => {
  const { measureWebVitals, getPerformanceReport } = usePerformanceMonitor();

  const handleError = useCallback((error: Error, errorInfo: any) => {
    console.error('Performance Optimized Component Error:', error, errorInfo);
    // Log to performance monitoring
    measureWebVitals();
  }, [measureWebVitals]);

  const DefaultErrorFallback = useCallback(({ error }: FallbackProps) => (
    <Alert variant="destructive" className="m-4">
      <AlertDescription>
        Something went wrong: {error.message}
      </AlertDescription>
    </Alert>
  ), []);

  return (
    <ErrorBoundary
      onError={handleError}
      FallbackComponent={errorFallback || DefaultErrorFallback}
    >
      <Suspense fallback={fallback}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
});

PerformanceOptimizedComponent.displayName = 'PerformanceOptimizedComponent';

// Lazy loading utility  
export const createLazyComponent = (
  importFunc: () => Promise<{ default: React.ComponentType<any> }>,
  fallback?: React.ReactNode
) => {
  const LazyComponent = lazy(importFunc);
  
  return memo((props: any) => (
    <PerformanceOptimizedComponent fallback={fallback}>
      <LazyComponent {...props} />
    </PerformanceOptimizedComponent>
  ));
};

// Virtual scrolling component for large lists
interface VirtualizedListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}

export const VirtualizedList = memo(<T,>({
  items,
  renderItem,
  itemHeight,
  containerHeight,
  overscan = 5
}: VirtualizedListProps<T>) => {
  const [scrollTop, setScrollTop] = React.useState(0);

  const visibleItems = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      items.length,
      startIndex + Math.ceil(containerHeight / itemHeight) + overscan
    );
    
    return {
      startIndex: Math.max(0, startIndex - overscan),
      endIndex,
      items: items.slice(
        Math.max(0, startIndex - overscan),
        endIndex
      )
    };
  }, [scrollTop, itemHeight, containerHeight, items, overscan]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return (
    <div
      style={{ height: containerHeight, overflow: 'auto' }}
      onScroll={handleScroll}
    >
      <div style={{ height: items.length * itemHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${visibleItems.startIndex * itemHeight}px)`,
            position: 'absolute',
            width: '100%'
          }}
        >
          {visibleItems.items.map((item, index) =>
            renderItem(item, visibleItems.startIndex + index)
          )}
        </div>
      </div>
    </div>
  );
});

VirtualizedList.displayName = 'VirtualizedList';

// Performance monitoring hook for components
export const useComponentPerformance = (componentName: string) => {
  const { measureWebVitals } = usePerformanceMonitor();
  
  React.useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Log component render time if it's slow
      if (renderTime > 16) { // More than one frame at 60fps
        console.warn(`Slow render detected in ${componentName}: ${renderTime}ms`);
        measureWebVitals();
      }
    };
  }, [componentName, measureWebVitals]);
};

// Image optimization component
interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  lazy?: boolean;
  placeholder?: string;
}

export const OptimizedImage = memo<OptimizedImageProps>(({
  src,
  alt,
  width,
  height,
  lazy = true,
  placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkxvYWRpbmcuLi48L3RleHQ+Cjwvc3ZnPg==',
  ...props
}) => {
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [error, setError] = React.useState(false);
  
  const handleLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);
  
  const handleError = useCallback(() => {
    setError(true);
  }, []);
  
  if (error) {
    return (
      <div
        className="flex items-center justify-center bg-muted text-muted-foreground"
        style={{ width, height }}
      >
        Failed to load image
      </div>
    );
  }
  
  return (
    <div className="relative">
      {!isLoaded && (
        <img
          src={placeholder}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={{ width, height }}
        />
      )}
      <img
        {...props}
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={lazy ? 'lazy' : 'eager'}
        onLoad={handleLoad}
        onError={handleError}
        className={`transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        } ${props.className || ''}`}
      />
    </div>
  );
});

OptimizedImage.displayName = 'OptimizedImage';

export default PerformanceOptimizedComponent;
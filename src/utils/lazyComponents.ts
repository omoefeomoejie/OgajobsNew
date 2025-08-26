import { lazy } from 'react';
import React from 'react';

// Utility to create lazy components with better error handling
export const createLazyComponent = <T extends Record<string, any>>(
  importFn: () => Promise<{ default: React.ComponentType<T> }>,
  componentName?: string
) => {
  const LazyComponent = lazy(async () => {
    try {
      const module = await importFn();
      return module;
    } catch (error) {
      console.error(`Failed to load component${componentName ? ` ${componentName}` : ''}:`, error);
      // Return a fallback component
      return {
        default: () => React.createElement(
          'div',
          { className: 'flex items-center justify-center p-8 text-center' },
          React.createElement(
            'div',
            { className: 'max-w-md' },
            React.createElement('h3', { 
              className: 'text-lg font-semibold text-destructive mb-2' 
            }, 'Failed to Load Component'),
            React.createElement('p', { 
              className: 'text-sm text-muted-foreground mb-4' 
            }, 'There was an error loading this component. Please refresh the page to try again.'),
            React.createElement('button', {
              onClick: () => window.location.reload(),
              className: 'px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors'
            }, 'Refresh Page')
          )
        )
      };
    }
  });

  return LazyComponent;
};

// Preload function for critical routes
export const preloadComponent = (importFn: () => Promise<any>) => {
  // Use a timeout to avoid blocking the main thread
  setTimeout(() => {
    importFn().catch(() => {
      // Silently fail preloading, component will still work when needed
    });
  }, 100);
};

// Route-based lazy components with preloading
export const LazyDashboard = createLazyComponent(
  () => import('@/pages/Dashboard'),
  'Dashboard'
);

export const LazyServices = createLazyComponent(
  () => import('@/pages/Services'),
  'Services'
);

export const LazyProfile = createLazyComponent(
  () => import('@/pages/Profile'),
  'Profile'
);

// Preload critical components
export const preloadCriticalComponents = () => {
  preloadComponent(() => import('@/pages/Dashboard'));
  preloadComponent(() => import('@/pages/Services'));
};
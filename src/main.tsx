import React from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import App from './App.tsx'
import './index.css'
import './i18n/config'
import { queryClient, cacheUtils } from '@/lib/queryClient'
import { PerformanceProvider } from '@/components/performance/PerformanceProvider'

// Prefetch critical data immediately
cacheUtils.prefetchCriticalData();

// Enable performance monitoring in development
const enablePerformanceMonitoring = process.env.NODE_ENV === 'development';

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <PerformanceProvider enableMonitoring={enablePerformanceMonitoring}>
        <App />
        {/* React Query DevTools - only in development */}
        {process.env.NODE_ENV === 'development' && (
          <ReactQueryDevtools initialIsOpen={false} />
        )}
      </PerformanceProvider>
    </QueryClientProvider>
  </React.StrictMode>
);

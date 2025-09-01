import React from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { FeedbackContainer } from '@/components/feedback/UserFeedback';
import { NetworkErrorBoundary } from '@/components/feedback/OfflineIndicator';
import App from './App.tsx'
import './index.css'
import './i18n/config'
import { queryClient, cacheUtils } from '@/lib/queryClient'
import { PerformanceProvider } from '@/components/performance/PerformanceProvider'
import { reportBundleSize, addResourceHints, registerServiceWorker } from "@/utils/performanceOptimization"
import { logBundleAnalysis } from "@/utils/bundleAnalyzer"

// Initialize performance optimizations
addResourceHints();
registerServiceWorker();

// Prefetch critical data immediately
cacheUtils.prefetchCriticalData();

// Enable performance monitoring for production insights
const enablePerformanceMonitoring = true;

// Report bundle metrics in development
if (import.meta.env.DEV) {
  window.addEventListener('load', () => {
    setTimeout(() => {
      reportBundleSize();
      logBundleAnalysis();
    }, 1000);
  });
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <PerformanceProvider enableMonitoring={enablePerformanceMonitoring}>
        <NetworkErrorBoundary>
          <App />
          <FeedbackContainer />
          {/* React Query DevTools - disabled by default */}
          {false && import.meta.env.DEV && (
            <ReactQueryDevtools 
              initialIsOpen={false} 
              buttonPosition="bottom-left"
              position="bottom"
            />
          )}
        </NetworkErrorBoundary>
      </PerformanceProvider>
    </QueryClientProvider>
  </React.StrictMode>
);

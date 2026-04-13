import React from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { FeedbackContainer } from '@/components/feedback/UserFeedback';
import { NetworkErrorBoundary } from '@/components/feedback/OfflineIndicator';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from 'next-themes';
import { AuthProvider } from '@/contexts/AuthContext';
import { NavigationProvider } from '@/contexts/NavigationContext';
import { AuthNavigationHandler } from '@/components/auth/AuthNavigationHandler';
import App from './App.tsx'
import './index.css'
import './i18n/config'
import { queryClient, cacheUtils } from '@/lib/queryClient'
import { PerformanceProvider } from '@/components/performance/PerformanceProvider'
import { reportBundleSize, addResourceHints, registerServiceWorker } from "@/utils/performanceOptimization"
import { logBundleAnalysis } from "@/utils/bundleAnalyzer"

window.addEventListener('unhandledrejection', (event) => {
  if (event.reason?.message?.includes('Failed to fetch dynamically imported module')) {
    const reloadKey = 'chunk_reload_attempted';
    if (!sessionStorage.getItem(reloadKey)) {
      sessionStorage.setItem(reloadKey, '1');
      window.location.reload();
    }
  }
});

// Initialize performance optimizations
addResourceHints();
registerServiceWorker();

// Prefetch critical data immediately
cacheUtils.prefetchCriticalData();

// Enable performance monitoring for production insights (enabled for production)
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
      <BrowserRouter>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <PerformanceProvider enableMonitoring={enablePerformanceMonitoring}>
            <NavigationProvider>
              <AuthProvider>
                <AuthNavigationHandler />
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
              </AuthProvider>
            </NavigationProvider>
          </PerformanceProvider>
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);

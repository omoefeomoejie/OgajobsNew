import React, { Suspense, lazy } from 'react';
import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

// Lazy-loaded components for better performance
export const LazyAnalyticsDashboard = lazy(() => import('@/components/analytics/AnalyticsDashboard'));
export const LazyAIRecommendationEngine = lazy(() => import('@/components/analytics/AIRecommendationEngine'));
export const LazyAdvancedReportBuilder = lazy(() => import('@/components/analytics/AdvancedReportBuilder'));
export const LazyPaymentOverview = lazy(() => import('@/components/dashboard/PaymentOverview'));
export const LazyEscrowManager = lazy(() => import('@/components/payment/EscrowManager'));
export const LazyPortfolioManager = lazy(() => import('@/components/portfolio/PortfolioManager'));
export const LazyWorkGallery = lazy(() => import('@/components/portfolio/WorkGallery'));
export const LazyLiveChatWidget = lazy(() => import('@/components/chat/LiveChatWidget'));

// Loading fallback components
const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <Loader2 className="h-6 w-6 animate-spin text-primary" />
  </div>
);

const CardSkeleton = () => (
  <Card>
    <CardContent className="p-6">
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-muted rounded w-3/4"></div>
        <div className="h-4 bg-muted rounded w-1/2"></div>
        <div className="h-4 bg-muted rounded w-5/6"></div>
      </div>
    </CardContent>
  </Card>
);

const DashboardSkeleton = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  </div>
);

const ListSkeleton = () => (
  <div className="space-y-4">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="animate-pulse flex space-x-4 p-4">
        <div className="rounded-full bg-muted h-10 w-10"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-muted rounded w-3/4"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </div>
      </div>
    ))}
  </div>
);

// Higher-order component for lazy loading with custom fallbacks
export function withSuspense<T extends object>(
  Component: React.ComponentType<T>,
  fallback?: React.ComponentType
) {
  const FallbackComponent = fallback || LoadingSpinner;
  
  return function SuspenseWrapper(props: T) {
    return (
      <Suspense fallback={<FallbackComponent />}>
        <Component {...props} />
      </Suspense>
    );
  };
}

// Preload components on user interaction
export const preloadComponent = (componentImport: () => Promise<any>) => {
  componentImport().catch(console.error);
};

// Preload critical components on idle
export const preloadCriticalComponents = () => {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      preloadComponent(() => import('@/components/analytics/AnalyticsDashboard'));
      preloadComponent(() => import('@/components/dashboard/PaymentOverview'));
      preloadComponent(() => import('@/components/chat/LiveChatWidget'));
    });
  } else {
    setTimeout(() => {
      preloadComponent(() => import('@/components/analytics/AnalyticsDashboard'));
      preloadComponent(() => import('@/components/dashboard/PaymentOverview'));
      preloadComponent(() => import('@/components/chat/LiveChatWidget'));
    }, 2000);
  }
};

// Component exports with Suspense wrappers
export const AnalyticsDashboard = withSuspense(LazyAnalyticsDashboard, DashboardSkeleton);
export const AIRecommendationEngine = withSuspense(LazyAIRecommendationEngine, CardSkeleton);
export const AdvancedReportBuilder = withSuspense(LazyAdvancedReportBuilder, DashboardSkeleton);
export const PaymentOverview = withSuspense(LazyPaymentOverview, DashboardSkeleton);
export const EscrowManager = withSuspense(LazyEscrowManager, ListSkeleton);
export const PortfolioManager = withSuspense(LazyPortfolioManager, DashboardSkeleton);
export const WorkGallery = withSuspense(LazyWorkGallery, ListSkeleton);
export const LiveChatWidget = withSuspense(LazyLiveChatWidget, LoadingSpinner);

// Route-based preloading
export const preloadForRoute = (route: string) => {
  switch (route) {
    case '/dashboard':
      preloadComponent(() => import('@/components/analytics/AnalyticsDashboard'));
      preloadComponent(() => import('@/components/dashboard/PaymentOverview'));
      break;
    case '/analytics':
      preloadComponent(() => import('@/components/analytics/AIRecommendationEngine'));
      preloadComponent(() => import('@/components/analytics/AdvancedReportBuilder'));
      break;
    case '/portfolio':
      preloadComponent(() => import('@/components/portfolio/PortfolioManager'));
      preloadComponent(() => import('@/components/portfolio/WorkGallery'));
      break;
    case '/payments':
      preloadComponent(() => import('@/components/payment/EscrowManager'));
      preloadComponent(() => import('@/components/dashboard/PaymentOverview'));
      break;
  }
};
import React, { lazy, Suspense } from 'react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

// Simple loading components
const PageLoadingFallback = () => (
  React.createElement('div', 
    { className: 'min-h-screen bg-background flex items-center justify-center' },
    React.createElement('div', 
      { className: 'flex flex-col items-center gap-4' },
      React.createElement(LoadingSpinner, { className: 'h-8 w-8' }),
      React.createElement('p', 
        { className: 'text-sm text-muted-foreground' },
        'Loading page...'
      )
    )
  )
);

const DashboardLoadingFallback = () => (
  React.createElement('div', 
    { className: 'min-h-screen bg-background flex items-center justify-center' },
    React.createElement('div', 
      { className: 'flex flex-col items-center gap-4' },
      React.createElement(LoadingSpinner, { className: 'h-8 w-8' }),
      React.createElement('p', 
        { className: 'text-sm text-muted-foreground' },
        'Loading dashboard...'
      )
    )
  )
);

const FormLoadingFallback = () => (
  React.createElement('div', 
    { className: 'min-h-screen bg-background flex items-center justify-center' },
    React.createElement('div', 
      { className: 'flex flex-col items-center gap-4' },
      React.createElement(LoadingSpinner, { className: 'h-8 w-8' }),
      React.createElement('p', 
        { className: 'text-sm text-muted-foreground' },
        'Loading form...'
      )
    )
  )
);

// Create lazy components
export const LazyIndex = lazy(() => import('@/pages/Index'));
export const LazyAuth = lazy(() => import('@/pages/Auth'));
export const LazyDashboard = lazy(() => import('@/pages/Dashboard'));
export const LazyAdminLogin = lazy(() => import('@/pages/AdminLogin'));
export const LazyAdminDashboard = lazy(() => import('@/pages/AdminDashboard'));
export const LazyAdminControlPanel = lazy(() => import('@/pages/AdminControlPanel'));
export const LazyServices = lazy(() => import('@/pages/Services'));
export const LazyBookingRequest = lazy(() => import('@/pages/BookingRequest'));
export const LazyMyBookings = lazy(() => import('@/pages/MyBookings'));
export const LazyMessages = lazy(() => import('@/pages/Messages'));
export const LazyReviews = lazy(() => import('@/pages/Reviews'));
export const LazyVerification = lazy(() => import('@/pages/Verification'));
export const LazyAgentRegistration = lazy(() => import('@/pages/AgentRegistration'));
export const LazyAgentDashboard = lazy(() => import('@/pages/AgentDashboard'));
export const LazyPortfolio = lazy(() => import('@/pages/Portfolio'));
export const LazyPortfolioView = lazy(() => import('@/pages/PortfolioView'));
export const LazyDisputes = lazy(() => import('@/pages/Disputes'));
export const LazySettings = lazy(() => import('@/pages/Settings'));
export const LazyProfile = lazy(() => import('@/pages/Profile'));
export const LazyAgentChatDashboard = lazy(() => import('@/pages/AgentChatDashboard'));
export const LazyHowItWorks = lazy(() => import('@/pages/HowItWorks'));
export const LazyAdminUsers = lazy(() => import('@/pages/AdminUsers'));
export const LazyFinancialReports = lazy(() => import('@/pages/FinancialReports'));
export const LazyFavorites = lazy(() => import('@/pages/Favorites'));
export const LazyBecomeArtisan = lazy(() => import('@/pages/BecomeArtisan'));
export const LazyHelpCenter = lazy(() => import('@/pages/HelpCenter'));
export const LazySafetyGuidelines = lazy(() => import('@/pages/SafetyGuidelines'));
export const LazyPOSPartnership = lazy(() => import('@/pages/POSPartnership'));
export const LazyCompetitiveAdvantages = lazy(() => import('@/pages/CompetitiveAdvantages'));
export const LazyCalendar = lazy(() => import('@/pages/Calendar'));
export const LazyMonitoringDashboard = lazy(() => import('@/pages/MonitoringDashboard'));

// Static pages (no lazy loading needed as they're simple)
export { default as PrivacyPolicy } from '@/pages/PrivacyPolicy';
export { default as TermsOfService } from '@/pages/TermsOfService';
export { default as CookiePolicy } from '@/pages/CookiePolicy';
export { default as PaymentSuccess } from '@/pages/PaymentSuccess';
export { default as NotFound } from '@/pages/NotFound';

// Helper to create wrapper components using built-in Suspense
const createLazyWrapper = (LazyComponent: React.LazyExoticComponent<React.ComponentType<any>>, fallback: React.ReactNode) => {
  return () => React.createElement(Suspense, 
    { fallback },
    React.createElement(LazyComponent)
  );
};

// Wrapper components with appropriate fallbacks
export const LazyIndexWrapper = createLazyWrapper(LazyIndex, React.createElement(PageLoadingFallback));
export const LazyAuthWrapper = createLazyWrapper(LazyAuth, React.createElement(FormLoadingFallback));
export const LazyDashboardWrapper = createLazyWrapper(LazyDashboard, React.createElement(DashboardLoadingFallback));
export const LazyAdminDashboardWrapper = createLazyWrapper(LazyAdminDashboard, React.createElement(DashboardLoadingFallback));
export const LazyAdminControlPanelWrapper = createLazyWrapper(LazyAdminControlPanel, React.createElement(DashboardLoadingFallback));
export const LazyServicesWrapper = createLazyWrapper(LazyServices, React.createElement(PageLoadingFallback));
export const LazyBookingRequestWrapper = createLazyWrapper(LazyBookingRequest, React.createElement(FormLoadingFallback));
export const LazyMyBookingsWrapper = createLazyWrapper(LazyMyBookings, React.createElement(PageLoadingFallback));
export const LazyMessagesWrapper = createLazyWrapper(LazyMessages, React.createElement(PageLoadingFallback));
export const LazyReviewsWrapper = createLazyWrapper(LazyReviews, React.createElement(PageLoadingFallback));
export const LazyVerificationWrapper = createLazyWrapper(LazyVerification, React.createElement(FormLoadingFallback));
export const LazyAgentRegistrationWrapper = createLazyWrapper(LazyAgentRegistration, React.createElement(FormLoadingFallback));
export const LazyAgentDashboardWrapper = createLazyWrapper(LazyAgentDashboard, React.createElement(DashboardLoadingFallback));
export const LazyPortfolioWrapper = createLazyWrapper(LazyPortfolio, React.createElement(PageLoadingFallback));
export const LazyPortfolioViewWrapper = createLazyWrapper(LazyPortfolioView, React.createElement(PageLoadingFallback));
export const LazyDisputesWrapper = createLazyWrapper(LazyDisputes, React.createElement(PageLoadingFallback));
export const LazySettingsWrapper = createLazyWrapper(LazySettings, React.createElement(PageLoadingFallback));
export const LazyProfileWrapper = createLazyWrapper(LazyProfile, React.createElement(PageLoadingFallback));
export const LazyAgentChatDashboardWrapper = createLazyWrapper(LazyAgentChatDashboard, React.createElement(DashboardLoadingFallback));
export const LazyHowItWorksWrapper = createLazyWrapper(LazyHowItWorks, React.createElement(PageLoadingFallback));
export const LazyAdminUsersWrapper = createLazyWrapper(LazyAdminUsers, React.createElement(DashboardLoadingFallback));
export const LazyFinancialReportsWrapper = createLazyWrapper(LazyFinancialReports, React.createElement(DashboardLoadingFallback));
export const LazyFavoritesWrapper = createLazyWrapper(LazyFavorites, React.createElement(PageLoadingFallback));
export const LazyBecomeArtisanWrapper = createLazyWrapper(LazyBecomeArtisan, React.createElement(PageLoadingFallback));
export const LazyHelpCenterWrapper = createLazyWrapper(LazyHelpCenter, React.createElement(PageLoadingFallback));
export const LazySafetyGuidelinesWrapper = createLazyWrapper(LazySafetyGuidelines, React.createElement(PageLoadingFallback));
export const LazyPOSPartnershipWrapper = createLazyWrapper(LazyPOSPartnership, React.createElement(PageLoadingFallback));
export const LazyCompetitiveAdvantagesWrapper = createLazyWrapper(LazyCompetitiveAdvantages, React.createElement(PageLoadingFallback));
export const LazyCalendarWrapper = createLazyWrapper(LazyCalendar, React.createElement(PageLoadingFallback));
export const LazyMonitoringDashboardWrapper = createLazyWrapper(LazyMonitoringDashboard, React.createElement(DashboardLoadingFallback));
export const LazyAdminLoginWrapper = createLazyWrapper(LazyAdminLogin, React.createElement(FormLoadingFallback));
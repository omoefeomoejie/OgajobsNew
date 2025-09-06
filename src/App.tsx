import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import { SecureErrorBoundary } from "@/components/error/SecureErrorBoundary";
import { GlobalErrorHandler } from "@/components/error/GlobalErrorHandler";
import { SessionRecoveryManager } from "@/components/auth/SessionRecoveryManager";
import { InstallPrompt } from "@/components/mobile/InstallPrompt";
import { MobileBottomNav } from "@/components/mobile/MobileBottomNav";
import { LegacyRedirect } from "@/components/routing/LegacyRedirect";
import { ROUTES } from "@/config/routes";
import { useWelcomeEmailQueue } from "@/hooks/useWelcomeEmailQueue";
import {
  LazyIndexWrapper as Index,
  LazyAuthWrapper as Auth, 
  LazyAuthConfirmWrapper as AuthConfirm,
  LazyDashboardWrapper as Dashboard,
  LazyAdminLoginWrapper as AdminLogin,
  LazyAdminDashboardWrapper as AdminDashboard,
  LazyAdminControlPanelWrapper as AdminControlPanel,
  PrivacyPolicy,
  TermsOfService,
  CookiePolicy,
  LazyServicesWrapper as Services,
  LazyBookingRequestWrapper as BookingRequest,
  LazyMyBookingsWrapper as MyBookings,
  LazyMessagesWrapper as Messages,
  LazyReviewsWrapper as Reviews,
  NotFound,
  PaymentSuccess,
  LazyVerificationWrapper as Verification,
  LazyAgentRegistrationWrapper as AgentRegistration,
  LazyAgentDashboardWrapper as AgentDashboard,
  LazyPortfolioWrapper as Portfolio,
  LazyPortfolioViewWrapper as PortfolioView,
  LazyDisputesWrapper as Disputes,
  LazySettingsWrapper as Settings,
  LazyProfileWrapper as Profile,
  LazyAgentChatDashboardWrapper as AgentChatDashboardPage,
  LazyHowItWorksWrapper as HowItWorks,
  LazyAdminUsersWrapper as AdminUsers,
  LazyFinancialReportsWrapper as FinancialReports,
  LazyFavoritesWrapper as Favorites,
  LazyBecomeArtisanWrapper as BecomeArtisan,
  LazyHelpCenterWrapper as HelpCenter,
  LazySafetyGuidelinesWrapper as SafetyGuidelines,
  LazyPOSPartnershipWrapper as POSPartnership,
  LazyCompetitiveAdvantagesWrapper as CompetitiveAdvantages,
  LazyCalendarWrapper as Calendar,
  LazyMonitoringDashboardWrapper as MonitoringDashboard,
} from "@/utils/lazyRoutes";
import TestSignup from '@/pages/TestSignup';

const queryClient = new QueryClient();

const App = () => {
  // Initialize welcome email queue processing
  useWelcomeEmailQueue();

  return (
    <SecureErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <GlobalErrorHandler>
          <SessionRecoveryManager>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <div className="relative min-h-screen">
                <LegacyRedirect />
                <Routes>
                {/* Public routes */}
                <Route path={ROUTES.HOME} element={<Index />} />
                <Route path={ROUTES.AUTH} element={<Auth />} />
                <Route path="/auth/confirm" element={<AuthConfirm />} />
                <Route path={ROUTES.HOW_IT_WORKS} element={<HowItWorks />} />
                <Route path={ROUTES.BECOME_ARTISAN} element={<BecomeArtisan />} />
                <Route path={ROUTES.HELP_CENTER} element={<HelpCenter />} />
                <Route path={ROUTES.SAFETY_GUIDELINES} element={<SafetyGuidelines />} />
                <Route path={ROUTES.POS_PARTNERSHIP} element={<POSPartnership />} />
                <Route path={ROUTES.COMPETITIVE_ADVANTAGES} element={<CompetitiveAdvantages />} />
                
                {/* Legal pages */}
                <Route path={ROUTES.PRIVACY_POLICY} element={<PrivacyPolicy />} />
                <Route path={ROUTES.TERMS_OF_SERVICE} element={<TermsOfService />} />
                <Route path={ROUTES.COOKIE_POLICY} element={<CookiePolicy />} />
                
                {/* Testing routes */}
                <Route path="/test-signup" element={<TestSignup />} />
                
                {/* Main application routes */}
                <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />
                <Route path={ROUTES.SERVICES} element={<Services />} />
                <Route path={ROUTES.BOOK} element={<BookingRequest />} />
                <Route path={ROUTES.BOOKINGS} element={<MyBookings />} />
                <Route path={ROUTES.FAVORITES} element={<Favorites />} />
                <Route path={ROUTES.MESSAGES} element={<Messages />} />
                <Route path={ROUTES.REVIEWS} element={<Reviews />} />
                <Route path={ROUTES.CALENDAR} element={<Calendar />} />
                <Route path={ROUTES.PROFILE} element={<Profile />} />
                <Route path={ROUTES.SETTINGS} element={<Settings />} />
                
                {/* Artisan routes */}
                <Route path={ROUTES.PORTFOLIO} element={<Portfolio />} />
                <Route path={ROUTES.PORTFOLIO_VIEW} element={<PortfolioView />} />
                <Route path={ROUTES.VERIFICATION} element={<Verification />} />
                <Route path={ROUTES.DISPUTES} element={<Disputes />} />
                
                {/* Agent routes */}
                <Route path={ROUTES.AGENT_REGISTRATION} element={<AgentRegistration />} />
                <Route path={ROUTES.AGENT_DASHBOARD} element={<AgentDashboard />} />
                <Route path={ROUTES.AGENT_CHAT} element={<AgentChatDashboardPage />} />
                
                {/* Admin routes - consolidated under /admin/* */}
                <Route path={ROUTES.ADMIN.LOGIN} element={<AdminLogin />} />
                <Route path={ROUTES.ADMIN.DASHBOARD} element={<AdminDashboard />} />
                <Route path={ROUTES.ADMIN.CONTROL_PANEL} element={<AdminControlPanel />} />
                <Route path={ROUTES.ADMIN.USERS} element={<AdminUsers />} />
                <Route path={ROUTES.ADMIN.FINANCIAL_REPORTS} element={<FinancialReports />} />
                <Route path={ROUTES.ADMIN.MONITORING} element={<MonitoringDashboard />} />
                
                {/* Special routes */}
                <Route path={ROUTES.PAYMENT_SUCCESS} element={<PaymentSuccess />} />
                <Route path={ROUTES.NOT_FOUND} element={<NotFound />} />
                </Routes>
                
                {/* Mobile-specific components */}
                <MobileBottomNav />
                <InstallPrompt />
              </div>
            </TooltipProvider>
          </SessionRecoveryManager>
        </GlobalErrorHandler>
      </QueryClientProvider>
    </SecureErrorBoundary>
  );
};
export default App;

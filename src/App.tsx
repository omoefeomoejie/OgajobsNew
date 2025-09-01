import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { SecureErrorBoundary } from "@/components/error/SecureErrorBoundary";
import { GlobalErrorHandler } from "@/components/error/GlobalErrorHandler";
import { InstallPrompt } from "@/components/mobile/InstallPrompt";
import { MobileBottomNav } from "@/components/mobile/MobileBottomNav";
import { LegacyRedirect } from "@/components/routing/LegacyRedirect";
import { ROUTES } from "@/config/routes";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import CookiePolicy from "./pages/CookiePolicy";
import Services from "./pages/Services"; // Now using Services instead of ServiceDirectory
import BookingRequest from "./pages/BookingRequest";
import MyBookings from "./pages/MyBookings";
import Messages from "./pages/Messages";
import Reviews from "./pages/Reviews";
import NotFound from "./pages/NotFound";
import PaymentSuccess from "./pages/PaymentSuccess";
import Verification from "./pages/Verification";
import AgentRegistration from "./pages/AgentRegistration";
import AgentDashboard from "./pages/AgentDashboard";
import Portfolio from "./pages/Portfolio";
import PortfolioView from "./pages/PortfolioView";
import Disputes from "./pages/Disputes";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import AgentChatDashboardPage from "./pages/AgentChatDashboard";
import HowItWorks from "./pages/HowItWorks";
import AdminUsers from "./pages/AdminUsers";
import FinancialReports from "./pages/FinancialReports";
import Favorites from "./pages/Favorites";
import BecomeArtisan from "./pages/BecomeArtisan";
import HelpCenter from "./pages/HelpCenter";
import SafetyGuidelines from "./pages/SafetyGuidelines";
import POSPartnership from "./pages/POSPartnership";
import CompetitiveAdvantages from "./pages/CompetitiveAdvantages";
import Calendar from "./pages/Calendar";
import MonitoringDashboard from "./pages/MonitoringDashboard";

const queryClient = new QueryClient();

const App = () => (
  <SecureErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <GlobalErrorHandler>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
            <div className="relative min-h-screen">
              <LegacyRedirect />
              <Routes>
                {/* Public routes */}
                <Route path={ROUTES.HOME} element={<Index />} />
                <Route path={ROUTES.AUTH} element={<Auth />} />
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
            </BrowserRouter>
          </TooltipProvider>
        </GlobalErrorHandler>
      </AuthProvider>
    </QueryClientProvider>
  </SecureErrorBoundary>
);

export default App;

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { GlobalErrorHandler } from "@/components/error/GlobalErrorHandler";
import { InstallPrompt } from "@/components/mobile/InstallPrompt";
import { MobileBottomNav } from "@/components/mobile/MobileBottomNav";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import CookiePolicy from "./pages/CookiePolicy";
import ServiceDirectory from "./pages/ServiceDirectory";
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
import Services from "./pages/Services";
import HelpCenter from "./pages/HelpCenter";
import SafetyGuidelines from "./pages/SafetyGuidelines";
import POSPartnership from "./pages/POSPartnership";
import CompetitiveAdvantages from "./pages/CompetitiveAdvantages";
import Calendar from "./pages/Calendar";
import MonitoringDashboard from "./pages/MonitoringDashboard";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <GlobalErrorHandler>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
            <div className="relative min-h-screen">
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/login" element={<Auth />} />
                <Route path="/register" element={<Auth />} />
                <Route path="/ojssytem-admin" element={<AdminLogin />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/admin-dashboard" element={<AdminDashboard />} />
                <Route path="/services" element={<ServiceDirectory />} />
                <Route path="/service-directory" element={<ServiceDirectory />} />
                <Route path="/book" element={<BookingRequest />} />
                <Route path="/bookings" element={<MyBookings />} />
                <Route path="/my-bookings" element={<MyBookings />} />
                <Route path="/favorites" element={<Favorites />} />
                <Route path="/messages" element={<Messages />} />
                <Route path="/reviews" element={<Reviews />} />
                <Route path="/payment-success" element={<PaymentSuccess />} />
                <Route path="/verification" element={<Verification />} />
                <Route path="/agent-registration" element={<AgentRegistration />} />
                <Route path="/agent-dashboard" element={<AgentDashboard />} />
                <Route path="/portfolio" element={<Portfolio />} />
                <Route path="/portfolio/:portfolioId" element={<PortfolioView />} />
                <Route path="/disputes" element={<Disputes />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/agent-chat" element={<AgentChatDashboardPage />} />
                <Route path="/how-it-works" element={<HowItWorks />} />
                <Route path="/become-artisan" element={<BecomeArtisan />} />
                <Route path="/all-services" element={<Services />} />
                <Route path="/services" element={<Services />} />
                <Route path="/help-center" element={<HelpCenter />} />
                <Route path="/help" element={<HelpCenter />} />
                <Route path="/safety-guidelines" element={<SafetyGuidelines />} />
                <Route path="/safety" element={<SafetyGuidelines />} />
                <Route path="/pos-partnership" element={<POSPartnership />} />
                <Route path="/competitive-advantages" element={<CompetitiveAdvantages />} />
                <Route path="/dispute-resolution" element={<Disputes />} />
                <Route path="/calendar" element={<Calendar />} />
                <Route path="/monitoring-dashboard" element={<MonitoringDashboard />} />
                <Route path="/admin/users" element={<AdminUsers />} />
                <Route path="/admin/financial-reports" element={<FinancialReports />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/terms-of-service" element={<TermsOfService />} />
                <Route path="/cookie-policy" element={<CookiePolicy />} />
                <Route path="*" element={<NotFound />} />
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
  </ErrorBoundary>
);

export default App;

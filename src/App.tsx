import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { InstallPrompt } from "@/components/mobile/InstallPrompt";
import { MobileBottomNav } from "@/components/mobile/MobileBottomNav";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
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
import HowItWorksSection from "./pages/HowItWorksSection"; // NEW: Add this import

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
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
              <Route path="/how-it-works" element={<HowItWorks />} /> {/* NEW: Add this route */}
              <Route path="/ojssytem-admin" element={<AdminLogin />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/admin-dashboard" element={<AdminDashboard />} />
              <Route path="/services" element={<ServiceDirectory />} />
              <Route path="/book" element={<BookingRequest />} />
              <Route path="/bookings" element={<MyBookings />} />
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
              <Route path="*" element={<NotFound />} />
            </Routes>
            
            {/* Mobile-specific components */}
            <MobileBottomNav />
            <InstallPrompt />
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

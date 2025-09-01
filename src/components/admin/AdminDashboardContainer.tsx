import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Shield } from 'lucide-react';
import {
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { EnhancedBreadcrumb, buildNavigationPath } from './EnhancedBreadcrumb';
import { Badge } from '@/components/ui/badge';

// Section components
import { MissionControlOptimized } from './sections/MissionControlOptimized';
import { UserQueueOptimized } from './sections/UserQueueOptimized';
import { BookingControlOptimized } from './sections/BookingControlOptimized';
import { AdminSidebar } from './sections/AdminSidebar';

// Analytics components
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard';
import { FinancialReporting } from '@/components/admin/FinancialReporting';
import { AdvancedPerformanceMetrics } from '@/components/analytics/AdvancedPerformanceMetrics';
import { UserBehaviorAnalytics } from '@/components/analytics/UserBehaviorAnalytics';
import { SecurityDashboard } from './SecurityDashboard';
import { SystemHealthDashboard } from './SystemHealthDashboard';
import { DisputeResolutionCenter } from './DisputeResolutionCenter';
import { DemandPredictionDashboard } from '@/components/analytics/DemandPredictionDashboard';
import DynamicPricingDashboard from '@/components/analytics/DynamicPricingDashboard';
import FraudDetectionDashboard from '@/components/analytics/FraudDetectionDashboard';
import QualityPredictionDashboard from '@/components/analytics/QualityPredictionDashboard';
import RecommendationEngine from '@/components/analytics/RecommendationEngine';
import { PerformanceDashboard } from './PerformanceDashboard';

// Enhanced Breadcrumb Integration
function AdminBreadcrumbWrapper({ activeSection, setActiveSection }: { 
  activeSection: string; 
  setActiveSection: (section: string) => void; 
}) {
  const navigationPath = buildNavigationPath(activeSection);
  
  const handleNavigation = (path: string[]) => {
    // Navigate to the last item in the path
    const targetSection = path[path.length - 1];
    setActiveSection(targetSection);
  };

  return (
    <EnhancedBreadcrumb
      navigationPath={navigationPath}
      onNavigate={handleNavigation}
      maxItems={4}
      showHomeButton={true}
      showQuickNav={true}
      className="animate-fade-in"
    />
  );
}

export function AdminDashboardContainer() {
  const { user, profile } = useAuth();
  const [activeSection, setActiveSection] = useState("control");

  const renderContent = () => {
    switch (activeSection) {
      case 'control':
        return <MissionControlOptimized setActiveSection={setActiveSection} />;
      case 'users':
        return <UserQueueOptimized />;
      case 'bookings':
        return <BookingControlOptimized />;
      case 'disputes':
        return <DisputeResolutionCenter />;
      case 'finance':
        return <FinancialReporting />;
      case 'health':
        return <SystemHealthDashboard />;
      case 'analytics':
        return <AnalyticsDashboard />;
      case 'demand':
        return <DemandPredictionDashboard />;
      case 'pricing':
        return <DynamicPricingDashboard />;
      case 'fraud':
        return <FraudDetectionDashboard />;
      case 'quality':
        return <QualityPredictionDashboard />;
      case 'recommendations':
        return <RecommendationEngine />;
      case 'predictive':
        return <div className="p-8 text-center text-muted-foreground">Predictive Analytics - Coming Soon</div>;
      case 'performance':
        return <PerformanceDashboard />;
      case 'behavior':
        return <UserBehaviorAnalytics />;
      case 'safety':
        return <SecurityDashboard />;
      default:
        return <MissionControlOptimized setActiveSection={setActiveSection} />;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar activeSection={activeSection} setActiveSection={setActiveSection} />
        <div className="flex-1 flex flex-col">
          <header className="sticky top-0 z-40 h-16 flex items-center justify-between border-b px-6 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <Badge variant="destructive">Admin Control</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-destructive" />
              <span className="text-sm font-medium">Mission Control Active</span>
            </div>
          </header>
          <main className="flex-1 p-6 space-y-6">
            <AdminBreadcrumbWrapper activeSection={activeSection} setActiveSection={setActiveSection} />
            <div className="w-full">
              {renderContent()}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
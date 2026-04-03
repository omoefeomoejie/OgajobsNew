import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import ClientDashboardPage from '@/pages/ClientDashboard';
import ArtisanDashboardPage from '@/pages/ArtisanDashboard';
import POSAgentDashboard from '@/components/pos-agent/POSAgentDashboard';
import { logger } from '@/lib/logger';
import { Navigate } from 'react-router-dom';
import { ROUTES } from '@/config/routes';

export default function Dashboard() {
  const { profile, loading, user, activeMode } = useAuth();

  logger.debug('Dashboard state', {
    hasUser: !!user,
    hasProfile: !!profile,
    loading,
    profileRole: profile?.role,
  });

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your dashboard...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!user) {
    logger.info('Dashboard accessed without authentication');
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-muted-foreground">Please log in to access your dashboard.</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!profile) {
    logger.warn('No profile found for authenticated user', { userId: user.id });
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-muted-foreground">Setting up your profile...</p>
            <p className="text-sm text-muted-foreground mt-2">
              If this persists, please contact support.
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  const renderDashboard = () => {
    logger.debug('Rendering dashboard', { role: profile?.role, activeMode });

    // Admin and POS agent always show their own dashboard regardless of mode
    if (profile?.role === 'admin' || profile?.role === 'super_admin') return <Navigate to={ROUTES.ADMIN.CONTROL_PANEL} replace />;
    if (profile?.role === 'pos_agent') return <POSAgentDashboard />;

    // Client/artisan use activeMode for switching
    switch (activeMode) {
      case 'artisan':
        return <ArtisanDashboardPage />;
      case 'client':
      default:
        return <ClientDashboardPage />;
    }
  };

  return (
    <AppLayout>
      {renderDashboard()}
    </AppLayout>
  );
}

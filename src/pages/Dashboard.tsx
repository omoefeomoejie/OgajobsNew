import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import ClientDashboardPage from '@/pages/ClientDashboard';
import ArtisanDashboardPage from '@/pages/ArtisanDashboard';
import { AdminDashboardContainer as AdminDashboardComponent } from '@/components/admin/AdminDashboardContainer';
import POSAgentDashboard from '@/components/pos-agent/POSAgentDashboard';
import { logger } from '@/lib/logger';

export default function Dashboard() {
  const { profile, loading, user } = useAuth();

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
    logger.debug('Rendering dashboard for role', { role: profile?.role });
    switch (profile?.role) {
      case 'client':
        return <ClientDashboardPage />;
      case 'artisan':
        return <ArtisanDashboardPage />;
      case 'admin':
        return <AdminDashboardComponent />;
      case 'pos_agent':
        return <POSAgentDashboard />;
      default:
        logger.warn('Unknown user role detected', { role: profile?.role });
        return <ClientDashboardPage />;
    }
  };

  return (
    <AppLayout>
      {renderDashboard()}
    </AppLayout>
  );
}

import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import ClientDashboardPage from '@/pages/ClientDashboard';
import ArtisanDashboardPage from '@/pages/ArtisanDashboard';
import { AdminDashboard as AdminDashboardComponent } from '@/components/admin/AdminDashboard';

export default function Dashboard() {
  const { profile } = useAuth();

  const renderDashboard = () => {
    switch (profile?.role) {
      case 'client':
        return <ClientDashboardPage />;
      case 'artisan':
        return <ArtisanDashboardPage />;
      case 'admin':
        return <AdminDashboardComponent />;
      default:
        return <ClientDashboardPage />; // Default fallback
    }
  };

  return (
    <AppLayout>
      {renderDashboard()}
    </AppLayout>
  );
}
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import ClientDashboardPage from '@/pages/ClientDashboard';
import ArtisanDashboardPage from '@/pages/ArtisanDashboard';
import { AdminDashboard as AdminDashboardComponent } from '@/components/admin/AdminDashboard';

export default function Dashboard() {
  const { profile } = useAuth();

  console.log('Dashboard - Current profile:', profile);

  const renderDashboard = () => {
    console.log('Dashboard - Rendering for role:', profile?.role);
    switch (profile?.role) {
      case 'client':
        console.log('Dashboard - Showing ClientDashboard');
        return <ClientDashboardPage />;
      case 'artisan':
        console.log('Dashboard - Showing ArtisanDashboard');
        return <ArtisanDashboardPage />;
      case 'admin':
        console.log('Dashboard - Showing AdminDashboard');
        return <AdminDashboardComponent />;
      default:
        console.log('Dashboard - Showing default ClientDashboard for role:', profile?.role);
        return <ClientDashboardPage />; // Default fallback
    }
  };

  return (
    <AppLayout>
      {renderDashboard()}
    </AppLayout>
  );
}
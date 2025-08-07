import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { ClientDashboard } from '@/components/dashboard/ClientDashboard';
import { ArtisanDashboard } from '@/components/dashboard/ArtisanDashboard';
import { AdminDashboard as AdminDashboardComponent } from '@/components/admin/AdminDashboard';

export default function Dashboard() {
  const { profile } = useAuth();

  const renderDashboard = () => {
    switch (profile?.role) {
      case 'client':
        return <ClientDashboard />;
      case 'artisan':
        return <ArtisanDashboard />;
      case 'admin':
        return <AdminDashboardComponent />;
      default:
        return <ClientDashboard />; // Default fallback
    }
  };

  return (
    <AppLayout>
      {renderDashboard()}
    </AppLayout>
  );
}
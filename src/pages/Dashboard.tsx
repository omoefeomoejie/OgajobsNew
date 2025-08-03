import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import ClientDashboard from './ClientDashboard';
import ArtisanDashboard from './ArtisanDashboard';

export default function Dashboard() {
  const { profile } = useAuth();

  const renderDashboard = () => {
    switch (profile?.role) {
      case 'client':
        return <ClientDashboard />;
      case 'artisan':
        return <ArtisanDashboard />;
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
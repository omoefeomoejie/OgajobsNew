import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ArtisanDashboard } from '@/components/dashboard/ArtisanDashboard';
import { ClientDashboard } from '@/components/dashboard/ClientDashboard';
import { Loader2 } from 'lucide-react';

export default function Dashboard() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth?redirect=/dashboard');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {profile.role === 'artisan' ? (
        <ArtisanDashboard />
      ) : profile.role === 'client' ? (
        <ClientDashboard />
      ) : (
        <div className="p-8 text-center">
          <h1 className="text-2xl font-bold text-foreground">Welcome!</h1>
          <p className="text-muted-foreground">Your dashboard is being prepared...</p>
        </div>
      )}
    </div>
  );
}
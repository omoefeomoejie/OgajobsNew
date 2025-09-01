import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import ClientDashboardPage from '@/pages/ClientDashboard';
import ArtisanDashboardPage from '@/pages/ArtisanDashboard';
import { AdminDashboard as AdminDashboardComponent } from '@/components/admin/AdminDashboard';
import { RoleDebugPanel } from '@/components/debug/RoleDebugPanel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import { useState } from 'react';

export default function Dashboard() {
  const { profile, loading, user } = useAuth();
  const [showDebugPanel, setShowDebugPanel] = useState(false);

  console.log('=== DASHBOARD DEBUG ===');
  console.log('Current user:', user);
  console.log('Current profile:', profile);
  console.log('Loading state:', loading);
  console.log('Profile role:', profile?.role);
  console.log('User ID:', user?.id);
  console.log('Profile ID:', profile?.id);
  
  // Check for role mismatch
  const userMetadataRole = user?.user_metadata?.role;
  const profileRole = profile?.role;
  const hasRoleMismatch = userMetadataRole && profileRole && userMetadataRole !== profileRole;
  
  console.log('User metadata role:', userMetadataRole);
  console.log('Has role mismatch:', hasRoleMismatch);
  console.log('========================');

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
    console.log('Dashboard - No user found, redirecting to auth');
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
    console.log('Dashboard - No profile found for user:', user.id);
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
        console.log('Dashboard - Unknown role, showing ClientDashboard. Role was:', profile?.role);
        return (
          <div className="p-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
              <p className="text-yellow-800">
                Unknown user role: "{profile?.role}". Defaulting to client dashboard.
              </p>
            </div>
            <ClientDashboardPage />
          </div>
        );
    }
  };

  return (
    <AppLayout>
      {hasRoleMismatch && (
        <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <h3 className="text-lg font-semibold text-destructive">Role Synchronization Issue Detected</h3>
          </div>
          <p className="text-sm text-destructive/80 mb-3">
            Your authentication metadata shows role "{userMetadataRole}" but your profile shows "{profileRole}". 
            This is causing the wrong dashboard to appear. Use the debug panel below to fix this.
          </p>
          <button 
            onClick={() => setShowDebugPanel(!showDebugPanel)}
            className="text-sm text-destructive underline hover:no-underline"
          >
            {showDebugPanel ? 'Hide' : 'Show'} Role Debug Panel
          </button>
        </div>
      )}
      
      {showDebugPanel && (
        <div className="mb-6">
          <RoleDebugPanel />
        </div>
      )}
      
      {renderDashboard()}
    </AppLayout>
  );
}
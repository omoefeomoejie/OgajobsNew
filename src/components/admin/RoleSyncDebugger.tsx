import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { manualRoleSync, forceUserRole } from '@/utils/roleSync';

export function RoleSyncDebugger() {
  const { user, profile, refreshProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  const handleForceSync = async () => {
    if (!user) return;
    
    setIsLoading(true);
    setSyncResult(null);
    
    try {
      const forcedRole = await forceUserRole(user.id);
      if (forcedRole) {
        await refreshProfile();
        setSyncResult(`Successfully forced role to: ${forcedRole}`);
      } else {
        setSyncResult('No metadata role found to sync');
      }
    } catch (error) {
      setSyncResult(`Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualSync = async (targetRole: string) => {
    if (!user) return;
    
    setIsLoading(true);
    setSyncResult(null);
    
    try {
      const success = await manualRoleSync(user.id, targetRole);
      if (success) {
        await refreshProfile();
        setSyncResult(`Successfully synced role to: ${targetRole}`);
      } else {
        setSyncResult('Manual sync failed - check console for details');
      }
    } catch (error) {
      setSyncResult(`Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  const userMetadataRole = user.user_metadata?.role;
  const profileRole = profile?.role;
  const hasRoleMismatch = userMetadataRole && profileRole && userMetadataRole !== profileRole;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Role Sync Debugger</CardTitle>
        <CardDescription>
          Debug and fix role synchronization issues between auth metadata and profile
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">User Metadata Role:</label>
            <div className="mt-1">
              <Badge variant={userMetadataRole ? "default" : "secondary"}>
                {userMetadataRole || 'Not Set'}
              </Badge>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Profile Role:</label>
            <div className="mt-1">
              <Badge variant={profileRole ? "default" : "secondary"}>
                {profileRole || 'Not Set'}
              </Badge>
            </div>
          </div>
        </div>

        {hasRoleMismatch && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              ⚠️ Role mismatch detected! Metadata: {userMetadataRole}, Profile: {profileRole}
            </p>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={handleForceSync} 
            disabled={isLoading}
            variant="outline"
          >
            Force Sync from Metadata
          </Button>
          
          <Button 
            onClick={() => handleManualSync('artisan')} 
            disabled={isLoading}
            variant="outline"
          >
            Force to Artisan
          </Button>
          
          <Button 
            onClick={() => handleManualSync('client')} 
            disabled={isLoading}
            variant="outline"
          >
            Force to Client
          </Button>
          
          <Button 
            onClick={() => handleManualSync('admin')} 
            disabled={isLoading}
            variant="outline"
          >
            Force to Admin
          </Button>
        </div>

        {syncResult && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">{syncResult}</p>
          </div>
        )}

        <div className="text-xs text-gray-500 space-y-1">
          <p>User ID: {user.id}</p>
          <p>Email: {user.email}</p>
        </div>
      </CardContent>
    </Card>
  );
}
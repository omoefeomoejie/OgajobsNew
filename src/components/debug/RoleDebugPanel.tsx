import { useAuth } from '@/contexts/AuthContext';
import { RoleSyncDebugger } from '@/components/admin/RoleSyncDebugger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function RoleDebugPanel() {
  const { user, profile } = useAuth();

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Role Debug Panel</CardTitle>
          <CardDescription>Please log in to view role information</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const userMetadataRole = user.user_metadata?.role;
  const profileRole = profile?.role;
  const hasRoleMismatch = userMetadataRole && profileRole && userMetadataRole !== profileRole;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Current Role Status</CardTitle>
          <CardDescription>Your current authentication and profile role information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Authentication Metadata Role</h4>
              <p className="text-sm text-muted-foreground mb-1">Role stored in Supabase auth metadata</p>
              <div className="p-2 bg-muted rounded">
                <code className="text-sm">{userMetadataRole || 'Not set'}</code>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Profile Database Role</h4>
              <p className="text-sm text-muted-foreground mb-1">Role stored in profiles table</p>
              <div className="p-2 bg-muted rounded">
                <code className="text-sm">{profileRole || 'Not set'}</code>
              </div>
            </div>
          </div>
          
          {hasRoleMismatch && (
            <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded">
              <p className="text-sm text-destructive font-medium">
                ⚠️ Role Mismatch Detected
              </p>
              <p className="text-sm text-destructive/80 mt-1">
                Your authentication metadata shows "{userMetadataRole}" but your profile shows "{profileRole}". 
                This may cause dashboard display issues.
              </p>
            </div>
          )}
          
          {!hasRoleMismatch && userMetadataRole && profileRole && (
            <div className="mt-4 p-3 bg-success/10 border border-success/20 rounded">
              <p className="text-sm text-success font-medium">
                ✅ Roles Synchronized
              </p>
              <p className="text-sm text-success/80 mt-1">
                Your roles are properly synchronized as "{profileRole}".
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <RoleSyncDebugger />
    </div>
  );
}
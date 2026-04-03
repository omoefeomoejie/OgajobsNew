import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/config/routes';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Eye, EyeOff, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { CreateAdminDialog } from '@/components/admin/CreateAdminDialog';
import { Logo } from '@/components/ui/logo';

const MAX_LOGIN_ATTEMPTS = 5;

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [createAdminOpen, setCreateAdminOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const isLocked = loginAttempts >= MAX_LOGIN_ATTEMPTS;

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return;
    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        const next = loginAttempts + 1;
        setLoginAttempts(next);
        setError(next >= MAX_LOGIN_ATTEMPTS
          ? `Too many failed attempts. Please wait before trying again.`
          : error.message);
        return;
      }

      if (data.user) {
        // Check if user is admin
        const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin');
        
        if (adminError) {
          setError('Error verifying admin access');
          await supabase.auth.signOut();
          return;
        }

        if (!isAdmin) {
          setError('Access denied. Admin credentials required.');
          await supabase.auth.signOut();
          return;
        }

        toast({
          title: "Welcome Admin",
          description: "Successfully logged into admin panel.",
        });

        navigate(ROUTES.ADMIN.DASHBOARD);
      }
    } catch (error: any) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageWrapper title="Admin Access" showBackButton={true} showHomeButton={true}>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/20 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="flex items-center gap-2">
                <Logo variant="icon" size="md" />
                <Shield className="w-8 h-8 text-primary" />
              </div>
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">Admin Access</CardTitle>
              <CardDescription>
                Restricted access - Admin credentials required
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Admin Login</TabsTrigger>
                <TabsTrigger value="create">Create Admin</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="space-y-4">
                <form onSubmit={handleSignIn} className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="email">Admin Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@ogajobs.com.ng"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter admin password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={loading}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={loading}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {isLocked && (
                    <Alert variant="destructive">
                      <AlertDescription>Account temporarily locked after {MAX_LOGIN_ATTEMPTS} failed attempts.</AlertDescription>
                    </Alert>
                  )}
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loading || isLocked}
                  >
                    {loading ? 'Verifying...' : isLocked ? 'Locked' : 'Access Admin Panel'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="create" className="space-y-4">
                <div className="text-center space-y-4">
                  <div className="p-6 bg-muted rounded-lg">
                    <UserPlus className="h-12 w-12 mx-auto mb-4 text-primary" />
                    <h3 className="text-lg font-semibold mb-2">Create New Admin User</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Create a new administrator account with immediate access.
                    </p>
                    <Button 
                      onClick={() => setCreateAdminOpen(true)}
                      className="w-full"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Create Admin User
                    </Button>
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    <p>First-time setup: creates the initial admin account.</p>
                    <p>Adding further admins requires an existing admin to be logged in.</p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="mt-6 text-center">
              <Button
                variant="link"
                className="text-sm text-muted-foreground"
                onClick={() => navigate('/')}
              >
                ← Return to Main Site
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Create Admin Dialog */}
        <CreateAdminDialog
          open={createAdminOpen}
          onOpenChange={setCreateAdminOpen}
          onSuccess={() => {
            toast({
              title: "Success",
              description: "Admin user created successfully. You can now log in.",
            });
          }}
        />
      </div>
    </PageWrapper>
  );
}
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ArrowLeft, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Logo } from '@/components/ui/logo';
import { Link } from 'react-router-dom';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isValidToken, setIsValidToken] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Verify the reset token is valid
    const verifyToken = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error || !data.session) {
          setError('Invalid or expired reset link. Please request a new password reset.');
          return;
        }
        setIsValidToken(true);
      } catch (error) {
        setError('Invalid or expired reset link. Please request a new password reset.');
      }
    };

    verifyToken();
  }, []);

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate passwords match
      if (password !== confirmPassword) {
        throw new Error('Passwords do not match');
      }

      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      toast({
        title: "Password Updated Successfully",
        description: "Your password has been updated. You can now sign in with your new password.",
      });

      // Redirect to auth page after successful update
      setTimeout(() => {
        navigate('/auth');
      }, 2000);

    } catch (error: any) {
      setError(error.message || 'Failed to update password');
      toast({
        title: "Password Update Failed",
        description: error.message || 'Failed to update password',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isValidToken && !error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-6">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Verifying reset link...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4 relative overflow-hidden">
      {/* Back to Auth Button */}
      <Button 
        variant="ghost" 
        className="absolute top-4 left-4 z-20"
        asChild
      >
        <Link to="/auth">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Sign In
        </Link>
      </Button>

      {/* Floating watermark logos */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute w-32 h-32 opacity-3 top-10 left-10 rotate-12 animate-pulse">
          <Logo variant="icon" className="w-full h-full" />
        </div>
        <div className="absolute w-24 h-24 opacity-3 top-32 right-20 -rotate-12 animate-pulse delay-1000">
          <Logo variant="icon" className="w-full h-full" />
        </div>
      </div>

      <Card className="w-full max-w-md relative z-10">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Logo variant="icon" size="xl" />
          </div>
          <CardTitle className="text-2xl font-bold">Reset Your Password</CardTitle>
          <CardDescription>
            Enter your new password below
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
              <div className="text-center">
                <Link 
                  to="/auth"
                  className="inline-flex items-center text-sm text-primary hover:underline"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back to Sign In
                </Link>
                <p className="text-xs text-muted-foreground mt-2">
                  Need a new reset link? Use the "Forgot Password?" option on the sign in page.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handlePasswordUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Confirm your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Password
              </Button>
            </form>
          )}

          {/* Security Notice */}
          <div className="mt-6 pt-4 border-t border-muted">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4 text-green-600" />
              <span>Your new password will be encrypted and secure</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
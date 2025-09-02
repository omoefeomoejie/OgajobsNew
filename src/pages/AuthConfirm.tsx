import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, AlertCircle, Loader2, ArrowLeft, Key } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { Logo } from '@/components/ui/logo';

export default function AuthConfirm() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handlePasswordReset = async () => {
      try {
        // Check if this is a password reset token
        const tokenHash = searchParams.get('token_hash');
        const type = searchParams.get('type');
        
        if (tokenHash && type === 'recovery') {
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: 'recovery'
          });

          if (error) {
            console.error('Password reset verification error:', error);
            setStatus('error');
            setMessage(error.message || 'Password reset link has expired or is invalid.');
          } else if (data?.user) {
            setStatus('success');
            setMessage('Password reset verified! You can now set a new password.');
            
            // Show success toast
            toast({
              title: "Reset Link Verified!",
              description: "You can now set a new password for your account.",
            });

            // Redirect to password reset form after a delay
            setTimeout(() => {
              navigate('/auth?mode=reset&verified=true');
            }, 2000);
          }
        } else {
          setStatus('error');
          setMessage('Invalid or missing reset link. Please request a new password reset.');
        }
      } catch (error) {
        console.error('Password reset process error:', error);
        setStatus('error');
        setMessage('An unexpected error occurred. Please try again.');
      }
    };

    handlePasswordReset();
  }, [searchParams, navigate, toast]);

  return (
    <PageWrapper>
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4 relative overflow-hidden">
        {/* Back to Home Button */}
        <Button 
          variant="ghost" 
          className="absolute top-4 left-4 z-20"
          asChild
        >
          <Link to="/">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
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
          <div className="absolute w-28 h-28 opacity-3 bottom-20 left-20 rotate-45 animate-pulse delay-2000">
            <Logo variant="icon" className="w-full h-full" />
          </div>
        </div>
        
        <Card className="w-full max-w-md relative z-10">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Link to="/" className="hover:opacity-80 transition-opacity">
                <Logo variant="icon" size="xl" />
              </Link>
            </div>
            <CardTitle className="text-2xl font-bold">
              {status === 'loading' && 'Verifying Reset Link...'}
              {status === 'success' && 'Reset Link Verified!'}
              {status === 'error' && 'Verification Failed'}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            {/* Status Icon */}
            <div className="flex justify-center">
              {status === 'loading' && (
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
              )}
              {status === 'success' && (
                <CheckCircle className="h-16 w-16 text-green-500" />
              )}
              {status === 'error' && (
                <AlertCircle className="h-16 w-16 text-red-500" />
              )}
            </div>

            {/* Status Message */}
            <p className="text-muted-foreground text-lg">
              {message}
            </p>

            {/* Action Buttons */}
            <div className="space-y-3">
              {status === 'success' && (
                <Button 
                  className="w-full" 
                  onClick={() => navigate('/auth?mode=reset&verified=true')}
                >
                  Set New Password
                </Button>
              )}
              
              {status === 'error' && (
                <>
                  <Button 
                    className="w-full" 
                    onClick={() => navigate('/auth')}
                  >
                    Request New Reset Link
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => navigate('/')}
                  >
                    Back to Home
                  </Button>
                </>
              )}
            </div>

            {/* Additional Help */}
            <div className="border-t pt-4 space-y-2">
              <div className="flex items-center justify-center text-sm text-muted-foreground">
                <Key className="h-4 w-4 mr-2" />
                Need help? Contact support
              </div>
              <p className="text-xs text-muted-foreground">
                Having trouble with password reset? Contact our support team for assistance.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
}
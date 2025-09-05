import React, { useState, useEffect } from 'react';
import { RefreshCw, Check, AlertCircle, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useRateLimiter } from '@/hooks/useRateLimiter';
import { supabase } from '@/integrations/supabase/client';

interface ResendEmailButtonProps {
  email: string;
  disabled?: boolean;
  onResend?: (email: string, password: string, userData: any) => Promise<void>;
}

export function ResendEmailButton({
  email,
  disabled = false,
  onResend
}: ResendEmailButtonProps) {
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [resendCount, setResendCount] = useState(0);
  const [lastResent, setLastResent] = useState(false);
  const [showAlternatives, setShowAlternatives] = useState(false);
  const { toast } = useToast();
  const { withRateLimit, isRateLimited } = useRateLimiter();

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldown]);

  // Show alternatives after 3 failed attempts
  useEffect(() => {
    if (resendCount >= 3) {
      setShowAlternatives(true);
    }
  }, [resendCount]);

  const getProgressiveDelay = (attempt: number) => {
    switch (attempt) {
      case 0: return 60;   // 60 seconds
      case 1: return 120;  // 2 minutes
      case 2: return 300;  // 5 minutes
      default: return 600; // 10 minutes
    }
  };

  const handleResend = async () => {
    if (loading || cooldown > 0 || disabled || isRateLimited()) return;

    setLoading(true);
    
    try {
      const result = await withRateLimit('email_resend', async () => {
        // Check if we have stored signup data
        const stored = localStorage.getItem('ogajobs_signup_data');
        if (!stored) {
          throw new Error('No signup data found. Please try signing up again.');
        }

        const signupData = JSON.parse(stored);
        
        // Use custom resend handler if provided, otherwise use default
        if (onResend) {
          await onResend(email, signupData.password, signupData);
        } else {
          const { error } = await supabase.auth.resend({
            type: 'signup',
            email: email,
            options: {
              emailRedirectTo: `${window.location.origin}/`
            }
          });

          if (error) {
            throw new Error(error.message);
          }
        }

        return true;
      });

      if (result) {
        setResendCount(prev => prev + 1);
        setLastResent(true);
        
        const newCooldown = getProgressiveDelay(resendCount);
        setCooldown(newCooldown);

        toast({
          title: "Email Sent! ✉️",
          description: "Check your inbox (and spam folder) for the confirmation email.",
        });

        // Reset success state after 3 seconds
        setTimeout(() => setLastResent(false), 3000);
      }
      
    } catch (error: any) {
      toast({
        title: "Failed to Send Email",
        description: error.message || "Please try again later or contact support.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCooldownTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  };

  const isDisabled = disabled || loading || cooldown > 0 || isRateLimited();
  const buttonText = cooldown > 0 
    ? `Resend in ${formatCooldownTime(cooldown)}` 
    : resendCount > 0 
    ? "Resend Again" 
    : "Didn't receive email?";

  return (
    <div className="space-y-4">
      <Button
        variant="outline"
        onClick={handleResend}
        disabled={isDisabled}
        className={`w-full transition-all duration-300 ${
          lastResent ? 'bg-success/10 border-success/20 text-success' : ''
        }`}
      >
        {loading ? (
          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
        ) : lastResent ? (
          <Check className="h-4 w-4 mr-2" />
        ) : cooldown > 0 ? (
          <AlertCircle className="h-4 w-4 mr-2" />
        ) : (
          <RefreshCw className="h-4 w-4 mr-2" />
        )}
        {lastResent ? "Email Sent Successfully!" : buttonText}
      </Button>

      {resendCount > 0 && (
        <Alert className="bg-muted/30 border-muted">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Email sent {resendCount} time{resendCount > 1 ? 's' : ''}.</strong>
            <br />
            If you still don't see it, check your spam folder or try a different email address.
          </AlertDescription>
        </Alert>
      )}

      {showAlternatives && (
        <div className="space-y-3 p-4 bg-muted/20 rounded-lg border border-muted">
          <div className="flex items-center gap-2 text-sm font-medium">
            <MessageCircle className="h-4 w-4" />
            <span>Need help? Try these options:</span>
          </div>
          
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={() => {
                window.location.href = 'mailto:support@ogajobs.com?subject=Email Confirmation Issue';
              }}
            >
              Contact Support
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={() => {
                // Refresh auth state to check if user confirmed elsewhere
                window.location.reload();
              }}
            >
              I've Already Confirmed
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground">
            Sometimes emails can take up to 10 minutes to arrive. Make sure to check your spam/junk folder.
          </p>
        </div>
      )}
    </div>
  );
}
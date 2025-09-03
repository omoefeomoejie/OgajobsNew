import React, { useState, useEffect } from 'react';
import { RefreshCw, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface ResendEmailButtonProps {
  onResend: () => Promise<void>;
  disabled?: boolean;
  cooldownTime?: number;
}

export function ResendEmailButton({
  onResend,
  disabled = false,
  cooldownTime = 60
}: ResendEmailButtonProps) {
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [resendCount, setResendCount] = useState(0);
  const [lastResent, setLastResent] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleResend = async () => {
    if (loading || cooldown > 0 || disabled) return;

    setLoading(true);
    try {
      await onResend();
      setResendCount(prev => prev + 1);
      setLastResent(true);
      
      // Progressive cooldown: 60s, 120s, 300s
      const newCooldown = resendCount === 0 ? 60 : resendCount === 1 ? 120 : 300;
      setCooldown(newCooldown);

      toast({
        title: "Email Sent! ✉️",
        description: "Check your inbox (and spam folder) for the confirmation email.",
      });

      // Reset success state after 3 seconds
      setTimeout(() => setLastResent(false), 3000);
      
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

  const isDisabled = disabled || loading || cooldown > 0;
  const buttonText = cooldown > 0 
    ? `Resend in ${cooldown}s` 
    : resendCount > 0 
    ? "Resend Again" 
    : "Didn't receive email?";

  return (
    <Button
      variant="outline"
      onClick={handleResend}
      disabled={isDisabled}
      className={`w-full transition-all duration-300 ${
        lastResent ? 'bg-green-50 border-green-200 text-green-700' : ''
      }`}
    >
      {loading ? (
        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
      ) : lastResent ? (
        <Check className="h-4 w-4 mr-2 text-green-600" />
      ) : (
        <RefreshCw className="h-4 w-4 mr-2" />
      )}
      {lastResent ? "Email Sent Successfully!" : buttonText}
    </Button>
  );
}
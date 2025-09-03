import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle, Clock, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ResendEmailButton } from './ResendEmailButton';
import { ConfirmationProgress } from './ConfirmationProgress';

interface EmailConfirmationScreenProps {
  email: string;
  fullName: string;
  role: string;
  onBackToSignup: () => void;
  onResendEmail: (email: string, password: string, userData: any) => Promise<void>;
  signupData: any;
}

export function EmailConfirmationScreen({
  email,
  fullName,
  role,
  onBackToSignup,
  onResendEmail,
  signupData
}: EmailConfirmationScreenProps) {
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);

    // Show help options after 30 seconds
    const helpTimer = setTimeout(() => {
      setShowHelp(true);
    }, 30000);

    return () => {
      clearInterval(timer);
      clearTimeout(helpTimer);
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="relative">
            <Mail className="h-16 w-16 text-primary animate-pulse" />
            <CheckCircle className="h-6 w-6 text-green-500 absolute -bottom-1 -right-1 animate-bounce" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold text-foreground">
          Check Your Email!
        </CardTitle>
        <p className="text-muted-foreground">
          We've sent a confirmation email to <strong className="text-foreground">{email}</strong>
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        <ConfirmationProgress currentStep={1} />

        <div className="bg-muted/50 rounded-lg p-4 space-y-3">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Clock className="h-4 w-4" />
            What happens next?
          </h3>
          <ol className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mt-0.5">1</span>
              <span>Check your email inbox for our confirmation message</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="bg-muted text-muted-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mt-0.5">2</span>
              <span>Click the "Confirm Account" button in the email</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="bg-muted text-muted-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mt-0.5">3</span>
              <span>You'll be automatically redirected to your dashboard</span>
            </li>
          </ol>
        </div>

        <div className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            Time elapsed: {formatTime(timeElapsed)}
          </p>
          
          <Alert>
            <AlertDescription className="text-center">
              <strong>Usually takes less than 2 minutes</strong><br />
              If you don't see the email, check your spam/junk folder
            </AlertDescription>
          </Alert>

          <ResendEmailButton
            onResend={() => onResendEmail(signupData.email, signupData.password, signupData)}
            disabled={timeElapsed < 60}
            cooldownTime={60}
          />
        </div>

        {showHelp && (
          <div className="border-t pt-4 space-y-3">
            <h4 className="font-semibold text-foreground">Need help?</h4>
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => {
                  // Open email app
                  window.location.href = 'mailto:';
                }}
              >
                Open Email App
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => {
                  // Refresh the page to check auth state
                  window.location.reload();
                }}
              >
                I've Already Confirmed
              </Button>
            </div>
          </div>
        )}

        <Button
          variant="ghost"
          className="w-full"
          onClick={onBackToSignup}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Sign Up
        </Button>
      </CardContent>
    </Card>
  );
}
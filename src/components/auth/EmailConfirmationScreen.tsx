import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle, Clock, ArrowLeft, AlertTriangle, MessageCircle, HelpCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ResendEmailButton } from './ResendEmailButton';
import { ConfirmationProgress } from './ConfirmationProgress';
import { EmailConfirmationFAQ } from './EmailConfirmationFAQ';
import { EmailConfirmationErrorHandler, EmailConfirmationError, getEmailConfirmationErrorType } from './EmailConfirmationErrorHandler';
import { useEmailConfirmationAnalytics } from '@/hooks/useEmailConfirmationAnalytics';

interface EmailConfirmationScreenProps {
  email: string;
  fullName: string;
  role: string;
  onBackToSignup: () => void;
  onResendEmail: (email: string, password: string, userData: any) => Promise<void>;
  signupData: any;
  onSkipConfirmation?: () => void;
}

export function EmailConfirmationScreen({
  email,
  fullName,
  role,
  onBackToSignup,
  onResendEmail,
  signupData,
  onSkipConfirmation
}: EmailConfirmationScreenProps) {
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  const [showSpamTip, setShowSpamTip] = useState(false);
  const [showDirectSupport, setShowDirectSupport] = useState(false);
  const [showFAQ, setShowFAQ] = useState(false);
  const [error, setError] = useState<EmailConfirmationError | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Initialize analytics tracking
  const analytics = useEmailConfirmationAnalytics(email);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);

    // Progressive help system based on time elapsed
    const helpTimer = setTimeout(() => setShowHelp(true), 30000); // 30 seconds
    const spamTimer = setTimeout(() => setShowSpamTip(true), 120000); // 2 minutes
    const supportTimer = setTimeout(() => setShowDirectSupport(true), 300000); // 5 minutes

    return () => {
      clearInterval(timer);
      clearTimeout(helpTimer);
      clearTimeout(spamTimer);
      clearTimeout(supportTimer);
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleResendWithAnalytics = async (email: string, password: string, userData: any) => {
    try {
      setError(null);
      const newRetryCount = retryCount + 1;
      setRetryCount(newRetryCount);
      
      analytics.trackResendAttempt(newRetryCount, {
        timeElapsed,
        previousErrors: error ? [error] : []
      });
      
      await onResendEmail(email, password, userData);
    } catch (err: any) {
      const errorType = getEmailConfirmationErrorType(err);
      setError(errorType);
      
      analytics.trackHelpAccessed('error_encountered', {
        errorType,
        retryCount: retryCount + 1,
        timeElapsed
      });
    }
  };

  const handleHelpAction = (helpType: string) => {
    analytics.trackHelpAccessed(helpType, { timeElapsed });
  };

  const handleSupportContact = (method: string) => {
    analytics.trackSupportContacted(method, { timeElapsed, retryCount });
  };

  const handleSkipConfirmation = () => {
    if (onSkipConfirmation) {
      analytics.trackConfirmationCompleted({ skipped: true, timeElapsed });
      onSkipConfirmation();
    }
  };

  const handleRetryError = () => {
    setError(null);
    // The actual retry logic will be handled by the parent component
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
            email={signupData.email}
            disabled={timeElapsed < 60}
            onResend={handleResendWithAnalytics}
          />
        </div>

        {/* Progressive Help System */}
        {showHelp && (
          <div className="border-t pt-4 space-y-3">
            <h4 className="font-semibold text-foreground flex items-center gap-2">
              <HelpCircle className="h-4 w-4" />
              Need help?
            </h4>
            
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => {
                  handleHelpAction('open_email_app');
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
                  handleHelpAction('manual_refresh');
                  window.location.reload();
                }}
              >
                I've Already Confirmed
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => {
                  handleHelpAction('faq_opened');
                  setShowFAQ(!showFAQ);
                }}
              >
                Troubleshooting Help
              </Button>
            </div>
          </div>
        )}

        {/* Spam Folder Tip - Shows after 2 minutes */}
        {showSpamTip && (
          <Alert className="bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800/30">
            <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            <AlertDescription className="text-yellow-800 dark:text-yellow-200">
              <strong>Still waiting?</strong> The email might be in your spam/junk folder. 
              This is common with confirmation emails.
            </AlertDescription>
          </Alert>
        )}

        {/* Direct Support - Shows after 5 minutes */}
        {showDirectSupport && (
          <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800/30">
            <MessageCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertDescription className="text-blue-800 dark:text-blue-200">
              <strong>Need immediate help?</strong> Our support team can help you get signed in right away.
              <Button
                variant="link"
                size="sm"
                className="ml-2 p-0 h-auto text-blue-600 dark:text-blue-400"
                onClick={() => {
                  handleSupportContact('email');
                  window.location.href = `mailto:support@ogajobs.com?subject=Email Confirmation Help&body=I'm having trouble confirming my email address: ${email}`;
                }}
              >
                Contact Support
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Error Handler */}
        <EmailConfirmationErrorHandler
          error={error}
          onRetry={handleRetryError}
          onFallbackAction={onBackToSignup}
          retryCount={retryCount}
          maxRetries={3}
        />

        {/* FAQ Section */}
        {showFAQ && (
          <EmailConfirmationFAQ
            email={email}
            onClose={() => setShowFAQ(false)}
          />
        )}

        <Button
          variant="ghost"
          className="w-full"
          onClick={() => {
            analytics.trackConfirmationAbandoned('back_to_signup', { timeElapsed });
            onBackToSignup();
          }}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Sign Up
        </Button>
      </CardContent>
    </Card>
  );
}
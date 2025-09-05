import React, { useState, useEffect } from 'react';
import { Bug, CheckCircle, AlertCircle, Clock, ZapIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

interface EmailConfirmationDebugProps {
  email: string;
  signupData: any;
  onSkipConfirmation: () => void;
}

interface SessionState {
  session: any;
  user: any;
  lastChecked: string;
}

interface EmailDeliveryStatus {
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  lastAttempt: string;
  attempts: number;
  error?: string;
}

export function EmailConfirmationDebug({ 
  email, 
  signupData, 
  onSkipConfirmation 
}: EmailConfirmationDebugProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [sessionState, setSessionState] = useState<SessionState | null>(null);
  const [deliveryStatus, setDeliveryStatus] = useState<EmailDeliveryStatus>({
    status: 'pending',
    lastAttempt: new Date().toISOString(),
    attempts: 1
  });
  const [confirmationUrl, setConfirmationUrl] = useState<string>('');

  // Only show in development
  if (!import.meta.env.DEV) {
    return null;
  }

  useEffect(() => {
    // Monitor session state
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSessionState({
        session: session,
        user: session?.user || null,
        lastChecked: new Date().toISOString()
      });
    };

    checkSession();
    const interval = setInterval(checkSession, 5000); // Check every 5 seconds

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      logger.debug('Auth state change in debug mode', { event, session });
      setSessionState({
        session: session,
        user: session?.user || null,
        lastChecked: new Date().toISOString()
      });
    });

    return () => {
      clearInterval(interval);
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    // Generate mock confirmation URL for development
    if (import.meta.env.DEV) {
      const mockToken = 'dev_token_' + Math.random().toString(36).substring(7);
      const url = `${window.location.origin}/auth/confirm?token=${mockToken}&email=${encodeURIComponent(email)}`;
      setConfirmationUrl(url);
    }
  }, [email]);

  const handleSkipConfirmation = () => {
    logger.debug('Skipping email confirmation for development', { email });
    
    // Clear any stored signup data
    localStorage.removeItem('ogajobs_signup_data');
    
    // Call the skip handler
    onSkipConfirmation();
  };

  const handleTestEmailDelivery = () => {
    setDeliveryStatus(prev => ({
      ...prev,
      status: Math.random() > 0.3 ? 'sent' : 'failed',
      lastAttempt: new Date().toISOString(),
      attempts: prev.attempts + 1,
      error: Math.random() > 0.3 ? undefined : 'Mock delivery failure for testing'
    }));
  };

  const getStatusIcon = (status: EmailDeliveryStatus['status']) => {
    switch (status) {
      case 'sent':
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  return (
    <div className="mt-4">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-between bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100 dark:bg-orange-950/20 dark:border-orange-800/30 dark:text-orange-300"
          >
            <div className="flex items-center gap-2">
              <Bug className="h-4 w-4" />
              Debug Mode (Development)
            </div>
            <Badge variant="secondary" className="ml-2">
              DEV
            </Badge>
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="mt-4">
          <Card className="border-orange-200 dark:border-orange-800/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Bug className="h-4 w-4" />
                Development Debug Panel
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Skip Confirmation Button */}
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg dark:bg-green-950/20 dark:border-green-800/30">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-green-800 dark:text-green-200">
                      Skip Email Confirmation
                    </h4>
                    <p className="text-sm text-green-600 dark:text-green-300">
                      For testing purposes only
                    </p>
                  </div>
                  <Button
                    onClick={handleSkipConfirmation}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <ZapIcon className="h-4 w-4 mr-2" />
                    Skip
                  </Button>
                </div>
              </div>

              {/* Confirmation URL */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Confirmation URL:</h4>
                <div className="p-2 bg-muted rounded text-xs font-mono break-all">
                  {confirmationUrl}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigator.clipboard.writeText(confirmationUrl)}
                >
                  Copy URL
                </Button>
              </div>

              {/* Email Delivery Status */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">Email Delivery Status:</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleTestEmailDelivery}
                  >
                    Test Delivery
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(deliveryStatus.status)}
                  <Badge variant={deliveryStatus.status === 'failed' ? 'destructive' : 'default'}>
                    {deliveryStatus.status.toUpperCase()}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Attempts: {deliveryStatus.attempts}
                  </span>
                </div>
                {deliveryStatus.error && (
                  <Alert className="mt-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      {deliveryStatus.error}
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Session State */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Session State:</h4>
                <div className="p-2 bg-muted rounded text-xs">
                  <div className="space-y-1">
                    <div>
                      <strong>Status:</strong> {sessionState?.session ? 'Authenticated' : 'Not authenticated'}
                    </div>
                    <div>
                      <strong>User ID:</strong> {sessionState?.user?.id || 'None'}
                    </div>
                    <div>
                      <strong>Email:</strong> {sessionState?.user?.email || 'None'}
                    </div>
                    <div>
                      <strong>Email Confirmed:</strong> {sessionState?.user?.email_confirmed_at ? 'Yes' : 'No'}
                    </div>
                    <div>
                      <strong>Last Checked:</strong> {sessionState?.lastChecked ? new Date(sessionState.lastChecked).toLocaleTimeString() : 'Never'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Signup Data */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Signup Data:</h4>
                <div className="p-2 bg-muted rounded text-xs font-mono">
                  <pre>{JSON.stringify(signupData, null, 2)}</pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
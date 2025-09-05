import React, { useState, useEffect } from 'react';
import { AlertCircle, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { logger } from '@/lib/logger';

export type EmailConfirmationError = 
  | 'network_error'
  | 'email_service_down'
  | 'rate_limited'
  | 'invalid_email'
  | 'server_error'
  | 'timeout'
  | 'auth_error'
  | 'unknown';

interface EmailConfirmationErrorHandlerProps {
  error: EmailConfirmationError | null;
  onRetry: () => void;
  onFallbackAction?: () => void;
  retryCount?: number;
  maxRetries?: number;
}

interface ErrorConfig {
  title: string;
  description: string;
  icon: React.ReactNode;
  showRetry: boolean;
  showFallback: boolean;
  fallbackText?: string;
  severity: 'low' | 'medium' | 'high';
}

const ERROR_CONFIGS: Record<EmailConfirmationError, ErrorConfig> = {
  network_error: {
    title: 'Connection Problem',
    description: 'Unable to connect to our servers. Please check your internet connection and try again.',
    icon: <WifiOff className="h-4 w-4" />,
    showRetry: true,
    showFallback: true,
    fallbackText: 'Try offline mode',
    severity: 'medium'
  },
  email_service_down: {
    title: 'Email Service Temporarily Unavailable',
    description: 'Our email service is currently experiencing issues. We\'re working to resolve this quickly.',
    icon: <AlertCircle className="h-4 w-4" />,
    showRetry: true,
    showFallback: true,
    fallbackText: 'Contact support directly',
    severity: 'high'
  },
  rate_limited: {
    title: 'Too Many Attempts',
    description: 'You\'ve made too many requests. Please wait a few minutes before trying again.',
    icon: <AlertCircle className="h-4 w-4" />,
    showRetry: false,
    showFallback: true,
    fallbackText: 'Contact support',
    severity: 'medium'
  },
  invalid_email: {
    title: 'Invalid Email Address',
    description: 'The email address appears to be invalid. Please check and try again.',
    icon: <AlertCircle className="h-4 w-4" />,
    showRetry: false,
    showFallback: true,
    fallbackText: 'Go back to signup',
    severity: 'low'
  },
  server_error: {
    title: 'Server Error',
    description: 'Something went wrong on our end. This is usually temporary.',
    icon: <AlertCircle className="h-4 w-4" />,
    showRetry: true,
    showFallback: true,
    fallbackText: 'Report issue',
    severity: 'high'
  },
  timeout: {
    title: 'Request Timed Out',
    description: 'The request took too long to complete. This might be due to a slow connection.',
    icon: <AlertCircle className="h-4 w-4" />,
    showRetry: true,
    showFallback: false,
    severity: 'medium'
  },
  auth_error: {
    title: 'Authentication Error',
    description: 'There was a problem with the authentication process. Please try signing up again.',
    icon: <AlertCircle className="h-4 w-4" />,
    showRetry: false,
    showFallback: true,
    fallbackText: 'Start over',
    severity: 'high'
  },
  unknown: {
    title: 'Something Went Wrong',
    description: 'An unexpected error occurred. Please try again or contact support if the problem persists.',
    icon: <AlertCircle className="h-4 w-4" />,
    showRetry: true,
    showFallback: true,
    fallbackText: 'Contact support',
    severity: 'medium'
  }
};

export function EmailConfirmationErrorHandler({
  error,
  onRetry,
  onFallbackAction,
  retryCount = 0,
  maxRetries = 3
}: EmailConfirmationErrorHandlerProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [autoRetryCountdown, setAutoRetryCountdown] = useState<number | null>(null);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-retry for certain errors
  useEffect(() => {
    if (!error || !shouldAutoRetry(error) || retryCount >= maxRetries) {
      return;
    }

    const retryDelay = getRetryDelay(retryCount);
    let countdown = Math.ceil(retryDelay / 1000);
    setAutoRetryCountdown(countdown);

    const countdownInterval = setInterval(() => {
      countdown -= 1;
      setAutoRetryCountdown(countdown);
      
      if (countdown <= 0) {
        clearInterval(countdownInterval);
        setAutoRetryCountdown(null);
      }
    }, 1000);

    const retryTimeout = setTimeout(() => {
      logger.info('Auto-retrying after error', { error, retryCount });
      onRetry();
    }, retryDelay);

    return () => {
      clearTimeout(retryTimeout);
      clearInterval(countdownInterval);
      setAutoRetryCountdown(null);
    };
  }, [error, retryCount, maxRetries, onRetry]);

  if (!error) {
    return null;
  }

  const config = ERROR_CONFIGS[error];
  const canRetry = config.showRetry && retryCount < maxRetries;

  const getAlertVariant = (severity: ErrorConfig['severity']) => {
    switch (severity) {
      case 'high':
        return 'destructive';
      default:
        return 'default';
    }
  };

  const shouldAutoRetry = (errorType: EmailConfirmationError): boolean => {
    return ['network_error', 'timeout', 'server_error'].includes(errorType);
  };

  const getRetryDelay = (attempt: number): number => {
    // Exponential backoff: 2s, 4s, 8s
    return Math.min(2000 * Math.pow(2, attempt), 10000);
  };

  const handleManualRetry = () => {
    logger.info('Manual retry initiated', { error, retryCount });
    onRetry();
  };

  const handleFallbackAction = () => {
    logger.info('Fallback action triggered', { error, retryCount });
    onFallbackAction?.();
  };

  return (
    <Card className="mt-4 border-destructive/50">
      <CardContent className="pt-6">
        <Alert variant={getAlertVariant(config.severity)}>
          {config.icon}
          <AlertDescription>
            <div className="space-y-3">
              <div>
                <strong>{config.title}</strong>
                <p className="mt-1">{config.description}</p>
              </div>

              {/* Connection status indicator */}
              {error === 'network_error' && (
                <div className="flex items-center gap-2 text-sm">
                  {isOnline ? (
                    <>
                      <Wifi className="h-4 w-4 text-green-500" />
                      <span className="text-green-600">Connected to internet</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="h-4 w-4 text-red-500" />
                      <span className="text-red-600">No internet connection</span>
                    </>
                  )}
                </div>
              )}

              {/* Retry information */}
              {retryCount > 0 && (
                <div className="text-sm text-muted-foreground">
                  Retry attempt {retryCount} of {maxRetries}
                </div>
              )}

              {/* Auto-retry countdown */}
              {autoRetryCountdown !== null && (
                <div className="text-sm text-blue-600">
                  Auto-retrying in {autoRetryCountdown} seconds...
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-2 pt-2">
                {canRetry && autoRetryCountdown === null && (
                  <Button
                    onClick={handleManualRetry}
                    size="sm"
                    variant="outline"
                    disabled={!isOnline && error === 'network_error'}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                )}

                {config.showFallback && (
                  <Button
                    onClick={handleFallbackAction}
                    size="sm"
                    variant="secondary"
                  >
                    {config.fallbackText}
                  </Button>
                )}
              </div>

              {/* Additional help for specific errors */}
              {error === 'email_service_down' && (
                <div className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                  <strong>Alternative:</strong> You can also create your account and verify your email later from your profile settings.
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}

// Utility function to determine error type from error object
export function getEmailConfirmationErrorType(error: any): EmailConfirmationError {
  if (!error) return 'unknown';

  const message = error.message?.toLowerCase() || '';
  const code = error.code || '';

  // Network errors
  if (message.includes('network') || message.includes('fetch') || code === 'NETWORK_ERROR') {
    return 'network_error';
  }

  // Rate limiting
  if (message.includes('rate limit') || message.includes('too many') || code === 'RATE_LIMITED') {
    return 'rate_limited';
  }

  // Email service issues
  if (message.includes('email') && (message.includes('service') || message.includes('delivery'))) {
    return 'email_service_down';
  }

  // Invalid email
  if (message.includes('invalid email') || message.includes('email format')) {
    return 'invalid_email';
  }

  // Timeout
  if (message.includes('timeout') || code === 'TIMEOUT') {
    return 'timeout';
  }

  // Auth errors
  if (message.includes('auth') || message.includes('authentication') || code.startsWith('AUTH_')) {
    return 'auth_error';
  }

  // Server errors
  if (message.includes('server') || message.includes('internal') || code.startsWith('5')) {
    return 'server_error';
  }

  return 'unknown';
}
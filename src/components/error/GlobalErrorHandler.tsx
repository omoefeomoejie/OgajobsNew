import React, { createContext, useContext, useCallback, useState, ReactNode } from 'react';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

interface ErrorContext {
  reportError: (error: Error, context?: string) => void;
  clearError: () => void;
  retryAction?: () => void;
}

const ErrorContext = createContext<ErrorContext | undefined>(undefined);

interface ErrorInfo {
  error: Error;
  context?: string;
  timestamp: Date;
  userId?: string;
  userAgent: string;
  url: string;
}

interface GlobalErrorHandlerProps {
  children: ReactNode;
  fallback?: (error: Error, retry: () => void) => ReactNode;
}

export function GlobalErrorHandler({ children, fallback }: GlobalErrorHandlerProps) {
  const [currentError, setCurrentError] = useState<ErrorInfo | null>(null);
  const [retryAction, setRetryAction] = useState<(() => void) | undefined>();

  const reportError = useCallback((error: Error, context?: string) => {
    const errorInfo: ErrorInfo = {
      error,
      context,
      timestamp: new Date(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    // Log to console for development
    console.error('Global Error:', errorInfo);

    // Store error info
    setCurrentError(errorInfo);

    // Show toast notification for non-critical errors
    if (!error.message.includes('Network Error') && !error.message.includes('ChunkLoadError')) {
      toast({
        title: "Something went wrong",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    }

    // Report to monitoring service (if available)
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'exception', {
        description: error.message,
        fatal: false,
        custom_map: { context }
      });
    }
  }, []);

  const clearError = useCallback(() => {
    setCurrentError(null);
    setRetryAction(undefined);
  }, []);

  const handleRetry = useCallback(() => {
    if (retryAction) {
      retryAction();
    } else {
      window.location.reload();
    }
    clearError();
  }, [retryAction, clearError]);

  const value = {
    reportError,
    clearError,
    retryAction,
  };

  // If there's a current error and a custom fallback
  if (currentError && fallback) {
    return (
      <ErrorContext.Provider value={value}>
        {fallback(currentError.error, handleRetry)}
      </ErrorContext.Provider>
    );
  }

  // Default error UI for critical errors
  if (currentError && (
    currentError.error.message.includes('ChunkLoadError') ||
    currentError.error.message.includes('Loading chunk') ||
    currentError.error.message.includes('Loading CSS chunk')
  )) {
    return (
      <ErrorContext.Provider value={value}>
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
                <RefreshCw className="w-6 h-6 text-destructive" />
              </div>
              <CardTitle>App Update Available</CardTitle>
              <CardDescription>
                A new version is available. Please refresh to get the latest updates.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button onClick={handleRetry} className="flex-1">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh App
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => window.location.href = '/'} 
                  className="flex-1"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </ErrorContext.Provider>
    );
  }

  return (
    <ErrorContext.Provider value={value}>
      {children}
    </ErrorContext.Provider>
  );
}

export function useErrorHandler() {
  const context = useContext(ErrorContext);
  if (context === undefined) {
    throw new Error('useErrorHandler must be used within a GlobalErrorHandler');
  }
  return context;
}

// HOC for API error handling
export function withErrorHandler<P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string
) {
  return function WrappedComponent(props: P) {
    const { reportError } = useErrorHandler();

    React.useEffect(() => {
      const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
        reportError(new Error(event.reason), `Unhandled promise rejection in ${componentName || 'Unknown'}`);
      };

      window.addEventListener('unhandledrejection', handleUnhandledRejection);
      return () => window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    }, [reportError]);

    return <Component {...props} />;
  };
}

// Hook for API calls with error handling
export function useApiCall() {
  const { reportError } = useErrorHandler();

  return useCallback(async function <T>(
    apiCall: () => Promise<T>,
    options?: {
      context?: string;
      showToast?: boolean;
      retry?: () => void;
    }
  ): Promise<T | null> {
    try {
      return await apiCall();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      reportError(
        new Error(errorMessage), 
        options?.context || 'API Call'
      );
      
      if (options?.showToast !== false) {
        toast({
          title: "Request Failed",
          description: errorMessage,
          variant: "destructive",
          action: options?.retry ? (
            <Button variant="outline" size="sm" onClick={options.retry}>
              Retry
            </Button>
          ) : undefined,
        });
      }
      
      return null;
    }
  }, [reportError]);
}
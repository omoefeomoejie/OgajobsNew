import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface OfflineIndicatorProps {
  className?: string;
  showFullBanner?: boolean;
}

export function OfflineIndicator({ className, showFullBanner = true }: OfflineIndicatorProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showRetryBanner, setShowRetryBanner] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowRetryBanner(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      // Show retry banner after 5 seconds offline
      setTimeout(() => {
        if (!navigator.onLine) {
          setShowRetryBanner(true);
        }
      }, 5000);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = () => {
    window.location.reload();
  };

  // Simple badge indicator
  if (!showFullBanner) {
    return (
      <Badge 
        variant={isOnline ? 'default' : 'destructive'} 
        className={cn('flex items-center gap-1', className)}
      >
        {isOnline ? (
          <>
            <Wifi className="h-3 w-3" />
            Online
          </>
        ) : (
          <>
            <WifiOff className="h-3 w-3" />
            Offline
          </>
        )}
      </Badge>
    );
  }

  // Full banner when offline
  if (!isOnline) {
    return (
      <div className={cn('fixed top-0 left-0 right-0 z-50', className)}>
        <Card className="rounded-none border-l-0 border-r-0 border-t-0 bg-destructive/10 border-destructive/20">
          <CardContent className="p-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <WifiOff className="h-5 w-5 text-destructive" />
                <div>
                  <p className="font-medium text-sm">You're offline</p>
                  <p className="text-xs text-muted-foreground">
                    Some features may not work properly. Check your connection.
                  </p>
                </div>
              </div>
              
              {showRetryBanner && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRetry}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Retry
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}

// Hook for network status
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (wasOffline) {
        // Show success message when coming back online
        setWasOffline(false);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [wasOffline]);

  return { isOnline, wasOffline };
}

// Network-aware component wrapper
interface NetworkAwareProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showIndicator?: boolean;
}

export function NetworkAware({ 
  children, 
  fallback, 
  showIndicator = true 
}: NetworkAwareProps) {
  const { isOnline } = useNetworkStatus();

  const defaultFallback = (
    <Card className="border-destructive/20 bg-destructive/10">
      <CardContent className="p-6 text-center">
        <WifiOff className="h-8 w-8 text-destructive mx-auto mb-4" />
        <h3 className="font-semibold mb-2">Connection Required</h3>
        <p className="text-sm text-muted-foreground mb-4">
          This feature requires an internet connection. Please check your network and try again.
        </p>
        <Button onClick={() => window.location.reload()} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <>
      {showIndicator && <OfflineIndicator showFullBanner={false} />}
      {isOnline ? children : (fallback || defaultFallback)}
    </>
  );
}

// Enhanced error boundary for network errors
interface NetworkErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  isNetworkError: boolean;
}

export class NetworkErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType<any> },
  NetworkErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ComponentType<any> }) {
    super(props);
    this.state = { hasError: false, error: null, isNetworkError: false };
  }

  static getDerivedStateFromError(error: Error): NetworkErrorBoundaryState {
    const isNetworkError = 
      error.message.includes('fetch') ||
      error.message.includes('network') ||
      error.message.includes('Failed to load') ||
      !navigator.onLine;

    return {
      hasError: true,
      error,
      isNetworkError
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Network Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const { fallback: Fallback } = this.props;
      
      if (Fallback) {
        return <Fallback error={this.state.error} />;
      }

      if (this.state.isNetworkError) {
        return (
          <Card className="border-destructive/20 bg-destructive/10 m-4">
            <CardContent className="p-6 text-center">
              <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Network Error</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Unable to connect to our servers. Please check your internet connection.
              </p>
              <div className="flex gap-2 justify-center">
                <Button 
                  onClick={() => window.location.reload()} 
                  variant="outline"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
                <Button 
                  onClick={() => this.setState({ hasError: false })}
                  variant="ghost"
                >
                  Dismiss
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      }

      // Generic error fallback
      return (
        <Card className="border-destructive/20 bg-destructive/10 m-4">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Something went wrong</h3>
            <p className="text-sm text-muted-foreground mb-4">
              An unexpected error occurred. Please try refreshing the page.
            </p>
            <Button onClick={() => window.location.reload()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Page
            </Button>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}
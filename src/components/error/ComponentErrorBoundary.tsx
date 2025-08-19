import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Bug } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  componentName?: string;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorId: string;
}

export class ComponentErrorBoundary extends Component<Props, State> {
  private retryTimeoutId?: NodeJS.Timeout;

  public state: State = {
    hasError: false,
    errorId: '',
  };

  public static getDerivedStateFromError(error: Error): State {
    return { 
      hasError: true, 
      error,
      errorId: Date.now().toString(36)
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`Component Error in ${this.props.componentName || 'Unknown'}:`, error, errorInfo);
    
    // Call custom error handler
    this.props.onError?.(error, errorInfo);

    // Report to monitoring
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'exception', {
        description: error.message,
        fatal: false,
        custom_map: { 
          component: this.props.componentName,
          stack: error.stack?.substring(0, 500)
        }
      });
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorId: '' });
  };

  private handleAutoRetry = () => {
    // Auto-retry after 3 seconds for transient errors
    if (this.state.error?.message.includes('ChunkLoadError') || 
        this.state.error?.message.includes('Loading chunk')) {
      this.retryTimeoutId = setTimeout(() => {
        this.handleRetry();
      }, 3000);
    }
  };

  public componentDidUpdate(prevProps: Props, prevState: State) {
    if (this.state.hasError && !prevState.hasError) {
      this.handleAutoRetry();
    }
  }

  public componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  public render() {
    if (this.state.hasError) {
      // If custom fallback provided, use it
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // For chunk loading errors, show simpler UI
      if (this.state.error?.message.includes('ChunkLoadError') || 
          this.state.error?.message.includes('Loading chunk')) {
        return (
          <div className="p-4 border border-border rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Loading component...</span>
            </div>
            <Button variant="outline" size="sm" onClick={this.handleRetry}>
              Retry Loading
            </Button>
          </div>
        );
      }

      // Default error UI
      return (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              <CardTitle className="text-sm">Component Error</CardTitle>
            </div>
            <CardDescription className="text-xs">
              {this.props.componentName ? `Error in ${this.props.componentName}` : 'Something went wrong with this component'}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            {this.state.error && (
              <div className="text-xs text-muted-foreground bg-muted p-2 rounded border font-mono">
                {this.state.error.message}
              </div>
            )}
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={this.handleRetry}
                className="flex-1"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Retry
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => window.location.reload()}
                className="flex-1"
              >
                Refresh Page
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

// HOC for wrapping components with error boundary
export function withComponentErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    componentName?: string;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
  }
) {
  return function WrappedComponent(props: P) {
    return (
      <ComponentErrorBoundary
        componentName={options?.componentName || Component.displayName || Component.name}
        fallback={options?.fallback}
        onError={options?.onError}
      >
        <Component {...props} />
      </ComponentErrorBoundary>
    );
  };
}
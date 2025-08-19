import React, { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, CreditCard, AlertTriangle, ArrowLeft } from 'lucide-react';

interface Props {
  children: ReactNode;
  onRetry?: () => void;
  onGoBack?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorId: string;
}

export class PaymentErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorId: ''
    };
  }

  static getDerivedStateFromError(error: Error): State {
    const errorId = `PAY_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return {
      hasError: true,
      error,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log payment errors for monitoring
    console.error('Payment Error:', {
      error: error.message,
      stack: error.stack,
      errorInfo,
      errorId: this.state.errorId,
      timestamp: new Date().toISOString()
    });

    // Send to monitoring service if available
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'exception', {
        description: `Payment Error: ${error.message}`,
        fatal: false,
        custom_map: { error_id: this.state.errorId }
      });
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorId: '' });
    this.props.onRetry?.();
  };

  render() {
    if (this.state.hasError) {
      const isPaymentError = this.state.error?.message.includes('payment') ||
                           this.state.error?.message.includes('Paystack') ||
                           this.state.error?.message.includes('transaction');

      return (
        <div className="min-h-[400px] flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <CardTitle>
                  {isPaymentError ? 'Payment Error' : 'Something went wrong'}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertDescription>
                  {isPaymentError 
                    ? 'There was an issue processing your payment. Your card was not charged.'
                    : 'An unexpected error occurred. Please try again.'}
                </AlertDescription>
              </Alert>

              {isPaymentError && (
                <div className="text-sm text-muted-foreground space-y-2">
                  <p><strong>What happened?</strong></p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Your payment was not processed</li>
                    <li>No charges were made to your account</li>
                    <li>You can safely try again</li>
                  </ul>
                </div>
              )}

              <div className="text-xs text-muted-foreground">
                Error ID: {this.state.errorId}
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={this.handleRetry}
                  className="flex-1"
                  variant="default"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
                
                {this.props.onGoBack && (
                  <Button
                    onClick={this.props.onGoBack}
                    variant="outline"
                    className="flex-1"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Go Back
                  </Button>
                )}
              </div>

              <div className="text-center">
                <Button variant="link" size="sm" asChild>
                  <a href="/help-center" className="text-xs">
                    Contact Support
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// HOC for wrapping payment components
export function withPaymentErrorBoundary<T extends object>(
  Component: React.ComponentType<T>,
  options?: {
    onRetry?: () => void;
    onGoBack?: () => void;
  }
) {
  return function PaymentComponentWithErrorBoundary(props: T) {
    return (
      <PaymentErrorBoundary {...options}>
        <Component {...props} />
      </PaymentErrorBoundary>
    );
  };
}
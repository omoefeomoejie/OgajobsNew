import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home, Bug, HelpCircle } from 'lucide-react';

interface ErrorFallbackProps {
  error?: Error;
  resetError?: () => void;
  title?: string;
  description?: string;
  showDetails?: boolean;
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
    icon?: React.ReactNode;
  }>;
}

export function ErrorFallback({
  error,
  resetError,
  title = "Something went wrong",
  description = "An unexpected error occurred. Please try again.",
  showDetails = process.env.NODE_ENV === 'development',
  actions = []
}: ErrorFallbackProps) {
  const defaultActions = [
    {
      label: "Try Again",
      onClick: resetError || (() => window.location.reload()),
      variant: 'default' as const,
      icon: <RefreshCw className="w-4 h-4" />
    },
    {
      label: "Go Home",
      onClick: () => window.location.href = '/',
      variant: 'outline' as const,
      icon: <Home className="w-4 h-4" />
    }
  ];

  const allActions = actions.length > 0 ? actions : defaultActions;

  return (
    <div className="flex items-center justify-center min-h-64 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 text-destructive">
            <AlertTriangle className="w-full h-full" />
          </div>
          <CardTitle className="text-xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {showDetails && error && (
            <details className="text-sm bg-muted p-3 rounded border">
              <summary className="cursor-pointer font-medium mb-2 flex items-center gap-2">
                <Bug className="w-4 h-4" />
                Error Details
              </summary>
              <div className="mt-2 space-y-2">
                <div>
                  <strong>Message:</strong>
                  <pre className="whitespace-pre-wrap text-xs mt-1 p-2 bg-muted-foreground/10 rounded">
                    {error.message}
                  </pre>
                </div>
                {error.stack && (
                  <div>
                    <strong>Stack Trace:</strong>
                    <pre className="whitespace-pre-wrap text-xs mt-1 p-2 bg-muted-foreground/10 rounded max-h-32 overflow-auto">
                      {error.stack}
                    </pre>
                  </div>
                )}
              </div>
            </details>
          )}
          
          <div className="flex gap-2 flex-wrap">
            {allActions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant || 'default'}
                onClick={action.onClick}
                className="flex-1 min-w-0"
              >
                {action.icon && <span className="mr-2">{action.icon}</span>}
                {action.label}
              </Button>
            ))}
          </div>
          
          <div className="text-center pt-2">
            <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <HelpCircle className="w-3 h-3" />
              If the problem persists, please contact support
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function CompactErrorFallback({ 
  error, 
  resetError,
  message = "Something went wrong"
}: { 
  error?: Error; 
  resetError?: () => void;
  message?: string;
}) {
  return (
    <div className="flex items-center justify-center p-4 text-center">
      <div className="space-y-2">
        <AlertTriangle className="w-8 h-8 text-destructive mx-auto" />
        <p className="text-sm text-muted-foreground">{message}</p>
        <Button 
          size="sm" 
          variant="outline" 
          onClick={resetError || (() => window.location.reload())}
        >
          <RefreshCw className="w-3 h-3 mr-1" />
          Retry
        </Button>
      </div>
    </div>
  );
}
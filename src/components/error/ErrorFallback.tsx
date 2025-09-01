import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useNavigate } from "react-router-dom";

interface ErrorFallbackProps {
  error?: Error;
  resetError?: () => void;
  title?: string;
  description?: string;
  showDetails?: boolean;
  showHomeButton?: boolean;
}

export function ErrorFallback({
  error,
  resetError,
  title = "Something went wrong",
  description = "We encountered an unexpected error. Please try again.",
  showDetails = false,
  showHomeButton = true
}: ErrorFallbackProps) {
  const navigate = useNavigate();

  const handleRetry = () => {
    if (resetError) {
      resetError();
    } else {
      window.location.reload();
    }
  };

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-[400px] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {showDetails && error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-sm font-mono">
                {error.message}
              </AlertDescription>
            </Alert>
          )}
          
          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={handleRetry} className="flex-1">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            {showHomeButton && (
              <Button variant="outline" onClick={handleGoHome} className="flex-1">
                <Home className="h-4 w-4 mr-2" />
                Go Home
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function NetworkErrorFallback({ resetError }: { resetError?: () => void }) {
  return (
    <ErrorFallback
      title="Connection Error"
      description="Please check your internet connection and try again."
      resetError={resetError}
      showDetails={false}
    />
  );
}

export function ChunkLoadErrorFallback({ resetError }: { resetError?: () => void }) {
  return (
    <ErrorFallback
      title="Loading Error"
      description="Failed to load page resources. This might be due to a recent update."
      resetError={resetError}
      showDetails={false}
    />
  );
}

export function UnauthorizedErrorFallback() {
  const navigate = useNavigate();
  
  return (
    <ErrorFallback
      title="Access Denied"
      description="You don't have permission to access this page."
      resetError={() => navigate('/auth')}
      showHomeButton={false}
    />
  );
}
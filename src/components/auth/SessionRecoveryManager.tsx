import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigation } from '@/contexts/NavigationContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';
import { logger } from '@/lib/logger';

interface SessionRecoveryManagerProps {
  children: React.ReactNode;
}

export function SessionRecoveryManager({ children }: SessionRecoveryManagerProps) {
  const { session, isInitialized, validateSession, recoverSession } = useAuth();
  const navigation = useNavigation();
  const [recoveryState, setRecoveryState] = useState<'idle' | 'checking' | 'recovering' | 'failed' | 'success'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Check for session issues on mount and periodically
  useEffect(() => {
    if (!isInitialized) return;

    const checkSessionHealth = async () => {
      if (session) {
        setRecoveryState('checking');
        
        try {
          const isValid = await validateSession();
          
          if (!isValid) {
            logger.warn('Invalid session detected, attempting recovery');
            setRecoveryState('recovering');
            await recoverSession();
            setRecoveryState('success');
            
            setTimeout(() => {
              setRecoveryState('idle');
            }, 3000);
          } else {
            setRecoveryState('idle');
          }
        } catch (error) {
          logger.error('Session recovery failed', { error });
          setRecoveryState('failed');
          setErrorMessage('Session recovery failed. Please sign in again.');
        }
      }
    };

    // Initial check
    checkSessionHealth();

    // Periodic health checks every 10 minutes
    const healthCheckInterval = setInterval(checkSessionHealth, 10 * 60 * 1000);

    // Check on network recovery
    const handleOnline = () => {
      if (session) {
        logger.info('Network recovered, checking session health');
        checkSessionHealth();
      }
    };

    window.addEventListener('online', handleOnline);

    return () => {
      clearInterval(healthCheckInterval);
      window.removeEventListener('online', handleOnline);
    };
  }, [isInitialized, session, validateSession, recoverSession]);

  const handleManualRecovery = async () => {
    setRecoveryState('recovering');
    setErrorMessage('');
    
    try {
      await recoverSession();
      setRecoveryState('success');
      
      setTimeout(() => {
        setRecoveryState('idle');
      }, 3000);
    } catch (error) {
      logger.error('Manual session recovery failed', { error });
      setRecoveryState('failed');
      setErrorMessage('Recovery failed. Please sign in again.');
    }
  };

  const handleSignOut = () => {
    navigation.clearIntendedDestination();
    window.location.href = '/auth';
  };

  // Don't render recovery UI during initial load
  if (!isInitialized) {
    return <>{children}</>;
  }

  // Show recovery status for active sessions only
  if (session && recoveryState !== 'idle') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            {recoveryState === 'checking' && (
              <div className="text-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                <div>
                  <h3 className="text-lg font-semibold">Checking Session</h3>
                  <p className="text-sm text-muted-foreground">
                    Verifying your authentication status...
                  </p>
                </div>
              </div>
            )}

            {recoveryState === 'recovering' && (
              <div className="text-center space-y-4">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary" />
                <div>
                  <h3 className="text-lg font-semibold">Recovering Session</h3>
                  <p className="text-sm text-muted-foreground">
                    Restoring your connection, please wait...
                  </p>
                </div>
              </div>
            )}

            {recoveryState === 'success' && (
              <div className="text-center space-y-4">
                <CheckCircle className="h-8 w-8 mx-auto text-green-500" />
                <div>
                  <h3 className="text-lg font-semibold text-green-700">Session Recovered</h3>
                  <p className="text-sm text-muted-foreground">
                    Your session has been successfully restored.
                  </p>
                </div>
              </div>
            )}

            {recoveryState === 'failed' && (
              <div className="space-y-4">
                <div className="text-center">
                  <AlertTriangle className="h-8 w-8 mx-auto text-destructive mb-2" />
                  <h3 className="text-lg font-semibold text-destructive">Session Recovery Failed</h3>
                </div>
                
                {errorMessage && (
                  <Alert variant="destructive">
                    <AlertDescription>{errorMessage}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Button 
                    onClick={handleManualRecovery} 
                    className="w-full"
                    variant="outline"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Recovery Again
                  </Button>
                  
                  <Button 
                    onClick={handleSignOut} 
                    className="w-full"
                    variant="destructive"
                  >
                    Sign In Again
                  </Button>
                </div>

                <div className="text-center">
                  <p className="text-xs text-muted-foreground">
                    This usually happens after network issues or extended inactivity.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
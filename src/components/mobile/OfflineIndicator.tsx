import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineAlert, setShowOfflineAlert] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineAlert(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineAlert(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && !showOfflineAlert) {
    return null;
  }

  return (
    <>
      {/* Status Badge */}
      <Badge 
        variant={isOnline ? "default" : "destructive"} 
        className="fixed top-4 right-4 z-50 flex items-center gap-1"
      >
        {isOnline ? (
          <Wifi className="h-3 w-3" />
        ) : (
          <WifiOff className="h-3 w-3" />
        )}
        {isOnline ? 'Online' : 'Offline'}
      </Badge>

      {/* Offline Alert */}
      {showOfflineAlert && !isOnline && (
        <Alert className="fixed bottom-4 left-4 right-4 z-50 border-destructive">
          <WifiOff className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>You're offline. Some features may be limited.</span>
            <RefreshCw 
              className="h-4 w-4 cursor-pointer hover:animate-spin" 
              onClick={() => window.location.reload()}
            />
          </AlertDescription>
        </Alert>
      )}
    </>
  );
}
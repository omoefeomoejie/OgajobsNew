import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Wifi, WifiOff, RefreshCw, Zap, Circle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

type ConnectionState = 'CONNECTING' | 'OPEN' | 'CLOSING' | 'CLOSED';

export function ConnectionStatus() {
  const [connectionState, setConnectionState] = useState<ConnectionState>('CLOSED');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  useEffect(() => {
    // Monitor Supabase realtime connection
    const channel = supabase.channel('connection-monitor');
    
    channel
      .on('system', {}, (payload) => {
        // Connection status updated
      })
      .subscribe((status) => {
        setConnectionState(status as ConnectionState);
      });

    // Monitor network connectivity
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleReconnect = async () => {
    setReconnectAttempts(prev => prev + 1);
    
    // Force reconnection by removing and re-adding a channel
    const reconnectChannel = supabase.channel(`reconnect-${Date.now()}`);
    await reconnectChannel.subscribe();
    setTimeout(() => {
      supabase.removeChannel(reconnectChannel);
    }, 1000);
  };

  const getStatusColor = () => {
    if (!isOnline) return 'destructive';
    
    switch (connectionState) {
      case 'OPEN':
        return 'default';
      case 'CONNECTING':
        return 'secondary';
      case 'CLOSING':
      case 'CLOSED':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    
    switch (connectionState) {
      case 'OPEN':
        return 'Connected';
      case 'CONNECTING':
        return 'Connecting';
      case 'CLOSING':
        return 'Disconnecting';
      case 'CLOSED':
        return 'Disconnected';
      default:
        return 'Unknown';
    }
  };

  const getStatusIcon = () => {
    if (!isOnline) return <WifiOff className="h-3 w-3" />;
    
    switch (connectionState) {
      case 'OPEN':
        return <Zap className="h-3 w-3" />;
      case 'CONNECTING':
        return <RefreshCw className="h-3 w-3 animate-spin" />;
      default:
        return <Circle className="h-3 w-3" />;
    }
  };

  const showReconnectButton = !isOnline || connectionState === 'CLOSED';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2">
            <Badge variant={getStatusColor() as any} className="flex items-center gap-1">
              {getStatusIcon()}
              {getStatusText()}
            </Badge>
            
            {showReconnectButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReconnect}
                className="h-6 w-6 p-0"
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1 text-sm">
            <p><strong>Network:</strong> {isOnline ? 'Online' : 'Offline'}</p>
            <p><strong>Realtime:</strong> {getStatusText()}</p>
            {reconnectAttempts > 0 && (
              <p><strong>Reconnect attempts:</strong> {reconnectAttempts}</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
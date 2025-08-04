import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Circle, Clock, Coffee, Moon } from 'lucide-react';
import { useRealtimePresence } from '@/hooks/useRealtimePresence';

interface PresenceIndicatorProps {
  userId?: string;
  showStatus?: boolean;
  showActivity?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function PresenceIndicator({ 
  userId, 
  showStatus = true, 
  showActivity = false,
  size = 'md' 
}: PresenceIndicatorProps) {
  const { onlineUsers } = useRealtimePresence();
  
  const user = userId ? onlineUsers.find(u => u.user_id === userId) : null;
  const isOnline = user?.status === 'online';
  const isAway = user?.status === 'away';
  const isBusy = user?.status === 'busy';

  const getStatusColor = () => {
    if (isOnline) return 'bg-green-500';
    if (isAway) return 'bg-yellow-500';
    if (isBusy) return 'bg-red-500';
    return 'bg-gray-400';
  };

  const getStatusText = () => {
    if (isOnline) return 'Online';
    if (isAway) return 'Away';
    if (isBusy) return 'Busy';
    return 'Offline';
  };

  const getStatusIcon = () => {
    if (isOnline) return <Circle className="h-3 w-3 fill-current" />;
    if (isAway) return <Clock className="h-3 w-3" />;
    if (isBusy) return <Coffee className="h-3 w-3" />;
    return <Moon className="h-3 w-3" />;
  };

  const sizeClasses = {
    sm: 'h-2 w-2',
    md: 'h-3 w-3',
    lg: 'h-4 w-4'
  };

  if (!userId) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="flex items-center gap-1">
          <Circle className="h-3 w-3 fill-green-500 text-green-500" />
          {onlineUsers.length} online
        </Badge>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2">
            <div className={`${sizeClasses[size]} ${getStatusColor()} rounded-full`} />
            {showStatus && (
              <span className="text-sm text-muted-foreground">
                {getStatusText()}
              </span>
            )}
            {showActivity && user?.activity && (
              <span className="text-xs text-muted-foreground italic">
                {user.activity}
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span>{getStatusText()}</span>
            {user?.activity && (
              <span className="text-muted-foreground">- {user.activity}</span>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
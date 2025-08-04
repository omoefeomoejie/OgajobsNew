import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, BellRing, BellOff, Settings } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useToast } from '@/hooks/use-toast';

export function PushNotificationManager() {
  const {
    isSupported,
    permission,
    isSubscribed,
    requestPermission,
    subscribe,
    unsubscribe,
    sendTestNotification
  } = usePushNotifications();
  
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleEnableNotifications = async () => {
    setIsLoading(true);
    
    try {
      const success = await subscribe();
      if (success) {
        toast({
          title: "Notifications Enabled",
          description: "You'll receive push notifications for important updates.",
        });
      }
    } catch (error) {
      toast({
        title: "Enable Failed",
        description: "Failed to enable push notifications. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisableNotifications = async () => {
    setIsLoading(true);
    
    try {
      const success = await unsubscribe();
      if (success) {
        toast({
          title: "Notifications Disabled",
          description: "Push notifications have been turned off.",
        });
      }
    } catch (error) {
      toast({
        title: "Disable Failed",
        description: "Failed to disable push notifications.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestNotification = async () => {
    try {
      await sendTestNotification();
      toast({
        title: "Test Sent",
        description: "Check your notifications!",
      });
    } catch (error) {
      toast({
        title: "Test Failed",
        description: "Failed to send test notification.",
        variant: "destructive"
      });
    }
  };

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5" />
            Push Notifications
          </CardTitle>
          <CardDescription>
            Push notifications are not supported on this device or browser.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const getPermissionBadge = () => {
    switch (permission) {
      case 'granted':
        return <Badge variant="default">Granted</Badge>;
      case 'denied':
        return <Badge variant="destructive">Denied</Badge>;
      default:
        return <Badge variant="secondary">Not Asked</Badge>;
    }
  };

  const getStatusIcon = () => {
    if (isSubscribed) {
      return <BellRing className="h-5 w-5 text-green-500" />;
    }
    if (permission === 'denied') {
      return <BellOff className="h-5 w-5 text-red-500" />;
    }
    return <Bell className="h-5 w-5 text-gray-500" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon()}
          Push Notifications
          {getPermissionBadge()}
        </CardTitle>
        <CardDescription>
          {isSubscribed 
            ? "You're receiving push notifications for important updates."
            : "Enable push notifications to stay updated with your jobs and messages."
          }
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Browser Notifications</p>
            <p className="text-sm text-muted-foreground">
              Get notified about new jobs, messages, and updates
            </p>
          </div>
          
          {isSubscribed ? (
            <Button 
              variant="outline" 
              onClick={handleDisableNotifications}
              disabled={isLoading}
            >
              <BellOff className="h-4 w-4 mr-2" />
              Disable
            </Button>
          ) : (
            <Button 
              onClick={handleEnableNotifications}
              disabled={isLoading || permission === 'denied'}
            >
              <Bell className="h-4 w-4 mr-2" />
              Enable
            </Button>
          )}
        </div>

        {permission === 'denied' && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-sm text-destructive">
              Notifications are blocked. Please enable them in your browser settings.
            </p>
            <Button 
              variant="ghost" 
              size="sm" 
              className="mt-2 h-8"
              onClick={() => {
                // Open browser settings hint
                toast({
                  title: "Enable in Browser",
                  description: "Go to your browser settings and allow notifications for this site.",
                  duration: 5000,
                });
              }}
            >
              <Settings className="h-3 w-3 mr-1" />
              How to enable
            </Button>
          </div>
        )}

        {isSubscribed && (
          <div className="pt-3 border-t">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleTestNotification}
              className="w-full"
            >
              Send Test Notification
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
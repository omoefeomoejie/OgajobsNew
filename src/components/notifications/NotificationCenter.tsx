import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Bell, X, Check, Clock, AlertCircle, MessageSquare, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'booking' | 'message' | 'payment' | 'system';
  read: boolean;
  created_at: string;
  action_url?: string;
}

interface NotificationSettings {
  email_notifications: boolean;
  push_notifications: boolean;
  booking_updates: boolean;
  message_alerts: boolean;
  payment_notifications: boolean;
  marketing_emails: boolean;
}

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [settings, setSettings] = useState<NotificationSettings>({
    email_notifications: true,
    push_notifications: true,
    booking_updates: true,
    message_alerts: true,
    payment_notifications: true,
    marketing_emails: false
  });
  const [pushSupported, setPushSupported] = useState(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>('default');
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchNotifications();
      setupRealtimeSubscription();
      checkPushSupport();
    }
  }, [user]);

  const checkPushSupport = () => {
    const supported = 'Notification' in window && 'serviceWorker' in navigator;
    setPushSupported(supported);
    if (supported) {
      setPushPermission(Notification.permission);
    }
  };

  const requestPushPermission = async () => {
    if (!pushSupported) {
      toast({
        title: "Not Supported",
        description: "Push notifications are not supported on this device.",
        variant: "destructive"
      });
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setPushPermission(permission);
      
      if (permission === 'granted') {
        toast({
          title: "Notifications Enabled",
          description: "You'll now receive push notifications for important updates."
        });
        
        // Register service worker and get push subscription
        const registration = await navigator.serviceWorker.register('/sw.js');
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(
            'BP1P_tLRMdLrF8SxmUON8Q2VhJKqrg5XjL9GwqBmBDCd6xQQp_5VFwF1R8R9P9Q1P9R8F1VF'
          )
        });

        // Save subscription to database
        await supabase
          .from('push_subscriptions')
          .upsert({
            user_id: user?.id,
            subscription: JSON.stringify(subscription),
            enabled: true
          });

      } else {
        toast({
          title: "Permission Denied",
          description: "Please enable notifications in your browser settings.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
      toast({
        title: "Error",
        description: "Failed to enable push notifications.",
        variant: "destructive"
      });
    }
  };

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const fetchNotifications = async () => {
    try {
      // Mock notifications for demo - replace with actual Supabase query
      const mockNotifications: Notification[] = [
        {
          id: '1',
          title: 'New Booking Request',
          message: 'You have a new plumbing job request in Lagos',
          type: 'booking',
          read: false,
          created_at: new Date().toISOString(),
          action_url: '/bookings'
        },
        {
          id: '2',
          title: 'Payment Received',
          message: 'Payment of ₦15,000 has been received for completed job',
          type: 'payment',
          read: false,
          created_at: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: '3',
          title: 'New Message',
          message: 'Client has sent you a message about the ongoing project',
          type: 'message',
          read: true,
          created_at: new Date(Date.now() - 7200000).toISOString(),
          action_url: '/messages'
        }
      ];

      setNotifications(mockNotifications);
      setUnreadCount(mockNotifications.filter(n => !n.read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const setupRealtimeSubscription = () => {
    // Set up real-time subscription for new notifications
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'notifications',
          filter: `user_id=eq.${user?.id}`
        }, 
        (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
          
          // Show browser notification if permission granted
          if (pushPermission === 'granted') {
            new Notification(newNotification.title, {
              body: newNotification.message,
              icon: '/icon-192.png',
              badge: '/icon-96.png'
            });
          }
          
          // Show toast notification
          toast({
            title: newNotification.title,
            description: newNotification.message
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const markAsRead = async (notificationId: string) => {
    try {
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      // Update in database
      // await supabase
      //   .from('notifications')
      //   .update({ read: true })
      //   .eq('id', notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      
      // Update all in database
      // await supabase
      //   .from('notifications')
      //   .update({ read: true })
      //   .eq('user_id', user?.id)
      //   .eq('read', false);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      // Delete from database
      // await supabase
      //   .from('notifications')
      //   .delete()
      //   .eq('id', notificationId);
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const updateSettings = async (key: keyof NotificationSettings, value: boolean) => {
    try {
      setSettings(prev => ({ ...prev, [key]: value }));
      
      // Save to database
      // await supabase
      //   .from('user_notification_settings')
      //   .upsert({
      //     user_id: user?.id,
      //     [key]: value
      //   });

      toast({
        title: "Settings Updated",
        description: "Notification preferences have been saved."
      });
    } catch (error) {
      console.error('Error updating settings:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'booking': return <Clock className="h-4 w-4 text-blue-500" />;
      case 'message': return <MessageSquare className="h-4 w-4 text-green-500" />;
      case 'payment': return <DollarSign className="h-4 w-4 text-yellow-500" />;
      case 'system': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Notifications
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={markAllAsRead}
                className="text-xs"
              >
                Mark all read
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4">
            <ScrollArea className="h-80">
              {notifications.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No notifications yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {notifications.map((notification) => (
                    <Card 
                      key={notification.id}
                      className={`cursor-pointer transition-colors ${
                        !notification.read ? 'bg-primary/5 border-primary/20' : ''
                      }`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-2 flex-1">
                            {getNotificationIcon(notification.type)}
                            <div className="flex-1 min-w-0">
                              <h4 className={`text-sm font-medium ${
                                !notification.read ? 'text-foreground' : 'text-muted-foreground'
                              }`}>
                                {notification.title}
                              </h4>
                              <p className="text-xs text-muted-foreground mt-1">
                                {notification.message}
                              </p>
                              <p className="text-xs text-muted-foreground/80 mt-1">
                                {formatTime(notification.created_at)}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            {!notification.read && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(notification.id);
                                }}
                              >
                                <Check className="h-3 w-3" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notification.id);
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="settings" className="mt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="push-notifications">Push Notifications</Label>
                <div className="flex items-center space-x-2">
                  {pushPermission !== 'granted' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={requestPushPermission}
                      disabled={!pushSupported}
                    >
                      Enable
                    </Button>
                  )}
                  <Switch
                    id="push-notifications"
                    checked={settings.push_notifications && pushPermission === 'granted'}
                    onCheckedChange={(checked) => updateSettings('push_notifications', checked)}
                    disabled={pushPermission !== 'granted'}
                  />
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <Label htmlFor="email-notifications">Email Notifications</Label>
                <Switch
                  id="email-notifications"
                  checked={settings.email_notifications}
                  onCheckedChange={(checked) => updateSettings('email_notifications', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="booking-updates">Booking Updates</Label>
                <Switch
                  id="booking-updates"
                  checked={settings.booking_updates}
                  onCheckedChange={(checked) => updateSettings('booking_updates', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="message-alerts">Message Alerts</Label>
                <Switch
                  id="message-alerts"
                  checked={settings.message_alerts}
                  onCheckedChange={(checked) => updateSettings('message_alerts', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="payment-notifications">Payment Notifications</Label>
                <Switch
                  id="payment-notifications"
                  checked={settings.payment_notifications}
                  onCheckedChange={(checked) => updateSettings('payment_notifications', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="marketing-emails">Marketing Emails</Label>
                <Switch
                  id="marketing-emails"
                  checked={settings.marketing_emails}
                  onCheckedChange={(checked) => updateSettings('marketing_emails', checked)}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
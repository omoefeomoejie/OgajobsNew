import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // Check support and current state
  useEffect(() => {
    checkSupport();
    if (user) {
      checkExistingSubscription();
    }
  }, [user]);

  const checkSupport = useCallback(() => {
    const supported = 'Notification' in window && 
                     'serviceWorker' in navigator && 
                     'PushManager' in window;
    
    setIsSupported(supported);
    setPermission(Notification.permission);
  }, []);

  const checkExistingSubscription = useCallback(async () => {
    try {
      if (!('serviceWorker' in navigator)) return;

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        setIsSubscribed(true);
        setSubscription({
          endpoint: subscription.endpoint,
          keys: {
            p256dh: btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('p256dh')!))),
            auth: btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('auth')!)))
          }
        });
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      toast({
        title: "Not Supported",
        description: "Push notifications are not supported on this device.",
        variant: "destructive"
      });
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setPermission(permission);
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting permission:', error);
      toast({
        title: "Permission Error",
        description: "Failed to request notification permission.",
        variant: "destructive"
      });
      return false;
    }
  }, [isSupported, toast]);

  const subscribe = useCallback(async () => {
    if (!user || permission !== 'granted') {
      const granted = await requestPermission();
      if (!granted) return false;
    }

    try {
      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      // Generate VAPID key pair (in production, use your own VAPID keys)
      const vapidPublicKey = urlBase64ToUint8Array(
        'BP1P_tLRMdLrF8SxmUON8Q2VhJKqrg5XjL9GwqBmBDCd6xQQp_5VFwF1R8R9P9Q1P9R8F1VF'
      );

      // Subscribe to push notifications
      const pushSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidPublicKey
      });

      const subscriptionData = {
        endpoint: pushSubscription.endpoint,
        keys: {
          p256dh: btoa(String.fromCharCode.apply(null, new Uint8Array(pushSubscription.getKey('p256dh')!))),
          auth: btoa(String.fromCharCode.apply(null, new Uint8Array(pushSubscription.getKey('auth')!)))
        }
      };

      // Save subscription to database
      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: user.id,
          subscription: subscriptionData,
          enabled: true
        });

      if (error) throw error;

      setIsSubscribed(true);
      setSubscription(subscriptionData);

      toast({
        title: "Notifications Enabled",
        description: "You'll now receive push notifications for important updates."
      });

      return true;
    } catch (error) {
      console.error('Error subscribing to push:', error);
      toast({
        title: "Subscription Failed",
        description: "Failed to enable push notifications.",
        variant: "destructive"
      });
      return false;
    }
  }, [user, permission, requestPermission, toast]);

  const unsubscribe = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
      }

      // Remove from database
      if (user) {
        const { error } = await supabase
          .from('push_subscriptions')
          .update({ enabled: false })
          .eq('user_id', user.id);

        if (error) throw error;
      }

      setIsSubscribed(false);
      setSubscription(null);

      toast({
        title: "Notifications Disabled",
        description: "Push notifications have been disabled."
      });

      return true;
    } catch (error) {
      console.error('Error unsubscribing:', error);
      toast({
        title: "Unsubscribe Failed",
        description: "Failed to disable push notifications.",
        variant: "destructive"
      });
      return false;
    }
  }, [user, toast]);

  const sendTestNotification = useCallback(async () => {
    if (!isSubscribed || !user) return;

    try {
      const { error } = await supabase.functions.invoke('send-push-notification', {
        body: {
          user_id: user.id,
          title: 'Test Notification',
          body: 'This is a test notification from OgaJobs!',
          type: 'system'
        }
      });

      if (error) throw error;

      toast({
        title: "Test Sent",
        description: "Test notification sent successfully."
      });
    } catch (error) {
      console.error('Error sending test:', error);
      toast({
        title: "Test Failed",
        description: "Failed to send test notification.",
        variant: "destructive"
      });
    }
  }, [isSubscribed, user, toast]);

  return {
    isSupported,
    permission,
    isSubscribed,
    subscription,
    requestPermission,
    subscribe,
    unsubscribe,
    sendTestNotification
  };
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
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
}
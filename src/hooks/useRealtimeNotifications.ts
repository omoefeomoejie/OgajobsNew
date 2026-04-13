import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data: any;
  read: boolean;
  priority: string;
  action_url?: string;
  created_at: string;
}

interface NotificationHandler {
  type: string;
  handler: (data: any) => void;
}

export function useRealtimeNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch initial notifications (using existing notifications table for now)
  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    try {
      // For now, use existing notifications table and map to our interface
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Map existing notifications to our interface
      const mappedNotifications = (data || []).map(notification => ({
        id: notification.id,
        type: 'system',
        title: notification.title || 'Notification',
        message: notification.message || '',
        data: {},
        read: false, // No read status in current table
        priority: 'normal',
        action_url: undefined,
        created_at: notification.created_at
      }));

      setNotifications(mappedNotifications);
      setUnreadCount(mappedNotifications.length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    if (!user) return;
    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)
        .eq('user_id', user.id);
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, [user]);

  // Mark all as read (simplified for existing table)
  const markAllAsRead = useCallback(async () => {
    if (!user) return;

    try {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, [user]);

  // Send notification (using existing notifications table)
  const sendNotification = useCallback(async (
    targetUserId: string,
    type: string,
    title: string,
    message: string,
    data: any = {},
    priority: string = 'normal',
    actionUrl?: string
  ) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: targetUserId,
          title,
          message,
          type: type || 'system',
          read: false,
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error sending notification:', error);
      return false;
    }
  }, []);

  // Setup real-time subscription
  useEffect(() => {
    if (!user) return;

    fetchNotifications();

    // Subscribe to real-time changes (using existing notifications table)
    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
        },
        (payload) => {
          const notification = payload.new as any;
          
          const newNotification: Notification = {
            id: notification.id,
            type: 'system',
            title: notification.title || 'New Notification',
            message: notification.message || '',
            data: {},
            read: false,
            priority: 'normal',
            created_at: notification.created_at
          };
          
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
          
          // Show toast for new notifications
          toast({
            title: newNotification.title,
            description: newNotification.message,
            duration: 3000,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchNotifications, toast]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    sendNotification,
    refetch: fetchNotifications
  };
}
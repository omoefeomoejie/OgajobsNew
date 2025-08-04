import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface UserPresence {
  user_id: string;
  email?: string;
  role?: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  last_seen: string;
  activity?: string;
  location?: string;
}

interface PresenceState {
  [key: string]: UserPresence[];
}

export function useRealtimePresence(channelName: string = 'global') {
  const [presenceState, setPresenceState] = useState<PresenceState>({});
  const [onlineUsers, setOnlineUsers] = useState<UserPresence[]>([]);
  const { user, profile } = useAuth();

  const updatePresence = useCallback(async (status: UserPresence['status'], activity?: string) => {
    if (!user) return;

    const presenceData: UserPresence = {
      user_id: user.id,
      email: user.email,
      role: profile?.role,
      status,
      last_seen: new Date().toISOString(),
      activity,
    };

    const channel = supabase.channel(channelName);
    await channel.track(presenceData);
  }, [user, profile, channelName]);

  const setUserStatus = useCallback((status: UserPresence['status'], activity?: string) => {
    updatePresence(status, activity);
  }, [updatePresence]);

  const setUserActivity = useCallback((activity: string) => {
    updatePresence('online', activity);
  }, [updatePresence]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase.channel(channelName);

    channel
      .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState() as PresenceState;
        setPresenceState(newState);
        
        // Flatten to get all online users
        const allUsers = Object.values(newState).flat();
        setOnlineUsers(allUsers.filter(u => u.status !== 'offline'));
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Set initial presence as online
          await updatePresence('online', 'Active on platform');
        }
      });

    // Handle page visibility changes
    const handleVisibilityChange = () => {
      if (document.hidden) {
        updatePresence('away', 'Away from page');
      } else {
        updatePresence('online', 'Active on platform');
      }
    };

    // Handle beforeunload to set offline status
    const handleBeforeUnload = () => {
      updatePresence('offline');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      updatePresence('offline');
      supabase.removeChannel(channel);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [user, channelName, updatePresence]);

  return {
    presenceState,
    onlineUsers,
    setUserStatus,
    setUserActivity,
    updatePresence
  };
}
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

/**
 * Hook to monitor welcome email queue processing
 * This monitors the email notification queue for status updates
 */
export function useWelcomeEmailQueue() {
  useEffect(() => {

    // Set up realtime listener for the email queue
    const channel = supabase
      .channel('email-queue-monitor')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'email_notifications_queue'
        },
        (payload) => {
          logger.info('New welcome email queued', { 
            userId: payload.new.user_id,
            template: payload.new.template,
            email: payload.new.user_email 
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'email_notifications_queue'
        },
        (payload) => {
          if (payload.new.status === 'sent') {
            logger.info('Welcome email sent successfully', { 
              userId: payload.new.user_id,
              template: payload.new.template 
            });
          } else if (payload.new.status === 'failed') {
            logger.error('Welcome email failed', { 
              userId: payload.new.user_id,
              error: payload.new.error_message 
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
}
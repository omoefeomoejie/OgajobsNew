import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

/**
 * Hook to manually process the email queue
 * This provides a fallback to process emails if the automatic trigger fails
 */
export function useEmailQueueProcessor() {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const processEmailQueue = async () => {
    setIsProcessing(true);
    
    try {
      logger.info('Processing email queue manually...');
      
      // Call the email queue processor function
      const { data, error } = await supabase.functions.invoke('process-email-queue');
      
      if (error) {
        logger.error('Email queue processing failed', { error: error.message });
        toast({
          title: "Processing Failed",
          description: `Failed to process email queue: ${error.message}`,
          variant: "destructive",
        });
        return { success: false, error: error.message };
      }
      
      logger.info('Email queue processed successfully', data);
      toast({
        title: "Queue Processed",
        description: `Processed ${data.processed || 0} emails from queue.`,
      });
      
      return { success: true, data };
      
    } catch (error: any) {
      logger.error('Email queue processing error', { error: error.message });
      toast({
        title: "Processing Error",
        description: "Failed to process email queue.",
        variant: "destructive",
      });
      return { success: false, error: error.message };
    } finally {
      setIsProcessing(false);
    }
  };

  const checkEmailQueue = async () => {
    try {
      const { data: queueItems, error } = await supabase
        .from('email_notifications_queue')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        logger.error('Failed to check email queue', { error: error.message });
        return { success: false, error: error.message };
      }

      return { success: true, data: queueItems };
    } catch (error: any) {
      logger.error('Email queue check error', { error: error.message });
      return { success: false, error: error.message };
    }
  };

  return {
    processEmailQueue,
    checkEmailQueue,
    isProcessing
  };
}
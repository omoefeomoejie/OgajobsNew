import { supabase } from '@/integrations/supabase/client';

export async function sendNotification(
  recipientUserId: string,
  title: string,
  message: string,
  type: string = 'system'
): Promise<void> {
  try {
    await supabase.functions.invoke('send-notification', {
      body: {
        userId: recipientUserId,
        type: 'in_app',
        template: type,
        data: { title, message, type }
      }
    });
  } catch (_) {
    // Non-fatal
  }
}

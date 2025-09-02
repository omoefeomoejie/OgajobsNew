import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailQueueItem {
  id: string;
  user_id: string;
  user_email: string;
  template: string;
  data: any;
  status: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get pending emails from queue
    const { data: pendingEmails, error: fetchError } = await supabase
      .from('email_notifications_queue')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(10);

    if (fetchError) {
      console.error('Error fetching pending emails:', fetchError);
      return new Response(JSON.stringify({ error: fetchError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    const results = [];

    for (const email of pendingEmails || []) {
      try {
        // Call send-notification function for each email
        const { data: sendResult, error: sendError } = await supabase.functions.invoke('send-notification', {
          body: {
            userId: email.user_id,
            userEmail: email.user_email,
            type: 'email',
            template: email.template,
            data: email.data,
            priority: 'normal'
          }
        });

        if (sendError) {
          console.error('Send notification error:', sendError);
          // Update status to failed
          await supabase
            .from('email_notifications_queue')
            .update({ 
              status: 'failed', 
              error_message: sendError.message,
              processed_at: new Date().toISOString() 
            })
            .eq('id', email.id);
        } else {
          console.log('Email sent successfully:', sendResult);
          // Update status to sent
          await supabase
            .from('email_notifications_queue')
            .update({ 
              status: 'sent', 
              processed_at: new Date().toISOString() 
            })
            .eq('id', email.id);
        }

        results.push({
          email_id: email.id,
          user_email: email.user_email,
          status: sendError ? 'failed' : 'sent',
          error: sendError?.message
        });

      } catch (error: any) {
        console.error('Processing error for email:', email.id, error);
        results.push({
          email_id: email.id,
          user_email: email.user_email,
          status: 'failed',
          error: error.message
        });
      }
    }

    return new Response(JSON.stringify({
      processed: results.length,
      results: results
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error: any) {
    console.error('Queue processing error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
};

serve(handler);
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting welcome email fix...');

    // Get all pending emails
    const { data: pendingEmails, error: fetchError } = await supabase
      .from('email_notifications_queue')
      .select('*')
      .eq('status', 'pending');

    if (fetchError) {
      console.error('Error fetching pending emails:', fetchError);
      return new Response(JSON.stringify({ error: fetchError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    console.log(`Found ${pendingEmails?.length || 0} pending emails`);

    const results = [];

    for (const email of pendingEmails || []) {
      try {
        console.log(`Processing email for ${email.user_email}, template: ${email.template}`);

        // Call send-notification function directly
        const { data: sendResult, error: sendError } = await supabase.functions.invoke('send-notification', {
          body: {
            userId: email.user_id,
            userEmail: email.user_email,
            type: 'email',
            template: email.template,
            data: email.template_data,
            priority: 'normal'
          }
        });

        if (sendError) {
          console.error('Send notification error for', email.user_email, ':', sendError);
          // Mark as failed
          await supabase
            .from('email_notifications_queue')
            .update({ 
              status: 'failed', 
              error_message: sendError.message,
              processed_at: new Date().toISOString() 
            })
            .eq('id', email.id);
        } else {
          console.log('Email sent successfully for', email.user_email, ':', sendResult);
          // Mark as sent
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
          template: email.template,
          status: sendError ? 'failed' : 'sent',
          error: sendError?.message
        });

      } catch (error: any) {
        console.error('Processing error for', email.user_email, ':', error);
        results.push({
          email_id: email.id,
          user_email: email.user_email,
          template: email.template,
          status: 'failed',
          error: error.message
        });
      }
    }

    return new Response(JSON.stringify({
      message: 'Welcome email fix completed',
      processed: results.length,
      results: results
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error: any) {
    console.error('Fix welcome emails error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
};

serve(handler);
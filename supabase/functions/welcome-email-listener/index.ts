import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    console.log('Setting up PostgreSQL notification listener for welcome emails...');

    // Set up PostgreSQL listener for welcome email notifications
    const channel = supabase.channel('welcome-email-notifications');
    
    channel.on('postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table: 'email_notifications_queue' 
      },
      async (payload) => {
        console.log('Received welcome email notification:', payload);
        
        if (payload.eventType === 'INSERT') {
          const notification = payload.new;
          
          try {
            // Call send-notification function
            const { data, error } = await supabase.functions.invoke('send-notification', {
              body: {
                userId: notification.user_id,
                userEmail: notification.user_email,
                type: 'email',
                template: notification.template,
                data: notification.template_data,
                priority: 'normal'
              }
            });

            if (error) {
              console.error('Error sending welcome email:', error);
              
              // Update queue item with error
              await supabase
                .from('email_notifications_queue')
                .update({
                  status: 'failed',
                  error_message: error.message,
                  processed_at: new Date().toISOString()
                })
                .eq('id', notification.id);
            } else {
              console.log('Welcome email sent successfully:', data);
              
              // Update queue item as processed
              await supabase
                .from('email_notifications_queue')
                .update({
                  status: 'sent',
                  processed_at: new Date().toISOString()
                })
                .eq('id', notification.id);
            }
          } catch (error: any) {
            console.error('Exception sending welcome email:', error);
            
            // Update queue item with error
            await supabase
              .from('email_notifications_queue')
              .update({
                status: 'failed',
                error_message: error.message,
                processed_at: new Date().toISOString()
              })
              .eq('id', notification.id);
          }
        }
      }
    );

    // Subscribe to the channel
    await channel.subscribe();

    console.log('Welcome email listener started and subscribed to notifications');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Welcome email listener is active',
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('Error in welcome email listener:', error);
    return new Response(
      JSON.stringify({
        error: error.message,
        success: false,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
};

serve(handler);
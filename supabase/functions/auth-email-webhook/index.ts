import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AuthWebhookPayload {
  type: string;
  table: string;
  record: any;
  schema: string;
  old_record?: any;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload: AuthWebhookPayload = await req.json();
    
    console.log('Auth webhook received:', {
      type: payload.type,
      table: payload.table,
      recordId: payload.record?.id
    });

    // Handle different auth events
    if (payload.table === 'auth.users') {
      await handleAuthUserEvent(payload, supabase);
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Auth webhook processed' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('Auth webhook error:', error);
    return new Response(
      JSON.stringify({ error: error.message, success: false }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
};

async function handleAuthUserEvent(payload: AuthWebhookPayload, supabase: any) {
  const user = payload.record;
  const oldUser = payload.old_record;
  
  console.log(`Handling auth event: ${payload.type} for user: ${user?.email}`);

  try {
    // Determine email template and data based on the event
    let template = '';
    let emailData: Record<string, any> = {};

    // Handle different auth events
    if (payload.type === 'INSERT' && user?.email_confirmed_at) {
      // User signup with email confirmation
      template = 'auth_signup_confirmation';
      emailData = {
        confirm_url: `${Deno.env.get('SUPABASE_URL')?.replace('/rest/v1', '')}/auth/confirm?token=${user.confirmation_token}`,
        user_email: user.email,
        full_name: user.user_metadata?.full_name || 'User'
      };
    } else if (payload.type === 'UPDATE' && user?.recovery_sent_at && user?.recovery_sent_at !== oldUser?.recovery_sent_at) {
      // Password reset requested
      template = 'auth_password_reset';
      emailData = {
        reset_url: `${Deno.env.get('SUPABASE_URL')?.replace('/rest/v1', '')}/auth/confirm?token=${user.recovery_token}&type=recovery`,
        user_email: user.email,
        expires_in: '1 hour'
      };
    } else if (payload.type === 'UPDATE' && user?.email_change_sent_at && user?.email_change_sent_at !== oldUser?.email_change_sent_at) {
      // Email change confirmation
      template = 'auth_email_change';
      emailData = {
        confirm_url: `${Deno.env.get('SUPABASE_URL')?.replace('/rest/v1', '')}/auth/confirm?token=${user.email_change_token}&type=email_change`,
        user_email: user.new_email || user.email,
        old_email: user.email
      };
    } else if (payload.type === 'UPDATE' && user?.reauthentication_sent_at && user?.reauthentication_sent_at !== oldUser?.reauthentication_sent_at) {
      // Reauthentication code
      template = 'auth_reauthentication';
      emailData = {
        verification_code: user.reauthentication_token,
        user_email: user.email
      };
    } else if (payload.type === 'INSERT' && !user?.email_confirmed_at) {
      // Magic link login
      template = 'auth_magic_link';
      emailData = {
        magic_link: `${Deno.env.get('SUPABASE_URL')?.replace('/rest/v1', '')}/auth/confirm?token=${user.confirmation_token}&type=magiclink`,
        user_email: user.email
      };
    }

    // Send email if we have a template
    if (template) {
      const { error } = await supabase.functions.invoke('send-notification', {
        body: {
          userEmail: user.email,
          type: 'email',
          template: template,
          data: emailData
        }
      });

      if (error) {
        console.error('Error sending auth email:', error);
      } else {
        console.log(`Auth email sent: ${template} to ${user.email}`);
      }
    }

  } catch (error) {
    console.error('Error handling auth user event:', error);
  }
}

serve(handler);
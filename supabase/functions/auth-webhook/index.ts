import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AuthWebhookPayload {
  type: string
  table: string
  record: any
  schema: string
  old_record?: any
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const payload: AuthWebhookPayload = await req.json()
    console.log('Auth webhook received:', payload.type)

    // Only handle user signup events
    if (payload.type === 'INSERT' && payload.table === 'users') {
      const user = payload.record
      console.log('New user signup detected:', user.email)

      // Create Supabase client
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      const supabase = createClient(supabaseUrl, supabaseServiceKey)

      // Get user metadata
      const userData = user.raw_user_meta_data || {}
      const fullName = userData.full_name || 'User'
      const role = userData.role || 'client'

      // Send branded email confirmation via send-notification function
      const { data, error } = await supabase.functions.invoke('send-notification', {
        body: {
          type: 'email',
          to: user.email,
          template: 'email_confirmation',
          subject: 'Confirm Your OgaJobs Account',
          data: {
            confirmUrl: `${supabaseUrl}/auth/v1/verify?token=${user.confirmation_token}&type=signup&redirect_to=${Deno.env.get('APP_URL') || 'https://lovable.dev'}`,
            userEmail: user.email,
            fullName: fullName,
            appUrl: Deno.env.get('APP_URL') || 'https://lovable.dev'
          }
        }
      })

      if (error) {
        console.error('Failed to send confirmation email:', error)
        return new Response(
          JSON.stringify({ error: 'Failed to send confirmation email' }),
          { 
            status: 500, 
            headers: { 'Content-Type': 'application/json', ...corsHeaders } 
          }
        )
      }

      console.log('Branded confirmation email sent successfully to:', user.email)
      
      return new Response(
        JSON.stringify({ success: true, message: 'Confirmation email sent' }),
        { 
          status: 200, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      )
    }

    // For other webhook types, just return success
    return new Response(
      JSON.stringify({ success: true, message: 'Webhook processed' }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    )

  } catch (error: any) {
    console.error('Auth webhook error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    )
  }
})
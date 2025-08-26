import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'GET') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Get the Sentry DSN from Supabase secrets
    const sentryDsn = Deno.env.get('SENTRY_DSN');
    
    if (!sentryDsn) {
      console.log('No Sentry DSN configured');
      return new Response(
        JSON.stringify({ dsn: null, enabled: false }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Sentry DSN retrieved successfully');
    
    return new Response(
      JSON.stringify({ 
        dsn: sentryDsn, 
        enabled: true,
        environment: Deno.env.get('SUPABASE_ENV') || 'production'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error retrieving Sentry DSN:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to retrieve Sentry configuration',
        dsn: null,
        enabled: false 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // This function will be called by the database trigger via pg_notify
    // We need to listen for notifications and trigger AI responses
    
    const { session_id, message, customer_name } = await req.json();

    console.log(`Triggering AI response for session: ${session_id}`);

    // Call the AI response function
    const aiResponse = await fetch(`${supabaseUrl}/functions/v1/ai-chat-response`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        session_id,
        message,
        customer_name,
      }),
    });

    if (!aiResponse.ok) {
      console.error('AI response function failed:', await aiResponse.text());
      throw new Error('AI response function failed');
    }

    const result = await aiResponse.json();
    console.log('AI response result:', result);

    return new Response(JSON.stringify({ success: true, result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error triggering AI response:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
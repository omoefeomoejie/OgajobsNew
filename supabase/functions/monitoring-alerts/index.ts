import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Alert {
  type: 'error_rate' | 'response_time' | 'db_performance' | 'custom';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  metadata?: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const alert: Alert = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Store alert in security_events table
    const { error } = await supabase
      .from('security_events')
      .insert({
        event_type: `monitoring_alert_${alert.type}`,
        event_details: {
          alert_type: alert.type,
          message: alert.message,
          metadata: alert.metadata || {},
          timestamp: new Date().toISOString()
        },
        severity: alert.severity
      });

    if (error) {
      throw error;
    }

    // For critical alerts, could trigger additional notifications
    if (alert.severity === 'critical') {
      console.log('CRITICAL ALERT:', alert.message);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Alert processed successfully',
        alert_id: crypto.randomUUID()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Monitoring alerts error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
})
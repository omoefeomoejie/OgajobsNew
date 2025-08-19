import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Create Supabase client with service role key for logging
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    {
      auth: { persistSession: false }
    }
  );

  try {
    // Get user context if available
    let userId = null;
    let userEmail = null;
    
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      try {
        const { data: { user } } = await supabaseClient.auth.getUser(
          authHeader.replace("Bearer ", "")
        );
        userId = user?.id || null;
        userEmail = user?.email || null;
      } catch {
        // Continue without user context if auth fails
      }
    }

    const { eventType, details, severity, timestamp } = await req.json();

    if (!eventType) {
      throw new Error("Event type is required");
    }

    // Enhanced details with request context
    const enhancedDetails = {
      ...details,
      userAgent: req.headers.get("User-Agent"),
      ip: req.headers.get("X-Forwarded-For") || req.headers.get("X-Real-IP"),
      referer: req.headers.get("Referer"),
      timestamp: timestamp || new Date().toISOString()
    };

    // Log to security events table
    const { error: logError } = await supabaseClient
      .from("security_events")
      .insert({
        event_type: eventType,
        user_id: userId,
        event_details: enhancedDetails,
        severity: severity || 'medium',
        created_at: new Date().toISOString()
      });

    if (logError) {
      console.error("Failed to log security event:", logError);
      throw new Error("Failed to log security event");
    }

    // For critical events, trigger additional alerts
    if (severity === 'critical') {
      // Could integrate with external monitoring services here
      console.warn(`CRITICAL SECURITY EVENT: ${eventType}`, enhancedDetails);
      
      // Log to admin notification system
      try {
        await supabaseClient
          .from("admin_messages")
          .insert({
            message: `Critical security event detected: ${eventType}`,
            target_group: 'security_team',
            sender_email: 'system@ogajobs.com',
            created_at: new Date().toISOString()
          });
      } catch (adminLogError) {
        console.error("Failed to create admin notification:", adminLogError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Security event logged successfully",
        eventId: `${eventType}_${Date.now()}`
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Security logging error:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Failed to log security event",
        success: false 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
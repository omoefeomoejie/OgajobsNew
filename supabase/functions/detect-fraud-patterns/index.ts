import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FraudDetectionRequest {
  scan_type: 'full' | 'incremental';
  lookback_days: number;
  user_id?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { scan_type, lookback_days, user_id }: FraudDetectionRequest = await req.json();

    // Get user activity data
    const { data: users, error: usersError } = await supabaseClient
      .from('profiles')
      .select('id, email, created_at');

    if (usersError) throw usersError;

    // Get booking patterns
    const { data: bookings, error: bookingsError } = await supabaseClient
      .from('bookings')
      .select('id, client_email, created_at, status, budget')
      .gte('created_at', new Date(Date.now() - lookback_days * 24 * 60 * 60 * 1000).toISOString());

    if (bookingsError) throw bookingsError;

    const alerts_generated = await detectSuspiciousPatterns(supabaseClient, users, bookings);

    return new Response(
      JSON.stringify({ 
        success: true, 
        alerts_generated,
        scan_type,
        processed_users: users?.length || 0
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Fraud detection error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

async function detectSuspiciousPatterns(supabaseClient: any, users: any[], bookings: any[]) {
  let alertsCount = 0;

  for (const user of users || []) {
    const userBookings = bookings?.filter(b => b.client_email === user.email) || [];
    
    // Pattern 1: Rapid booking creation
    if (userBookings.length > 10) {
      await createFraudAlert(supabaseClient, user, {
        fraud_type: 'rapid_booking_creation',
        risk_score: 75,
        description: `User created ${userBookings.length} bookings in ${lookback_days} days`,
        metadata: { booking_count: userBookings.length }
      });
      alertsCount++;
    }

    // Pattern 2: High-value booking anomaly
    const avgBudget = userBookings.reduce((sum, b) => sum + (b.budget || 0), 0) / userBookings.length;
    const highValueBookings = userBookings.filter(b => (b.budget || 0) > avgBudget * 5);
    
    if (highValueBookings.length > 0) {
      await createFraudAlert(supabaseClient, user, {
        fraud_type: 'high_value_anomaly',
        risk_score: 60,
        description: `User has ${highValueBookings.length} unusually high-value bookings`,
        metadata: { high_value_count: highValueBookings.length, avg_budget: avgBudget }
      });
      alertsCount++;
    }

    // Pattern 3: Account creation then immediate high activity
    const accountAge = Date.now() - new Date(user.created_at).getTime();
    const ageDays = accountAge / (24 * 60 * 60 * 1000);
    
    if (ageDays < 7 && userBookings.length > 5) {
      await createFraudAlert(supabaseClient, user, {
        fraud_type: 'new_account_high_activity',
        risk_score: 85,
        description: `New account (${Math.round(ageDays)} days old) with ${userBookings.length} bookings`,
        metadata: { account_age_days: ageDays, booking_count: userBookings.length }
      });
      alertsCount++;
    }
  }

  return alertsCount;
}

async function createFraudAlert(supabaseClient: any, user: any, alertData: any) {
  const { error } = await supabaseClient
    .from('fraud_alerts')
    .insert({
      user_id: user.id,
      user_email: user.email,
      fraud_type: alertData.fraud_type,
      risk_score: alertData.risk_score,
      description: alertData.description,
      metadata: alertData.metadata,
      status: 'pending'
    });

  if (error) {
    console.error('Error creating fraud alert:', error);
  }
}
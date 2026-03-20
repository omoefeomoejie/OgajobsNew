import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChurnPredictionRequest {
  risk_threshold?: number;
  include_recommendations?: boolean;
  user_type?: 'client' | 'artisan';
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

    const { 
      risk_threshold = 0.3, 
      include_recommendations = true,
      user_type 
    }: ChurnPredictionRequest = await req.json();

    // Get user profiles
    const { data: profiles, error: profilesError } = await supabaseClient
      .from('profiles')
      .select('id, email, role, created_at');

    if (profilesError) throw profilesError;

    // Get booking activity
    const { data: bookings, error: bookingsError } = await supabaseClient
      .from('bookings')
      .select('client_email, artisan_email, created_at, status, budget');

    if (bookingsError) throw bookingsError;

    // Get client data
    const { data: clients, error: clientsError } = await supabaseClient
      .from('clients')
      .select('email, created_at');

    if (clientsError) throw clientsError;

    // Get artisan data
    const { data: artisans, error: artisansError } = await supabaseClient
      .from('artisans')
      .select('email, created_at');

    if (artisansError) throw artisansError;

    const predictions = await generateChurnPredictions(
      supabaseClient,
      profiles || [],
      bookings || [],
      clients || [],
      artisans || [],
      risk_threshold,
      include_recommendations,
      user_type
    );

    return new Response(
      JSON.stringify({ 
        success: true, 
        predictions,
        total_analyzed: profiles?.length || 0,
        high_risk_count: predictions.filter(p => p.risk_level === 'high' || p.risk_level === 'critical').length
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Churn prediction error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

async function generateChurnPredictions(
  supabaseClient: any,
  profiles: any[],
  bookings: any[],
  clients: any[],
  artisans: any[],
  riskThreshold: number,
  includeRecommendations: boolean,
  userType?: string
) {
  const predictions = [];

  for (const profile of profiles) {
    // Skip if filtering by user type and doesn't match
    if (userType && profile.role !== userType) continue;

    const userBookings = bookings.filter(b => 
      b.client_email === profile.email || b.artisan_email === profile.email
    );

    // Calculate churn indicators
    const indicators = calculateChurnIndicators(profile, userBookings, clients, artisans);
    const churnProbability = calculateChurnProbability(indicators);
    const riskLevel = getRiskLevel(churnProbability);

    // Only include if above risk threshold
    if (churnProbability >= riskThreshold) {
      const prediction = {
        user_id: profile.id,
        user_email: profile.email,
        user_type: profile.role,
        churn_probability: Math.round(churnProbability * 100),
        risk_level: riskLevel,
        key_indicators: indicators.warningSignals,
        last_activity: indicators.lastActivity,
        predicted_churn_date: calculateChurnDate(churnProbability),
        retention_strategies: includeRecommendations ? 
          generateRetentionStrategies(indicators, profile.role) : [],
        value_at_risk: calculateValueAtRisk(userBookings, profile.role)
      };

      // Store in database
      await supabaseClient
        .from('churn_predictions')
        .upsert({
          user_id: profile.id,
          user_type: profile.role,
          churn_probability: prediction.churn_probability,
          risk_level: prediction.risk_level,
          key_indicators: prediction.key_indicators,
          last_activity: prediction.last_activity,
          predicted_churn_date: prediction.predicted_churn_date,
          retention_strategies: prediction.retention_strategies,
          value_at_risk: prediction.value_at_risk
        }, { onConflict: 'user_id' });

      predictions.push(prediction);
    }
  }

  return predictions;
}

function calculateChurnIndicators(profile: any, userBookings: any[], clients: any[], artisans: any[]) {
  const now = new Date();
  const daysSinceLastBooking = userBookings.length > 0 ? 
    Math.floor((now.getTime() - new Date(Math.max(...userBookings.map(b => new Date(b.created_at).getTime()))).getTime()) / (1000 * 60 * 60 * 24)) : 
    999;

  const accountAge = Math.floor((now.getTime() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24));
  const bookingFrequency = userBookings.length / Math.max(accountAge / 30, 1); // bookings per month
  const lastActivity = userBookings.length > 0 ? 
    new Date(Math.max(...userBookings.map(b => new Date(b.created_at).getTime()))).toISOString() :
    profile.created_at;

  const warningSignals = [];
  
  // Days since last booking
  if (daysSinceLastBooking > 60) warningSignals.push('No activity for 60+ days');
  if (daysSinceLastBooking > 30) warningSignals.push('No activity for 30+ days');
  
  // Low engagement
  if (bookingFrequency < 0.5) warningSignals.push('Low booking frequency');
  if (userBookings.length === 0) warningSignals.push('No completed transactions');
  
  // Negative patterns
  const cancelledBookings = userBookings.filter(b => b.status === 'cancelled').length;
  if (cancelledBookings / Math.max(userBookings.length, 1) > 0.3) {
    warningSignals.push('High cancellation rate');
  }

  return {
    daysSinceLastBooking,
    accountAge,
    bookingFrequency,
    lastActivity,
    warningSignals,
    totalBookings: userBookings.length,
    cancelledBookings
  };
}

function calculateChurnProbability(indicators: any): number {
  let probability = 0;

  // Days since last booking (40% weight)
  if (indicators.daysSinceLastBooking > 90) probability += 0.4;
  else if (indicators.daysSinceLastBooking > 60) probability += 0.3;
  else if (indicators.daysSinceLastBooking > 30) probability += 0.2;
  else if (indicators.daysSinceLastBooking > 14) probability += 0.1;

  // Booking frequency (30% weight)
  if (indicators.bookingFrequency < 0.1) probability += 0.3;
  else if (indicators.bookingFrequency < 0.5) probability += 0.2;
  else if (indicators.bookingFrequency < 1) probability += 0.1;

  // Account patterns (30% weight)
  if (indicators.totalBookings === 0) probability += 0.3;
  else if (indicators.totalBookings < 3) probability += 0.15;
  
  if (indicators.cancelledBookings / Math.max(indicators.totalBookings, 1) > 0.5) probability += 0.15;

  return Math.min(probability, 1);
}

function getRiskLevel(probability: number): string {
  if (probability >= 0.8) return 'critical';
  if (probability >= 0.6) return 'high';
  if (probability >= 0.3) return 'medium';
  return 'low';
}

function calculateChurnDate(probability: number): string {
  const daysToChurn = Math.round((1 - probability) * 90 + 7); // 7-90 days based on probability
  const churnDate = new Date();
  churnDate.setDate(churnDate.getDate() + daysToChurn);
  return churnDate.toISOString().split('T')[0];
}

function generateRetentionStrategies(indicators: any, userType: string): string[] {
  const strategies = [];

  if (indicators.daysSinceLastBooking > 30) {
    strategies.push('Send re-engagement email campaign');
    strategies.push('Offer special discount or promotion');
  }

  if (indicators.bookingFrequency < 0.5) {
    if (userType === 'client') {
      strategies.push('Personalized service recommendations');
      strategies.push('Improve booking experience');
    } else {
      strategies.push('Provide additional training resources');
      strategies.push('Improve job matching algorithm');
    }
  }

  if (indicators.totalBookings === 0) {
    strategies.push('Onboarding improvement program');
    strategies.push('Personal assistance for first booking');
  }

  if (indicators.cancelledBookings > 2) {
    strategies.push('Investigate service quality issues');
    strategies.push('Improve communication features');
  }

  return strategies;
}

function calculateValueAtRisk(bookings: any[], userType: string): number {
  if (bookings.length === 0) return 0;

  const totalValue = bookings.reduce((sum, b) => sum + (b.budget || 0), 0);
  const avgMonthlyValue = totalValue / Math.max(bookings.length / 12, 1); // Rough monthly estimate
  
  // Estimate potential lost revenue over next 12 months
  return Math.round(avgMonthlyValue * 12);
}
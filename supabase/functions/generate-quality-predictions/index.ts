import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface QualityPredictionRequest {
  category?: string;
  limit?: number;
  artisan_id?: string;
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

    const { category, limit = 50, artisan_id }: QualityPredictionRequest = await req.json();

    // Get artisan data with their performance history
    let query = supabaseClient
      .from('artisans')
      .select(`
        id, 
        full_name, 
        email, 
        category, 
        created_at,
        profiles!inner(id, email)
      `)
      .eq('suspended', false);

    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    if (artisan_id) {
      query = query.eq('id', artisan_id);
    }

    const { data: artisans, error: artisansError } = await query.limit(limit);

    if (artisansError) throw artisansError;

    // Get reviews for rating calculations
    const { data: reviews, error: reviewsError } = await supabaseClient
      .from('artisan_reviews')
      .select('artisan_id, rating, created_at');

    if (reviewsError) throw reviewsError;

    // Get booking completion data
    const { data: bookings, error: bookingsError } = await supabaseClient
      .from('bookings')
      .select('artisan_id, status, created_at, preferred_date')
      .not('artisan_id', 'is', null);

    if (bookingsError) throw bookingsError;

    const predictions = await generateQualityPredictions(supabaseClient, artisans || [], reviews || [], bookings || []);

    return new Response(
      JSON.stringify({ 
        success: true, 
        predictions,
        total_artisans: artisans?.length || 0
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Quality prediction error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

async function generateQualityPredictions(supabaseClient: any, artisans: any[], reviews: any[], bookings: any[]) {
  const predictions = [];

  for (const artisan of artisans) {
    // Calculate historical performance
    const artisanReviews = reviews.filter(r => r.artisan_id === artisan.id);
    const artisanBookings = bookings.filter(b => b.artisan_id === artisan.id);
    
    const avgRating = artisanReviews.length > 0 
      ? artisanReviews.reduce((sum, r) => sum + r.rating, 0) / artisanReviews.length 
      : 0;

    const completedBookings = artisanBookings.filter(b => b.status === 'completed');
    const completionRate = artisanBookings.length > 0 
      ? (completedBookings.length / artisanBookings.length) * 100 
      : 0;

    // Calculate on-time rate (simplified)
    const onTimeBookings = completedBookings.filter(b => {
      const createdDate = new Date(b.created_at);
      const preferredDate = new Date(b.preferred_date);
      return createdDate <= preferredDate;
    });
    const onTimeRate = completedBookings.length > 0 
      ? (onTimeBookings.length / completedBookings.length) * 100 
      : 0;

    // Predict future performance based on trends
    const recentReviews = artisanReviews
      .filter(r => new Date(r.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
      .map(r => r.rating);

    const trendDirection = calculateTrend(recentReviews);
    const qualityScore = calculateQualityScore(avgRating, completionRate, onTimeRate, artisanBookings.length);
    const predictedRating = avgRating + (trendDirection === 'improving' ? 0.2 : trendDirection === 'declining' ? -0.2 : 0);

    // Identify risk factors
    const riskFactors = [];
    if (completionRate < 80) riskFactors.push('Low completion rate');
    if (avgRating < 3.5) riskFactors.push('Below average rating');
    if (onTimeRate < 70) riskFactors.push('Poor punctuality');
    if (artisanBookings.length < 5) riskFactors.push('Limited experience');

    const qualityMetric = {
      artisan_id: artisan.id,
      artisan_name: artisan.full_name,
      artisan_email: artisan.email,
      predicted_rating: Math.min(5, Math.max(0, predictedRating)),
      confidence_score: calculateConfidenceScore(artisanBookings.length, artisanReviews.length),
      completion_probability: completionRate,
      on_time_probability: onTimeRate,
      quality_score: qualityScore,
      risk_factors: riskFactors,
      historical_performance: {
        avg_rating: avgRating,
        completion_rate: completionRate,
        on_time_rate: onTimeRate,
        total_jobs: artisanBookings.length
      },
      trend_direction: trendDirection,
      last_updated: new Date().toISOString()
    };

    // Store in database
    await supabaseClient
      .from('quality_metrics')
      .upsert({
        artisan_id: artisan.id,
        predicted_rating: qualityMetric.predicted_rating,
        confidence_score: qualityMetric.confidence_score,
        completion_probability: qualityMetric.completion_probability,
        on_time_probability: qualityMetric.on_time_probability,
        quality_score: qualityMetric.quality_score,
        risk_factors: qualityMetric.risk_factors,
        trend_direction: qualityMetric.trend_direction
      }, { onConflict: 'artisan_id' });

    predictions.push(qualityMetric);
  }

  return predictions;
}

function calculateTrend(recentRatings: number[]): 'improving' | 'declining' | 'stable' {
  if (recentRatings.length < 3) return 'stable';
  
  const firstHalf = recentRatings.slice(0, Math.floor(recentRatings.length / 2));
  const secondHalf = recentRatings.slice(Math.floor(recentRatings.length / 2));
  
  const firstAvg = firstHalf.reduce((sum, r) => sum + r, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, r) => sum + r, 0) / secondHalf.length;
  
  if (secondAvg - firstAvg > 0.3) return 'improving';
  if (firstAvg - secondAvg > 0.3) return 'declining';
  return 'stable';
}

function calculateQualityScore(avgRating: number, completionRate: number, onTimeRate: number, totalJobs: number): number {
  const ratingScore = (avgRating / 5) * 40; // 40% weight
  const completionScore = (completionRate / 100) * 30; // 30% weight
  const punctualityScore = (onTimeRate / 100) * 20; // 20% weight
  const experienceScore = Math.min(totalJobs / 10, 1) * 10; // 10% weight
  
  return Math.round(ratingScore + completionScore + punctualityScore + experienceScore);
}

function calculateConfidenceScore(totalJobs: number, totalReviews: number): number {
  const jobConfidence = Math.min(totalJobs / 20, 1) * 50;
  const reviewConfidence = Math.min(totalReviews / 10, 1) * 50;
  return Math.round(jobConfidence + reviewConfidence);
}
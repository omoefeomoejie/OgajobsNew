import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RecommendationRequest {
  filters: {
    location?: string;
    service_category?: string;
    budget_range?: string;
    urgency?: string;
  };
  limit?: number;
  client_id?: string;
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

    const { filters, limit = 20, client_id }: RecommendationRequest = await req.json();

    // Get artisans based on filters
    let query = supabaseClient
      .from('artisans')
      .select(`
        id,
        full_name,
        email,
        category,
        city,
        created_at,
        profiles!inner(id, email)
      `)
      .eq('suspended', false);

    if (filters.service_category) {
      query = query.eq('category', filters.service_category);
    }

    if (filters.location) {
      query = query.ilike('city', `%${filters.location}%`);
    }

    const { data: artisans, error: artisansError } = await query.limit(limit * 2); // Get more to filter

    if (artisansError) throw artisansError;

    // Get reviews for rating calculations
    const { data: reviews, error: reviewsError } = await supabaseClient
      .from('artisan_reviews')
      .select('artisan_id, rating');

    if (reviewsError) throw reviewsError;

    // Get service pricing for estimates
    const { data: pricing, error: pricingError } = await supabaseClient
      .from('service_pricing')
      .select('service_category, city, recommended_price, min_price, max_price');

    if (pricingError) throw pricingError;

    // Generate recommendations
    const recommendations = await generateArtisanRecommendations(
      supabaseClient,
      artisans || [],
      reviews || [],
      pricing || [],
      filters,
      client_id
    );

    // Limit final results
    const limitedRecommendations = recommendations
      .sort((a, b) => b.match_score - a.match_score)
      .slice(0, limit);

    return new Response(
      JSON.stringify({ 
        success: true, 
        recommendations: limitedRecommendations,
        total_found: recommendations.length
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Recommendation error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

async function generateArtisanRecommendations(
  supabaseClient: any,
  artisans: any[],
  reviews: any[],
  pricing: any[],
  filters: any,
  client_id?: string
) {
  const recommendations = [];

  for (const artisan of artisans) {
    // Calculate rating
    const artisanReviews = reviews.filter(r => r.artisan_id === artisan.id);
    const rating = artisanReviews.length > 0 
      ? artisanReviews.reduce((sum, r) => sum + r.rating, 0) / artisanReviews.length 
      : 4.0;

    // Get price estimate
    const relevantPricing = pricing.find(p => 
      p.service_category.toLowerCase() === artisan.category?.toLowerCase() &&
      p.city.toLowerCase() === artisan.city?.toLowerCase()
    );
    const priceEstimate = relevantPricing?.recommended_price || 15000;

    // Calculate distance (mock for now)
    const distance = Math.random() * 50 + 1;

    // Calculate match score
    const matchScore = calculateMatchScore({
      categoryMatch: filters.service_category ? 
        (filters.service_category === artisan.category ? 100 : 0) : 80,
      locationMatch: filters.location ? 
        (artisan.city?.toLowerCase().includes(filters.location.toLowerCase()) ? 100 : 50) : 80,
      rating: rating,
      experience: Math.min(artisanReviews.length * 10, 100),
      distance: distance
    });

    // Calculate availability score (simplified)
    const availabilityScore = 75 + Math.random() * 25;

    // Calculate booking probability
    const bookingProbability = Math.min(
      (matchScore * 0.6) + (rating * 10) + (availabilityScore * 0.3),
      100
    );

    // Generate recommendation reasons
    const reasons = [];
    if (rating >= 4.5) reasons.push('Highly rated');
    if (artisanReviews.length >= 10) reasons.push('Experienced');
    if (distance <= 10) reasons.push('Nearby location');
    if (filters.service_category === artisan.category) reasons.push('Category expert');
    if (availabilityScore >= 80) reasons.push('Good availability');

    const recommendation = {
      artisan_id: artisan.id,
      artisan_name: artisan.full_name,
      artisan_email: artisan.email,
      service_category: artisan.category || 'General',
      match_score: Math.round(matchScore),
      distance_km: Math.round(distance * 10) / 10,
      rating: Math.round(rating * 10) / 10,
      price_estimate: priceEstimate,
      availability_score: Math.round(availabilityScore),
      experience_years: Math.floor(artisanReviews.length / 5) + 1,
      recommendation_reasons: reasons,
      booking_probability: Math.round(bookingProbability)
    };

    // Store recommendation in database if client_id provided
    if (client_id) {
      await supabaseClient
        .from('artisan_recommendations')
        .insert({
          client_id: client_id,
          artisan_id: artisan.id,
          service_category: recommendation.service_category,
          match_score: recommendation.match_score,
          distance_km: recommendation.distance_km,
          price_estimate: recommendation.price_estimate,
          availability_score: recommendation.availability_score,
          booking_probability: recommendation.booking_probability,
          recommendation_reasons: recommendation.recommendation_reasons
        });
    }

    recommendations.push(recommendation);
  }

  return recommendations;
}

function calculateMatchScore(factors: {
  categoryMatch: number;
  locationMatch: number;
  rating: number;
  experience: number;
  distance: number;
}): number {
  const categoryWeight = 0.3;
  const locationWeight = 0.25;
  const ratingWeight = 0.2;
  const experienceWeight = 0.15;
  const distanceWeight = 0.1;

  const distanceScore = Math.max(0, 100 - (factors.distance * 2));
  const ratingScore = (factors.rating / 5) * 100;

  return (
    factors.categoryMatch * categoryWeight +
    factors.locationMatch * locationWeight +
    ratingScore * ratingWeight +
    factors.experience * experienceWeight +
    distanceScore * distanceWeight
  );
}
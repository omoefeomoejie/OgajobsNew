import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SearchRequest {
  query: string;
  filters?: {
    category?: string;
    city?: string;
    min_rating?: number;
    max_price?: number;
    verified?: boolean;
  };
  user_preferences?: {
    preferred_categories?: string[];
    budget_range?: { min: number; max: number };
    location?: string;
  };
  limit?: number;
}

interface SimilarityScore {
  artisan_id: string;
  similarity_score: number;
  match_reasons: string[];
}

interface RecommendationResult {
  artisan: any;
  score: number;
  reasons: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { query, filters, user_preferences, limit = 20 }: SearchRequest = await req.json()

    // Get all artisans with basic filtering
    let artisansQuery = supabaseClient
      .from('artisans')
      .select(`
        *,
        artisan_reviews(rating, review),
        bookings(status, completion_date)
      `)
      .eq('suspended', false)

    // Apply basic filters
    if (filters?.category) {
      artisansQuery = artisansQuery.eq('category', filters.category)
    }
    
    if (filters?.city) {
      artisansQuery = artisansQuery.eq('city', filters.city)
    }

    if (filters?.verified) {
      // In a real implementation, you'd have a verified column
      // artisansQuery = artisansQuery.eq('verified', true)
    }

    const { data: artisans, error: artisansError } = await artisansQuery.limit(100)

    if (artisansError) {
      throw new Error(`Failed to fetch artisans: ${artisansError.message}`)
    }

    // Calculate enhanced artisan data with AI scoring
    const enhancedArtisans = artisans.map(artisan => {
      // Calculate average rating
      const ratings = artisan.artisan_reviews?.map((r: any) => r.rating).filter((r: any) => r) || []
      const avgRating = ratings.length > 0 ? ratings.reduce((a: number, b: number) => a + b) / ratings.length : 0

      // Calculate completion rate
      const allBookings = artisan.bookings || []
      const completedBookings = allBookings.filter((b: any) => b.status === 'completed')
      const completionRate = allBookings.length > 0 ? completedBookings.length / allBookings.length : 0

      // Calculate AI similarity score
      const similarityScore = calculateSimilarityScore(artisan, query, user_preferences)

      return {
        ...artisan,
        calculated_rating: avgRating,
        reviews_count: ratings.length,
        completion_rate: completionRate,
        total_jobs: allBookings.length,
        ai_similarity_score: similarityScore.score,
        match_reasons: similarityScore.reasons
      }
    })

    // Apply rating filter
    let filteredArtisans = enhancedArtisans
    if (filters?.min_rating) {
      filteredArtisans = filteredArtisans.filter(a => a.calculated_rating >= filters.min_rating!)
    }

    // Sort by AI similarity score and relevance
    filteredArtisans.sort((a, b) => {
      // Primary sort: AI similarity score
      if (b.ai_similarity_score !== a.ai_similarity_score) {
        return b.ai_similarity_score - a.ai_similarity_score
      }
      
      // Secondary sort: rating
      if (b.calculated_rating !== a.calculated_rating) {
        return b.calculated_rating - a.calculated_rating
      }
      
      // Tertiary sort: completion rate
      return b.completion_rate - a.completion_rate
    })

    // Generate AI recommendations for top results
    const recommendations = generateAIRecommendations(filteredArtisans.slice(0, 10), user_preferences)

    // Prepare response
    const results = filteredArtisans.slice(0, limit).map(artisan => ({
      id: artisan.id,
      full_name: artisan.full_name,
      email: artisan.email,
      phone: artisan.phone,
      skill: artisan.skill,
      category: artisan.category,
      city: artisan.city,
      photo_url: artisan.photo_url,
      profile_url: artisan.profile_url,
      rating: artisan.calculated_rating,
      reviews_count: artisan.reviews_count,
      completion_rate: artisan.completion_rate,
      total_jobs: artisan.total_jobs,
      ai_score: artisan.ai_similarity_score,
      match_reasons: artisan.match_reasons,
      created_at: artisan.created_at
    }))

    // Track search analytics
    await trackSearchAnalytics(supabaseClient, {
      query,
      filters,
      results_count: results.length,
      user_preferences
    })

    return new Response(
      JSON.stringify({
        success: true,
        results,
        recommendations,
        total_count: filteredArtisans.length,
        search_metadata: {
          query,
          filters_applied: Object.keys(filters || {}),
          ai_enhanced: true
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error in AI search function:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})

function calculateSimilarityScore(artisan: any, query: string, userPreferences: any): { score: number; reasons: string[] } {
  let score = 0
  const reasons: string[] = []
  
  const searchTerms = query.toLowerCase().split(' ')
  
  // Text similarity scoring
  const artisanText = [
    artisan.full_name,
    artisan.skill,
    artisan.category,
    artisan.city
  ].join(' ').toLowerCase()

  let textMatches = 0
  searchTerms.forEach(term => {
    if (artisanText.includes(term)) {
      textMatches++
      score += 10
    }
  })

  if (textMatches > 0) {
    reasons.push(`Matches ${textMatches} search term(s)`)
  }

  // Category preference matching
  if (userPreferences?.preferred_categories?.includes(artisan.category)) {
    score += 15
    reasons.push('Matches your preferred category')
  }

  // Location preference matching
  if (userPreferences?.location === artisan.city) {
    score += 10
    reasons.push('Located in your preferred area')
  }

  // Experience and quality factors
  if (artisan.calculated_rating && artisan.calculated_rating >= 4.5) {
    score += 8
    reasons.push('Highly rated professional')
  }

  if (artisan.total_jobs && artisan.total_jobs >= 50) {
    score += 5
    reasons.push('Experienced with many completed jobs')
  }

  if (artisan.completion_rate && artisan.completion_rate >= 0.9) {
    score += 5
    reasons.push('High job completion rate')
  }

  // Normalize score to 0-100 range
  const normalizedScore = Math.min(100, Math.max(0, score))
  
  return { score: normalizedScore, reasons }
}

function generateAIRecommendations(topArtisans: any[], userPreferences: any): RecommendationResult[] {
  return topArtisans.slice(0, 3).map(artisan => {
    const reasons: string[] = []
    let recommendationScore = artisan.ai_similarity_score

    // Add specific recommendation reasons
    if (artisan.calculated_rating >= 4.8) {
      reasons.push('Top-rated professional in their category')
      recommendationScore += 5
    }

    if (artisan.completion_rate >= 0.95) {
      reasons.push('Exceptional track record of completing jobs')
      recommendationScore += 3
    }

    if (artisan.reviews_count >= 20) {
      reasons.push('Well-reviewed with many satisfied customers')
      recommendationScore += 2
    }

    // Budget compatibility
    if (userPreferences?.budget_range) {
      reasons.push('Matches your budget range')
      recommendationScore += 2
    }

    return {
      artisan,
      score: recommendationScore,
      reasons
    }
  })
}

async function trackSearchAnalytics(supabaseClient: any, searchData: any) {
  try {
    // Create a search analytics record
    const analyticsData = {
      query: searchData.query,
      filters: JSON.stringify(searchData.filters || {}),
      results_count: searchData.results_count,
      user_preferences: JSON.stringify(searchData.user_preferences || {}),
      timestamp: new Date().toISOString()
    }

    // In a real implementation, you'd save this to a search_analytics table
    console.log('Search Analytics:', analyticsData)
    
    // You could also update popular search terms, trending categories, etc.
    
  } catch (error) {
    console.error('Error tracking search analytics:', error)
    // Don't throw error - analytics shouldn't break the search
  }
}
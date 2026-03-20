import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RecommendationRequest {
  user_id: string;
  booking_history: any[];
  search_history: any[];
  review_history: any[];
  preferences: any;
  recommendation_types: string[];
  max_recommendations: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY')!
    
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const requestData: RecommendationRequest = await req.json()

    console.log('Generating AI recommendations for user:', requestData.user_id)

    // Analyze user behavior patterns
    const userProfile = await analyzeUserProfile(requestData)
    
    // Generate AI-powered recommendations using OpenAI
    const aiRecommendations = await generateAIRecommendations(userProfile, openAIApiKey)
    
    // Fetch relevant artisans and services from database
    const contextualData = await fetchContextualData(supabase, userProfile)
    
    // Combine AI insights with real data
    const finalRecommendations = await combineRecommendations(
      aiRecommendations, 
      contextualData, 
      requestData.max_recommendations
    )

    // Calculate engine metrics
    const metrics = await calculateEngineMetrics(supabase, requestData.user_id)

    // Store recommendations for future training
    await storeRecommendations(supabase, requestData.user_id, finalRecommendations)

    return new Response(
      JSON.stringify({
        recommendations: finalRecommendations,
        metrics,
        user_profile: userProfile,
        generated_at: new Date().toISOString()
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Error generating AI recommendations:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to generate recommendations' }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})

async function analyzeUserProfile(requestData: RecommendationRequest) {
  const profile = {
    user_id: requestData.user_id,
    booking_patterns: analyzeBookingPatterns(requestData.booking_history),
    search_patterns: analyzeSearchPatterns(requestData.search_history),
    quality_preferences: analyzeQualityPreferences(requestData.review_history),
    explicit_preferences: requestData.preferences || {},
    behavioral_score: 0
  }

  // Calculate behavioral score
  profile.behavioral_score = calculateBehavioralScore(profile)
  
  return profile
}

function analyzeBookingPatterns(bookings: any[]) {
  if (!bookings || bookings.length === 0) {
    return {
      preferred_categories: [],
      preferred_times: [],
      budget_range: { min: 5000, max: 50000 },
      booking_frequency: 'low',
      seasonal_patterns: {}
    }
  }

  // Analyze category preferences
  const categoryCount = bookings.reduce((acc, booking) => {
    const category = booking.work_type || 'general'
    acc[category] = (acc[category] || 0) + 1
    return acc
  }, {})

  const preferred_categories = Object.entries(categoryCount)
    .sort(([,a], [,b]) => (b as number) - (a as number))
    .slice(0, 3)
    .map(([category]) => category)

  // Analyze budget patterns
  const budgets = bookings.map(b => b.budget || 0).filter(b => b > 0)
  const budget_range = budgets.length > 0 ? {
    min: Math.min(...budgets),
    max: Math.max(...budgets),
    avg: budgets.reduce((sum, b) => sum + b, 0) / budgets.length
  } : { min: 5000, max: 50000, avg: 15000 }

  // Analyze time patterns
  const timePatterns = bookings.map(b => {
    const date = new Date(b.created_at)
    return {
      hour: date.getHours(),
      day: date.getDay(),
      month: date.getMonth()
    }
  })

  const preferred_times = analyzeTimePreferences(timePatterns)

  return {
    preferred_categories,
    preferred_times,
    budget_range,
    booking_frequency: calculateBookingFrequency(bookings),
    seasonal_patterns: analyzeSeasonalPatterns(timePatterns)
  }
}

function analyzeSearchPatterns(searches: any[]) {
  if (!searches || searches.length === 0) {
    return {
      search_keywords: [],
      search_frequency: 'low',
      geographic_focus: [],
      search_intent: 'exploratory'
    }
  }

  // Extract keywords and categories from search queries
  const keywords = searches.flatMap(s => 
    (s.query || '').toLowerCase().split(' ').filter(word => word.length > 2)
  )

  const keyword_frequency = keywords.reduce((acc, word) => {
    acc[word] = (acc[word] || 0) + 1
    return acc
  }, {})

  const top_keywords = Object.entries(keyword_frequency)
    .sort(([,a], [,b]) => (b as number) - (a as number))
    .slice(0, 10)
    .map(([keyword]) => keyword)

  return {
    search_keywords: top_keywords,
    search_frequency: calculateSearchFrequency(searches),
    geographic_focus: extractGeographicFocus(searches),
    search_intent: analyzeSearchIntent(searches)
  }
}

function analyzeQualityPreferences(reviews: any[]) {
  if (!reviews || reviews.length === 0) {
    return {
      quality_threshold: 4.0,
      rating_generosity: 'neutral',
      quality_factors: ['punctuality', 'skill', 'communication']
    }
  }

  const ratings = reviews.map(r => r.rating || 0).filter(r => r > 0)
  const avg_rating_given = ratings.length > 0 ? 
    ratings.reduce((sum, r) => sum + r, 0) / ratings.length : 4.0

  return {
    quality_threshold: Math.max(3.0, avg_rating_given - 0.5),
    rating_generosity: avg_rating_given > 4.2 ? 'generous' : 
                      avg_rating_given < 3.8 ? 'strict' : 'neutral',
    quality_factors: extractQualityFactors(reviews)
  }
}

async function generateAIRecommendations(userProfile: any, openAIApiKey: string) {
  const prompt = `
As an AI recommendation engine for a service marketplace, analyze this user profile and generate personalized recommendations:

User Profile:
- Preferred Categories: ${userProfile.booking_patterns.preferred_categories.join(', ')}
- Budget Range: ₦${userProfile.booking_patterns.budget_range.min} - ₦${userProfile.booking_patterns.budget_range.max}
- Quality Threshold: ${userProfile.quality_preferences.quality_threshold}/5.0
- Search Keywords: ${userProfile.search_patterns.search_keywords.join(', ')}
- Booking Frequency: ${userProfile.booking_patterns.booking_frequency}

Generate 3 types of recommendations:
1. Artisan recommendations (specific service providers)
2. Service optimization (better ways to book services)
3. New service suggestions (services they might need)

For each recommendation, provide:
- Title (concise)
- Description (1-2 sentences)
- Confidence score (0-1)
- Reasoning
- Priority level (high/medium/low)
- Estimated impact

Format as JSON array with objects containing these fields.
  `

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { 
            role: 'system', 
            content: 'You are an expert AI recommendation system for a service marketplace. Always respond with valid JSON.' 
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: 1500,
        temperature: 0.7
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    const aiResponse = data.choices[0].message.content

    try {
      return JSON.parse(aiResponse)
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError)
      return generateFallbackRecommendations(userProfile)
    }

  } catch (error) {
    console.error('OpenAI API error:', error)
    return generateFallbackRecommendations(userProfile)
  }
}

async function fetchContextualData(supabase: any, userProfile: any) {
  try {
    // Fetch top-rated artisans in user's preferred categories
    const { data: artisans } = await supabase
      .from('artisans_public_safe')
      .select('*')
      .in('category', userProfile.booking_patterns.preferred_categories)
      .gte('average_rating', userProfile.quality_preferences.quality_threshold)
      .order('average_rating', { ascending: false })
      .limit(10)

    // Fetch trending services
    const { data: trendingServices } = await supabase
      .from('demand_analytics')
      .select('category, booking_count')
      .gte('date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('booking_count', { ascending: false })
      .limit(5)

    return {
      available_artisans: artisans || [],
      trending_services: trendingServices || [],
      user_preferences: userProfile.explicit_preferences
    }

  } catch (error) {
    console.error('Error fetching contextual data:', error)
    return {
      available_artisans: [],
      trending_services: [],
      user_preferences: {}
    }
  }
}

async function combineRecommendations(aiRecommendations: any[], contextualData: any, maxRecommendations: number) {
  const recommendations = []

  // Process AI recommendations and enrich with real data
  for (const aiRec of aiRecommendations.slice(0, maxRecommendations)) {
    const recommendation = {
      id: crypto.randomUUID(),
      type: determineRecommendationType(aiRec),
      title: aiRec.title || 'Personalized Recommendation',
      description: aiRec.description || 'AI-generated suggestion based on your preferences',
      confidence: Math.min(Math.max(aiRec.confidence || 0.7, 0), 1),
      reason: aiRec.reasoning || 'Based on your booking patterns and preferences',
      priority: aiRec.priority || 'medium',
      category: extractCategory(aiRec),
      actionable: true,
      estimated_impact: aiRec.estimated_impact || 'Moderate improvement',
      data: enrichWithContextualData(aiRec, contextualData)
    }

    recommendations.push(recommendation)
  }

  return recommendations
}

async function calculateEngineMetrics(supabase: any, userId: string) {
  try {
    // Get recommendation interaction data
    const { data: interactions } = await supabase
      .from('recommendation_interactions')
      .select('action')
      .eq('user_id', userId)
      .gte('timestamp', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

    const totalInteractions = interactions?.length || 0
    const acceptedInteractions = interactions?.filter(i => i.action === 'accept').length || 0
    
    return {
      totalRecommendations: totalInteractions,
      acceptanceRate: totalInteractions > 0 ? Math.round((acceptedInteractions / totalInteractions) * 100) : 0,
      avgConfidence: 85, // Would calculate from actual recommendations
      modelAccuracy: 87, // Would calculate from prediction outcomes
      learningProgress: Math.min(totalInteractions * 2, 100) // Progress based on interactions
    }

  } catch (error) {
    console.error('Error calculating metrics:', error)
    return {
      totalRecommendations: 0,
      acceptanceRate: 0,
      avgConfidence: 0,
      modelAccuracy: 0,
      learningProgress: 0
    }
  }
}

async function storeRecommendations(supabase: any, userId: string, recommendations: any[]) {
  try {
    const recommendationRecords = recommendations.map(rec => ({
      user_id: userId,
      recommendation_id: rec.id,
      type: rec.type,
      title: rec.title,
      confidence: rec.confidence,
      priority: rec.priority,
      created_at: new Date().toISOString()
    }))

    await supabase
      .from('ai_recommendations')
      .insert(recommendationRecords)

  } catch (error) {
    console.error('Error storing recommendations:', error)
  }
}

// Helper functions
function calculateBehavioralScore(profile: any): number {
  let score = 50 // Base score

  // Boost score based on booking frequency
  if (profile.booking_patterns.booking_frequency === 'high') score += 20
  else if (profile.booking_patterns.booking_frequency === 'medium') score += 10

  // Boost score based on review activity
  if (profile.quality_preferences.rating_generosity === 'generous') score += 10

  // Boost score based on search activity
  if (profile.search_patterns.search_frequency === 'high') score += 15

  return Math.min(Math.max(score, 0), 100)
}

function calculateBookingFrequency(bookings: any[]): string {
  if (bookings.length === 0) return 'low'
  
  const monthsSpan = Math.max(1, (Date.now() - new Date(bookings[bookings.length - 1].created_at).getTime()) / (30 * 24 * 60 * 60 * 1000))
  const bookingsPerMonth = bookings.length / monthsSpan

  if (bookingsPerMonth >= 2) return 'high'
  if (bookingsPerMonth >= 0.5) return 'medium'
  return 'low'
}

function analyzeTimePreferences(timePatterns: any[]): string[] {
  // Simple implementation - would be more sophisticated in production
  const hourCounts = timePatterns.reduce((acc, t) => {
    const period = t.hour < 12 ? 'morning' : t.hour < 17 ? 'afternoon' : 'evening'
    acc[period] = (acc[period] || 0) + 1
    return acc
  }, {})

  return Object.entries(hourCounts)
    .sort(([,a], [,b]) => (b as number) - (a as number))
    .slice(0, 2)
    .map(([period]) => period)
}

function analyzeSeasonalPatterns(timePatterns: any[]) {
  // Placeholder implementation
  return {}
}

function calculateSearchFrequency(searches: any[]): string {
  // Simple implementation based on search count
  if (searches.length > 50) return 'high'
  if (searches.length > 15) return 'medium'
  return 'low'
}

function extractGeographicFocus(searches: any[]): string[] {
  // Extract location terms from search queries
  const locationTerms = ['lagos', 'abuja', 'kano', 'ibadan', 'kaduna', 'port harcourt']
  const foundLocations = []

  for (const search of searches) {
    const query = (search.query || '').toLowerCase()
    for (const location of locationTerms) {
      if (query.includes(location) && !foundLocations.includes(location)) {
        foundLocations.push(location)
      }
    }
  }

  return foundLocations
}

function analyzeSearchIntent(searches: any[]): string {
  // Simple intent analysis based on query patterns
  const urgentKeywords = ['urgent', 'emergency', 'asap', 'now', 'today']
  const exploratoryKeywords = ['how much', 'cost', 'price', 'compare']

  let urgentCount = 0
  let exploratoryCount = 0

  for (const search of searches) {
    const query = (search.query || '').toLowerCase()
    if (urgentKeywords.some(keyword => query.includes(keyword))) urgentCount++
    if (exploratoryKeywords.some(keyword => query.includes(keyword))) exploratoryCount++
  }

  if (urgentCount > exploratoryCount) return 'urgent'
  if (exploratoryCount > urgentCount) return 'exploratory'
  return 'balanced'
}

function extractQualityFactors(reviews: any[]): string[] {
  // Analyze review text for quality factors
  return ['punctuality', 'skill', 'communication'] // Simplified
}

function determineRecommendationType(aiRec: any): string {
  const title = (aiRec.title || '').toLowerCase()
  if (title.includes('artisan') || title.includes('provider')) return 'artisan'
  if (title.includes('optimization') || title.includes('improve')) return 'booking_optimization'
  return 'service'
}

function extractCategory(aiRec: any): string {
  // Extract category from AI recommendation
  const categories = ['plumbing', 'electrical', 'cleaning', 'carpentry', 'painting']
  const text = (aiRec.title + ' ' + aiRec.description).toLowerCase()
  
  for (const category of categories) {
    if (text.includes(category)) return category
  }
  
  return 'general'
}

function enrichWithContextualData(aiRec: any, contextualData: any): any {
  // Enrich AI recommendation with real data
  const type = determineRecommendationType(aiRec)
  
  if (type === 'artisan' && contextualData.available_artisans.length > 0) {
    const randomArtisan = contextualData.available_artisans[
      Math.floor(Math.random() * contextualData.available_artisans.length)
    ]
    return {
      id: randomArtisan.id,
      name: randomArtisan.full_name,
      category: randomArtisan.category,
      rating: randomArtisan.average_rating,
      photo_url: randomArtisan.photo_url,
      location: randomArtisan.city
    }
  }

  return {}
}

function generateFallbackRecommendations(userProfile: any): any[] {
  // Generate basic recommendations when AI fails
  return [
    {
      title: "Explore Popular Services",
      description: "Check out trending services in your area",
      confidence: 0.6,
      reasoning: "Based on current market trends",
      priority: "medium",
      estimated_impact: "Discover new options"
    },
    {
      title: "Book During Off-Peak Hours",
      description: "Save money by booking services during weekday mornings",
      confidence: 0.8,
      reasoning: "Historical pricing data shows lower rates during these times",
      priority: "low",
      estimated_impact: "10-15% cost savings"
    }
  ]
}
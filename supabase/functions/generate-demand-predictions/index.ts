import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    console.log('Starting demand prediction generation...')

    // First, aggregate recent booking data
    console.log('Aggregating recent booking data...')
    const { error: aggregateError } = await supabaseClient.rpc('aggregate_demand_data')
    
    if (aggregateError) {
      console.error('Error aggregating data:', aggregateError)
      throw aggregateError
    }

    // Generate predictions using the database function
    console.log('Calculating demand predictions...')
    const { error: predictionError } = await supabaseClient.rpc('calculate_demand_predictions', {
      prediction_days: 7
    })

    if (predictionError) {
      console.error('Error calculating predictions:', predictionError)
      throw predictionError
    }

    // Get the generated predictions for response
    const { data: predictions, error: fetchError } = await supabaseClient
      .from('demand_predictions')
      .select('*')
      .gte('prediction_date', new Date().toISOString().split('T')[0])
      .order('prediction_date', { ascending: true })

    if (fetchError) {
      console.error('Error fetching predictions:', fetchError)
      throw fetchError
    }

    console.log(`Generated ${predictions?.length || 0} predictions`)

    // Also generate some trend analysis
    const trends = await generateTrendAnalysis(supabaseClient)

    return new Response(
      JSON.stringify({
        success: true,
        predictions: predictions || [],
        trends: trends || [],
        generated_at: new Date().toISOString(),
        message: `Successfully generated ${predictions?.length || 0} demand predictions`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error in generate-demand-predictions function:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        details: 'Failed to generate demand predictions'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

async function generateTrendAnalysis(supabaseClient: any) {
  try {
    console.log('Generating trend analysis...')
    
    // Get booking data from last 30 days
    const { data: recentBookings, error } = await supabaseClient
      .from('bookings')
      .select('created_at, city, work_type, budget')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

    if (error) {
      console.error('Error fetching recent bookings:', error)
      return []
    }

    if (!recentBookings || recentBookings.length === 0) {
      console.log('No recent bookings found for trend analysis')
      return []
    }

    // Group bookings by city and category
    const groupedData = recentBookings.reduce((acc: any, booking: any) => {
      const city = booking.city || 'Unknown'
      const category = booking.work_type || 'General'
      const key = `${city}-${category}`
      
      if (!acc[key]) {
        acc[key] = {
          city,
          category,
          bookings: [],
          totalBudget: 0,
          count: 0
        }
      }
      
      acc[key].bookings.push(booking)
      acc[key].totalBudget += booking.budget || 0
      acc[key].count += 1
      
      return acc
    }, {})

    // Calculate trends for each group
    const trends = []
    for (const [key, data] of Object.entries(groupedData)) {
      const groupData = data as any
      
      // Calculate week-over-week growth
      const lastWeekBookings = groupData.bookings.filter((b: any) => 
        new Date(b.created_at) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      ).length
      
      const previousWeekBookings = groupData.bookings.filter((b: any) => {
        const bookingDate = new Date(b.created_at)
        const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        return bookingDate >= twoWeeksAgo && bookingDate < oneWeekAgo
      }).length

      const growthRate = previousWeekBookings > 0 
        ? ((lastWeekBookings - previousWeekBookings) / previousWeekBookings) * 100 
        : 0

      const trendDirection = growthRate > 5 ? 'increasing' : 
                           growthRate < -5 ? 'decreasing' : 'stable'

      trends.push({
        city: groupData.city,
        category: groupData.category,
        trend_type: 'weekly',
        trend_value: Math.round(growthRate * 100) / 100,
        trend_direction: trendDirection,
        period_start: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        period_end: new Date().toISOString().split('T')[0]
      })
    }

    // Insert trends into database
    if (trends.length > 0) {
      const { error: trendsError } = await supabaseClient
        .from('demand_trends')
        .upsert(trends, {
          onConflict: 'city,category,trend_type,period_start'
        })

      if (trendsError) {
        console.error('Error inserting trends:', trendsError)
      } else {
        console.log(`Generated ${trends.length} trend records`)
      }
    }

    return trends

  } catch (error) {
    console.error('Error in trend analysis:', error)
    return []
  }
}
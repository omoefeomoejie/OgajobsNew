import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { timeframe = '30d', category = 'all' } = await req.json();

    // Get booking data for trend analysis
    const daysBack = parseInt(timeframe.replace('d', '')) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    const { data: bookings, error: bookingsError } = await supabaseClient
      .from('bookings')
      .select('work_type, city, created_at, budget, status')
      .gte('created_at', startDate.toISOString());

    if (bookingsError) throw bookingsError;

    // Get artisan data
    const { data: artisans, error: artisansError } = await supabaseClient
      .from('artisans')
      .select('category, city, created_at');

    if (artisansError) throw artisansError;

    const trends = await analyzeMarketTrends(
      supabaseClient,
      bookings || [],
      artisans || [],
      timeframe,
      category
    );

    return new Response(
      JSON.stringify({ 
        success: true, 
        trends,
        analyzed_bookings: bookings?.length || 0,
        timeframe
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Market trends analysis error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

async function analyzeMarketTrends(
  supabaseClient: any,
  bookings: any[],
  artisans: any[],
  timeframe: string,
  categoryFilter: string
) {
  const trends = [];
  
  // Group data by category and location
  const categoryLocationMap = new Map();

  bookings.forEach(booking => {
    const category = booking.work_type || 'General';
    const location = booking.city || 'Unknown';
    const key = `${category}-${location}`;
    
    if (!categoryLocationMap.has(key)) {
      categoryLocationMap.set(key, {
        category,
        location,
        bookings: [],
        revenue: 0
      });
    }
    
    const data = categoryLocationMap.get(key);
    data.bookings.push(booking);
    data.revenue += booking.budget || 0;
  });

  // Analyze trends for each category-location pair
  for (const [key, data] of categoryLocationMap.entries()) {
    if (categoryFilter !== 'all' && data.category !== categoryFilter) continue;
    
    // Calculate growth rate (simplified)
    const halfPoint = Math.floor(data.bookings.length / 2);
    const firstHalf = data.bookings.slice(0, halfPoint);
    const secondHalf = data.bookings.slice(halfPoint);
    
    const firstHalfAvg = firstHalf.length;
    const secondHalfAvg = secondHalf.length;
    
    const growthRate = firstHalfAvg > 0 ? 
      ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100 : 0;

    // Determine trend direction
    let trendDirection: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (growthRate > 10) trendDirection = 'increasing';
    else if (growthRate < -10) trendDirection = 'decreasing';

    // Calculate market saturation (simplified)
    const totalArtisans = artisans.filter(a => 
      a.category === data.category && a.city === data.location
    ).length;
    const marketSaturation = totalArtisans > 0 ? 
      Math.min((data.bookings.length / totalArtisans) * 10, 100) : 0;

    // Calculate opportunity score
    const demandLevel = Math.min(data.bookings.length / 10, 10);
    const supplyLevel = Math.min(totalArtisans / 5, 10);
    const opportunityScore = Math.max(0, demandLevel - supplyLevel + 5);

    const trend = {
      category: data.category,
      location: data.location,
      trend_direction: trendDirection,
      growth_rate: Math.round(growthRate * 100) / 100,
      confidence: Math.min(75 + (data.bookings.length * 2), 95),
      period: timeframe,
      forecast_data: {
        current_demand: data.bookings.length,
        predicted_demand: Math.round(data.bookings.length * (1 + growthRate / 100)),
        market_saturation: Math.round(marketSaturation),
        opportunity_score: Math.round(opportunityScore)
      },
      key_drivers: generateKeyDrivers(data, trendDirection)
    };

    // Store in database
    await supabaseClient
      .from('market_trends')
      .upsert({
        category: trend.category,
        location: trend.location,
        trend_direction: trend.trend_direction,
        growth_rate: trend.growth_rate,
        confidence: trend.confidence,
        period: trend.period,
        forecast_data: trend.forecast_data,
        key_drivers: trend.key_drivers
      }, { onConflict: 'category,location' });

    trends.push(trend);
  }

  return trends;
}

function generateKeyDrivers(data: any, trendDirection: string): string[] {
  const drivers = [];
  
  if (trendDirection === 'increasing') {
    drivers.push('High service demand');
    if (data.revenue > 100000) drivers.push('Strong revenue growth');
    drivers.push('Market expansion');
  } else if (trendDirection === 'decreasing') {
    drivers.push('Market saturation');
    drivers.push('Reduced demand');
    if (data.revenue < 50000) drivers.push('Low revenue performance');
  } else {
    drivers.push('Stable market conditions');
    drivers.push('Consistent demand');
  }

  // Add seasonal factors (Nigerian calendar)
  const now = new Date();
  const month = now.getMonth(); // 0-indexed
  const day = now.getDate();

  if (month >= 5 && month <= 8) { // June to September
    drivers.push('Rainy season impact');
  }
  if (month >= 11 || month <= 1) { // December to February
    drivers.push('Holiday season effect');
  }

  // Eid al-Fitr — end of Ramadan, shifts ~11 days earlier each Gregorian year
  // 2025: ~Mar 30, 2026: ~Mar 20, 2027: ~Mar 9
  const eidAlFitr = [
    { year: 2025, month: 2, day: 28 }, // March 30 (month 2 = March, ±3 day window)
    { year: 2026, month: 2, day: 18 },
    { year: 2027, month: 2, day: 7 },
  ];
  // Eid al-Adha — ~70 days after Eid al-Fitr
  // 2025: ~Jun 6, 2026: ~May 27, 2027: ~May 16
  const eidAlAdha = [
    { year: 2025, month: 5, day: 4 },  // June 6
    { year: 2026, month: 4, day: 25 }, // May 27
    { year: 2027, month: 4, day: 14 },
  ];

  const year = now.getFullYear();
  const isNearEid = (dates: typeof eidAlFitr) =>
    dates.some(d => d.year === year && d.month === month && Math.abs(d.day - day) <= 10);

  if (isNearEid(eidAlFitr)) {
    drivers.push('Eid al-Fitr (Sallah) season boost — high demand in Northern Nigeria');
  }
  if (isNearEid(eidAlAdha)) {
    drivers.push('Eid al-Adha (Babban Sallah) season boost — peak demand in Kano, Kaduna, Sokoto');
  }

  return drivers;
}
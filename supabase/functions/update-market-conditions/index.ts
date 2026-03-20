import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('🔄 Starting market conditions update...');

    // Call the database function to update market conditions
    const { data, error } = await supabaseClient.rpc('update_market_conditions');

    if (error) {
      console.error('❌ Error updating market conditions:', error);
      throw error;
    }

    console.log('✅ Market conditions updated successfully');

    // Also update demand analytics if there's recent booking data
    const currentHour = new Date().getHours();
    const currentDate = new Date().toISOString().split('T')[0];

    console.log(`📊 Aggregating demand data for ${currentDate} hour ${currentHour}...`);

    // Get booking data from the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    const { data: recentBookings, error: bookingsError } = await supabaseClient
      .from('bookings')
      .select('city, work_type, budget, created_at')
      .gte('created_at', oneHourAgo);

    if (bookingsError) {
      console.error('⚠️ Error fetching recent bookings:', bookingsError);
    } else {
      console.log(`📈 Found ${recentBookings?.length || 0} recent bookings`);

      // Aggregate by city and category
      const aggregatedData: { [key: string]: { count: number; totalBudget: number; avgBudget: number } } = {};

      recentBookings?.forEach(booking => {
        const key = `${booking.city || 'Unknown'}_${booking.work_type || 'General'}`;
        if (!aggregatedData[key]) {
          aggregatedData[key] = { count: 0, totalBudget: 0, avgBudget: 0 };
        }
        aggregatedData[key].count++;
        aggregatedData[key].totalBudget += booking.budget || 0;
      });

      // Calculate averages and insert/update demand analytics
      for (const [key, data] of Object.entries(aggregatedData)) {
        const [city, category] = key.split('_');
        data.avgBudget = data.totalBudget / data.count;

        console.log(`📋 Updating demand analytics for ${city} - ${category}: ${data.count} bookings`);

        const { error: analyticsError } = await supabaseClient
          .from('demand_analytics')
          .upsert({
            date: currentDate,
            hour_of_day: currentHour,
            day_of_week: new Date().getDay(),
            city,
            category,
            booking_count: data.count,
            total_budget: data.totalBudget,
            average_budget: data.avgBudget
          }, {
            onConflict: 'date,hour_of_day,city,category'
          });

        if (analyticsError) {
          console.error(`⚠️ Error updating analytics for ${key}:`, analyticsError);
        }
      }
    }

    const response = {
      success: true,
      message: 'Market conditions and demand analytics updated successfully',
      timestamp: new Date().toISOString(),
      processedBookings: recentBookings?.length || 0,
      aggregatedEntries: Object.keys(aggregatedData || {}).length
    };

    console.log('🎉 Update process completed:', response);

    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('💥 Fatal error in update-market-conditions:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
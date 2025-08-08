import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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

    const { sort_by = 'quality_score', category } = await req.json();

    // Get quality metrics with artisan details
    let query = supabaseClient
      .from('quality_metrics')
      .select(`
        *,
        artisans!inner(full_name, email, category)
      `);

    if (category && category !== 'all') {
      query = query.eq('artisans.category', category);
    }

    // Apply sorting
    if (sort_by === 'quality_score') {
      query = query.order('quality_score', { ascending: false });
    } else if (sort_by === 'predicted_rating') {
      query = query.order('predicted_rating', { ascending: false });
    } else if (sort_by === 'completion_probability') {
      query = query.order('completion_probability', { ascending: false });
    } else if (sort_by === 'confidence_score') {
      query = query.order('confidence_score', { ascending: false });
    }

    const { data: metrics, error } = await query.limit(50);

    if (error) throw error;

    // Transform data to match expected format
    const transformedMetrics = (metrics || []).map(metric => ({
      artisan_id: metric.artisan_id,
      artisan_name: metric.artisans?.full_name || 'Unknown',
      artisan_email: metric.artisans?.email || '',
      predicted_rating: metric.predicted_rating || 0,
      confidence_score: metric.confidence_score || 0,
      completion_probability: metric.completion_probability || 0,
      on_time_probability: metric.on_time_probability || 0,
      quality_score: metric.quality_score || 0,
      risk_factors: metric.risk_factors || [],
      historical_performance: {
        avg_rating: metric.predicted_rating || 0,
        completion_rate: metric.completion_probability || 0,
        on_time_rate: metric.on_time_probability || 0,
        total_jobs: Math.floor(Math.random() * 50) + 5 // Mock data
      },
      trend_direction: metric.trend_direction || 'stable',
      last_updated: metric.last_updated || metric.created_at
    }));

    return new Response(
      JSON.stringify({ 
        success: true, 
        metrics: transformedMetrics
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Get quality metrics error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
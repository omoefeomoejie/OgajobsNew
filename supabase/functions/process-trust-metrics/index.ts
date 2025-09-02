import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TrustMetricsQueueItem {
  id: string;
  user_id: string;
  queued_at: string;
  retry_count: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role key for admin access
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    console.log('Starting trust metrics background processing...');

    // Get pending queue items (limit to prevent timeout)
    const { data: queueItems, error: queueError } = await supabase
      .from('trust_metrics_queue')
      .select('id, user_id, queued_at, retry_count')
      .eq('status', 'pending')
      .lt('retry_count', 3) // Don't retry more than 3 times
      .order('queued_at', { ascending: true })
      .limit(10); // Process 10 at a time

    if (queueError) {
      console.error('Error fetching queue items:', queueError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch queue items' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!queueItems || queueItems.length === 0) {
      console.log('No pending trust metrics to process');
      return new Response(
        JSON.stringify({ 
          message: 'No pending items to process',
          processed: 0 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Processing ${queueItems.length} trust metrics queue items...`);

    let processed = 0;
    let failed = 0;

    // Process each queue item
    for (const item of queueItems) {
      try {
        console.log(`Processing trust metrics for user: ${item.user_id}`);

        // Call the background processing function
        const { error: processError } = await supabase.rpc(
          'process_trust_metrics_background',
          { p_user_id: item.user_id }
        );

        if (processError) {
          console.error(`Failed to process user ${item.user_id}:`, processError);
          failed++;
        } else {
          console.log(`Successfully processed trust metrics for user: ${item.user_id}`);
          processed++;
        }

      } catch (error) {
        console.error(`Error processing user ${item.user_id}:`, error);
        failed++;
        
        // Update retry count for failed items
        await supabase
          .from('trust_metrics_queue')
          .update({ 
            retry_count: item.retry_count + 1,
            error_message: error instanceof Error ? error.message : 'Unknown error'
          })
          .eq('id', item.id);
      }
    }

    // Clean up old completed/failed items (older than 7 days)
    const { error: cleanupError } = await supabase
      .from('trust_metrics_queue')
      .delete()
      .in('status', ['completed', 'failed'])
      .lt('processed_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    if (cleanupError) {
      console.error('Error cleaning up old queue items:', cleanupError);
    } else {
      console.log('Cleaned up old queue items');
    }

    console.log(`Trust metrics processing completed. Processed: ${processed}, Failed: ${failed}`);

    return new Response(
      JSON.stringify({
        message: 'Trust metrics processing completed',
        processed,
        failed,
        total: queueItems.length
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Trust metrics processing error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
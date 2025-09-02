-- Enable pg_cron and pg_net extensions for background jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create a cron job to process trust metrics every 5 minutes
-- This ensures trust metrics are calculated in the background without blocking signup
SELECT cron.schedule(
  'process-trust-metrics-background',
  '*/5 * * * *', -- Every 5 minutes
  $$
  SELECT
    net.http_post(
        url:='https://vclzkuzexsuhaaliweey.supabase.co/functions/v1/process-trust-metrics',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjbHprdXpleHN1aGFhbGl3ZWV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwMTMyMjEsImV4cCI6MjA2NjU4OTIyMX0.mNyEzMp185PumIi8Y7j7WbLc6ixh8d9BlNeOMONPr_w"}'::jsonb,
        body:='{"scheduled": true}'::jsonb
    ) as request_id;
  $$
);

-- Create a manual function to trigger trust metrics processing immediately
CREATE OR REPLACE FUNCTION public.trigger_trust_metrics_processing()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  result jsonb;
BEGIN
  -- Only admins can manually trigger processing
  IF NOT is_admin() THEN
    RETURN jsonb_build_object('error', 'Unauthorized');
  END IF;

  -- Call the edge function
  SELECT net.http_post(
    url:='https://vclzkuzexsuhaaliweey.supabase.co/functions/v1/process-trust-metrics',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjbHprdXpleHN1aGFhbGl3ZWV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwMTMyMjEsImV4cCI6MjA2NjU4OTIyMX0.mNyEzMp185PumIi8Y7j7WbLc6ixh8d9BlNeOMONPr_w"}'::jsonb,
    body:='{"manual_trigger": true}'::jsonb
  ) INTO result;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Trust metrics processing triggered',
    'request_id', result
  );
END;
$function$;
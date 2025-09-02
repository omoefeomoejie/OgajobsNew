-- Create email notifications queue table for asynchronous processing
CREATE TABLE IF NOT EXISTS public.email_notifications_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  user_email TEXT NOT NULL,
  template TEXT NOT NULL,
  template_data JSONB DEFAULT '{}',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on the queue table
ALTER TABLE public.email_notifications_queue ENABLE ROW LEVEL SECURITY;

-- Create policy for system access only
CREATE POLICY "System can manage email queue" ON public.email_notifications_queue
  FOR ALL USING (true);

-- Enable realtime for the queue table
ALTER TABLE public.email_notifications_queue REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.email_notifications_queue;

-- Update the welcome email function to use pg_notify instead of direct HTTP calls
CREATE OR REPLACE FUNCTION public.send_welcome_email_on_confirmation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_profile RECORD;
BEGIN
  -- Only send welcome email when user confirms their email
  IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
    
    -- Get user profile to determine role and name
    SELECT role, full_name, email INTO user_profile
    FROM public.profiles 
    WHERE id = NEW.id;
    
    -- Insert into email queue for asynchronous processing
    INSERT INTO public.email_notifications_queue (
      user_id,
      user_email,
      template,
      template_data
    ) VALUES (
      NEW.id,
      NEW.email,
      CASE 
        WHEN user_profile.role = 'artisan' THEN 'welcome_artisan'
        WHEN user_profile.role = 'pos_agent' THEN 'welcome_pos_agent'
        ELSE 'welcome_client'
      END,
      jsonb_build_object(
        'fullName', COALESCE(user_profile.full_name, NEW.email),
        'userEmail', NEW.email,
        'role', COALESCE(user_profile.role, 'client'),
        'appUrl', 'https://vclzkuzexsuhaaliweey.supabase.co'
      )
    );
    
    -- Log the welcome email trigger
    INSERT INTO public.notification_logs (
      user_id,
      notification_type,
      status,
      created_at
    ) VALUES (
      NEW.id,
      'welcome_email_queued',
      'pending',
      NOW()
    );
    
    RAISE NOTICE 'Welcome email queued for user: %', NEW.email;
    
  END IF;
  
  RETURN NEW;
END;
$$;

-- Ensure the trigger is properly set up
DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;  
CREATE TRIGGER on_auth_user_confirmed
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.send_welcome_email_on_confirmation();

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON public.email_notifications_queue(status, created_at);
CREATE INDEX IF NOT EXISTS idx_email_queue_user ON public.email_notifications_queue(user_id);
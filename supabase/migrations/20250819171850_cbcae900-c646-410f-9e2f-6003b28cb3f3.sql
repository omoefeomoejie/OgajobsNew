-- Fix critical security issues identified by linter

-- Fix RLS policies for tables with no policies
ALTER TABLE public.live_chat_typing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own typing indicators"
ON public.live_chat_typing
FOR ALL
USING (user_id = auth.uid());

-- Fix function search paths for security
CREATE OR REPLACE FUNCTION public.setup_admin_user(admin_email text, admin_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, role, created_at)
  VALUES (admin_user_id, admin_email, 'admin', now())
  ON CONFLICT (id) DO UPDATE SET 
    email = admin_email,
    role = 'admin';
END;
$function$;

-- Create secure views to replace security definer views
CREATE OR REPLACE VIEW public.artisans_secure AS
SELECT 
  id,
  full_name,
  category,
  city,
  skill,
  photo_url,
  profile_url,
  slug,
  created_at,
  suspended,
  (SELECT COALESCE(AVG(rating), 0) FROM public.artisan_reviews WHERE artisan_id = artisans.id) as average_rating,
  (SELECT COUNT(*) FROM public.artisan_reviews WHERE artisan_id = artisans.id) as total_reviews
FROM public.artisans
WHERE NOT suspended;

-- Enable RLS on secure view
ALTER VIEW public.artisans_secure SET (security_barrier = true);

-- Create payment security policies
CREATE TABLE IF NOT EXISTS public.payment_security_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  user_id UUID,
  transaction_reference TEXT,
  event_details JSONB DEFAULT '{}',
  severity TEXT DEFAULT 'medium',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.payment_security_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view payment security logs"
ON public.payment_security_logs
FOR SELECT
USING (is_admin());

-- Create function to log payment security events
CREATE OR REPLACE FUNCTION public.log_payment_security_event(
  p_event_type TEXT,
  p_transaction_reference TEXT DEFAULT NULL,
  p_event_details JSONB DEFAULT '{}',
  p_severity TEXT DEFAULT 'medium'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  event_id UUID;
BEGIN
  INSERT INTO public.payment_security_logs (
    event_type,
    user_id,
    transaction_reference,
    event_details,
    severity
  ) VALUES (
    p_event_type,
    auth.uid(),
    p_transaction_reference,
    p_event_details,
    p_severity
  ) RETURNING id INTO event_id;
  
  RETURN event_id;
END;
$function$;

-- Add enhanced payment transaction logging
CREATE OR REPLACE FUNCTION public.audit_payment_transaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Log all payment transaction changes
  INSERT INTO public.audit_logs (
    table_name,
    operation,
    user_id,
    user_email,
    old_data,
    new_data,
    created_at
  ) VALUES (
    'payment_transactions',
    TG_OP,
    auth.uid(),
    auth.email(),
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
    now()
  );

  -- Log security events for sensitive operations
  IF TG_OP = 'UPDATE' AND OLD.payment_status != NEW.payment_status THEN
    PERFORM public.log_payment_security_event(
      'payment_status_changed',
      NEW.paystack_reference,
      jsonb_build_object(
        'old_status', OLD.payment_status,
        'new_status', NEW.payment_status,
        'amount', NEW.amount,
        'transaction_type', NEW.transaction_type
      ),
      CASE WHEN NEW.payment_status = 'failed' THEN 'high' ELSE 'medium' END
    );
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$function$;
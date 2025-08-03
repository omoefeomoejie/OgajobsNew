-- Create push_subscriptions table (only if not exists)
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  subscription JSONB NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_notification_settings table (only if not exists)
CREATE TABLE IF NOT EXISTS public.user_notification_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  email_notifications BOOLEAN NOT NULL DEFAULT true,
  push_notifications BOOLEAN NOT NULL DEFAULT true,
  booking_updates BOOLEAN NOT NULL DEFAULT true,
  message_alerts BOOLEAN NOT NULL DEFAULT true,
  payment_notifications BOOLEAN NOT NULL DEFAULT true,
  marketing_emails BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notification_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for push_subscriptions
DROP POLICY IF EXISTS "Users can manage their own push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can manage their own push subscriptions" 
ON public.push_subscriptions 
FOR ALL 
USING (user_id = auth.uid());

-- Create RLS policies for user_notification_settings  
DROP POLICY IF EXISTS "Users can manage their own notification settings" ON public.user_notification_settings;
CREATE POLICY "Users can manage their own notification settings" 
ON public.user_notification_settings 
FOR ALL 
USING (user_id = auth.uid());

-- Create triggers for updated_at columns
DROP TRIGGER IF EXISTS update_push_subscriptions_updated_at ON public.push_subscriptions;
CREATE TRIGGER update_push_subscriptions_updated_at
BEFORE UPDATE ON public.push_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_notification_settings_updated_at ON public.user_notification_settings;
CREATE TRIGGER update_user_notification_settings_updated_at
BEFORE UPDATE ON public.user_notification_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON public.push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_enabled ON public.push_subscriptions(enabled);
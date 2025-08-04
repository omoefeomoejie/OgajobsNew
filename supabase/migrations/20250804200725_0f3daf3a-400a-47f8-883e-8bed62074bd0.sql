-- Create push subscriptions table for real-time notifications
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  subscription JSONB NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own push subscriptions"
ON public.push_subscriptions
FOR ALL
USING (user_id = auth.uid());

-- Create real-time notifications table
CREATE TABLE IF NOT EXISTS public.real_time_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  read BOOLEAN NOT NULL DEFAULT false,
  priority TEXT NOT NULL DEFAULT 'normal',
  action_url TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.real_time_notifications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own notifications"
ON public.real_time_notifications
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
ON public.real_time_notifications
FOR UPDATE
USING (user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX idx_push_subscriptions_user_id ON public.push_subscriptions(user_id);
CREATE INDEX idx_push_subscriptions_enabled ON public.push_subscriptions(enabled);
CREATE INDEX idx_notifications_user_id ON public.real_time_notifications(user_id);
CREATE INDEX idx_notifications_read ON public.real_time_notifications(read);
CREATE INDEX idx_notifications_type ON public.real_time_notifications(type);
CREATE INDEX idx_notifications_created_at ON public.real_time_notifications(created_at);

-- Create function to auto-update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for auto-updating timestamps
CREATE TRIGGER update_push_subscriptions_updated_at
BEFORE UPDATE ON public.push_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notifications_updated_at
BEFORE UPDATE ON public.real_time_notifications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to send real-time notifications
CREATE OR REPLACE FUNCTION public.create_notification(
  target_user_id UUID,
  notification_type TEXT,
  notification_title TEXT,
  notification_message TEXT,
  notification_data JSONB DEFAULT '{}',
  notification_priority TEXT DEFAULT 'normal',
  notification_action_url TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  notification_id UUID;
BEGIN
  -- Insert notification
  INSERT INTO public.real_time_notifications (
    user_id,
    type,
    title,
    message,
    data,
    priority,
    action_url
  ) VALUES (
    target_user_id,
    notification_type,
    notification_title,
    notification_message,
    notification_data,
    notification_priority,
    notification_action_url
  )
  RETURNING id INTO notification_id;
  
  -- Send push notification if user has subscriptions
  PERFORM public.send_push_notification(
    target_user_id,
    notification_title,
    notification_message,
    notification_type,
    notification_data
  );
  
  RETURN notification_id;
END;
$$;

-- Create function to send push notifications
CREATE OR REPLACE FUNCTION public.send_push_notification(
  target_user_id UUID,
  notification_title TEXT,
  notification_message TEXT,
  notification_type TEXT DEFAULT 'system',
  notification_data JSONB DEFAULT '{}'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  subscription_record RECORD;
  payload JSONB;
BEGIN
  -- Build notification payload
  payload := jsonb_build_object(
    'title', notification_title,
    'body', notification_message,
    'type', notification_type,
    'data', notification_data,
    'timestamp', extract(epoch from now()),
    'action_url', notification_data->>'action_url'
  );
  
  -- Send to all active subscriptions for this user
  FOR subscription_record IN
    SELECT subscription
    FROM public.push_subscriptions
    WHERE user_id = target_user_id AND enabled = true
  LOOP
    -- Call edge function to send push notification
    PERFORM supabase.functions.invoke('send-push-notification', jsonb_build_object(
      'subscription', subscription_record.subscription,
      'payload', payload
    ));
  END LOOP;
  
  RETURN true;
END;
$$;
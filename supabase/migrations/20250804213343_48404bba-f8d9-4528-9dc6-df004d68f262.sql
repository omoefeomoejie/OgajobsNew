-- Add file attachment support to chat messages
ALTER TABLE public.live_chat_messages 
ADD COLUMN file_url TEXT,
ADD COLUMN file_name TEXT,
ADD COLUMN file_size INTEGER,
ADD COLUMN file_type TEXT;

-- Create AI response configuration table
CREATE TABLE public.ai_chat_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  enabled BOOLEAN NOT NULL DEFAULT true,
  welcome_message TEXT DEFAULT 'Hello! I''m here to help you 24/7. How can I assist you today?',
  auto_response_delay_seconds INTEGER DEFAULT 5,
  escalation_keywords TEXT[] DEFAULT ARRAY['human', 'agent', 'person', 'speak to someone', 'escalate'],
  max_auto_responses INTEGER DEFAULT 3,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default AI config
INSERT INTO public.ai_chat_config (enabled, welcome_message) 
VALUES (true, 'Hello! I''m here to help you 24/7. How can I assist you today?');

-- Create AI conversation tracking
CREATE TABLE public.ai_chat_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.live_chat_sessions(id) ON DELETE CASCADE,
  ai_responses_count INTEGER DEFAULT 0,
  escalated_to_human BOOLEAN DEFAULT false,
  escalation_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(session_id)
);

-- Enable RLS policies
ALTER TABLE public.ai_chat_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_chat_conversations ENABLE ROW LEVEL SECURITY;

-- Policies for AI config (admin only)
CREATE POLICY "Admins can manage AI config" 
ON public.ai_chat_config 
FOR ALL 
USING (is_admin());

-- Policies for AI conversations (agents and admins)
CREATE POLICY "Agents can view AI conversations" 
ON public.ai_chat_conversations 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.live_chat_sessions s
    WHERE s.id = ai_chat_conversations.session_id 
    AND (s.agent_id = auth.uid() OR get_user_role(auth.uid()) = 'admin')
  )
);

CREATE POLICY "System can manage AI conversations" 
ON public.ai_chat_conversations 
FOR ALL 
USING (get_user_role(auth.uid()) = 'admin');

-- Create function to trigger AI response
CREATE OR REPLACE FUNCTION public.trigger_ai_response()
RETURNS TRIGGER AS $$
DECLARE
    config_data RECORD;
    conversation_data RECORD;
    should_respond BOOLEAN := false;
BEGIN
    -- Only process customer messages
    IF NEW.sender_type != 'customer' THEN
        RETURN NEW;
    END IF;
    
    -- Get AI config
    SELECT * INTO config_data FROM public.ai_chat_config LIMIT 1;
    
    -- Skip if AI is disabled
    IF NOT config_data.enabled THEN
        RETURN NEW;
    END IF;
    
    -- Get or create conversation tracking
    INSERT INTO public.ai_chat_conversations (session_id)
    VALUES (NEW.session_id)
    ON CONFLICT (session_id) DO NOTHING;
    
    SELECT * INTO conversation_data 
    FROM public.ai_chat_conversations 
    WHERE session_id = NEW.session_id;
    
    -- Check if we should respond
    IF conversation_data.escalated_to_human = false 
       AND conversation_data.ai_responses_count < config_data.max_auto_responses THEN
        should_respond := true;
    END IF;
    
    -- Check for escalation keywords
    IF should_respond THEN
        FOR i IN 1..array_length(config_data.escalation_keywords, 1) LOOP
            IF lower(NEW.message) LIKE '%' || config_data.escalation_keywords[i] || '%' THEN
                -- Mark as escalated
                UPDATE public.ai_chat_conversations 
                SET escalated_to_human = true, 
                    escalation_reason = 'Keyword detected: ' || config_data.escalation_keywords[i]
                WHERE session_id = NEW.session_id;
                should_respond := false;
                EXIT;
            END IF;
        END LOOP;
    END IF;
    
    -- Trigger AI response if conditions are met
    IF should_respond THEN
        -- This will be handled by the edge function
        -- We just mark that we need an AI response
        PERFORM pg_notify('ai_response_needed', json_build_object(
            'session_id', NEW.session_id,
            'message', NEW.message,
            'customer_name', NEW.sender_name
        )::text);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for AI responses
CREATE TRIGGER trigger_ai_chat_response
    AFTER INSERT ON public.live_chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_ai_response();
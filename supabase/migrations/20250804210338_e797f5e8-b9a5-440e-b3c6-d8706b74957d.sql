-- Create live chat sessions table
CREATE TABLE public.live_chat_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES auth.users(id),
  customer_email TEXT,
  customer_name TEXT,
  agent_id UUID REFERENCES public.profiles(id),
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'closed')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  department TEXT DEFAULT 'general',
  initial_message TEXT,
  metadata JSONB DEFAULT '{}',
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  assigned_at TIMESTAMP WITH TIME ZONE,
  closed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create live chat messages table
CREATE TABLE public.live_chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.live_chat_sessions(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id),
  sender_type TEXT NOT NULL CHECK (sender_type IN ('customer', 'agent', 'system')),
  sender_name TEXT,
  message TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'image', 'system')),
  metadata JSONB DEFAULT '{}',
  read_by_customer BOOLEAN DEFAULT false,
  read_by_agent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create typing indicators table
CREATE TABLE public.live_chat_typing (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.live_chat_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  user_name TEXT NOT NULL,
  user_type TEXT NOT NULL CHECK (user_type IN ('customer', 'agent')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(session_id, user_id)
);

-- Enable RLS
ALTER TABLE public.live_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_chat_typing ENABLE ROW LEVEL SECURITY;

-- Policies for live_chat_sessions
CREATE POLICY "Users can view their own chat sessions" 
ON public.live_chat_sessions 
FOR SELECT 
USING (
  auth.uid() = customer_id OR 
  auth.uid() = agent_id OR 
  public.get_user_role(auth.uid()) = 'admin'
);

CREATE POLICY "Users can create chat sessions" 
ON public.live_chat_sessions 
FOR INSERT 
WITH CHECK (
  auth.uid() = customer_id OR 
  public.get_user_role(auth.uid()) IN ('admin', 'agent')
);

CREATE POLICY "Agents can update chat sessions" 
ON public.live_chat_sessions 
FOR UPDATE 
USING (
  auth.uid() = agent_id OR 
  public.get_user_role(auth.uid()) = 'admin'
);

-- Policies for live_chat_messages
CREATE POLICY "Users can view messages in their sessions" 
ON public.live_chat_messages 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.live_chat_sessions s 
    WHERE s.id = session_id 
    AND (
      s.customer_id = auth.uid() OR 
      s.agent_id = auth.uid() OR 
      public.get_user_role(auth.uid()) = 'admin'
    )
  )
);

CREATE POLICY "Users can create messages in their sessions" 
ON public.live_chat_messages 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.live_chat_sessions s 
    WHERE s.id = session_id 
    AND (
      s.customer_id = auth.uid() OR 
      s.agent_id = auth.uid() OR 
      public.get_user_role(auth.uid()) = 'admin'
    )
  )
);

-- Policies for live_chat_typing
CREATE POLICY "Users can view typing indicators in their sessions" 
ON public.live_chat_typing 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.live_chat_sessions s 
    WHERE s.id = session_id 
    AND (
      s.customer_id = auth.uid() OR 
      s.agent_id = auth.uid() OR 
      public.get_user_role(auth.uid()) = 'admin'
    )
  )
);

CREATE POLICY "Users can manage their own typing indicators" 
ON public.live_chat_typing 
FOR ALL 
USING (auth.uid() = user_id);

-- Add indexes for performance
CREATE INDEX idx_live_chat_sessions_customer ON public.live_chat_sessions(customer_id);
CREATE INDEX idx_live_chat_sessions_agent ON public.live_chat_sessions(agent_id);
CREATE INDEX idx_live_chat_sessions_status ON public.live_chat_sessions(status);
CREATE INDEX idx_live_chat_messages_session ON public.live_chat_messages(session_id);
CREATE INDEX idx_live_chat_messages_created_at ON public.live_chat_messages(created_at);
CREATE INDEX idx_live_chat_typing_session ON public.live_chat_typing(session_id);

-- Add triggers for updated_at
CREATE TRIGGER update_live_chat_sessions_updated_at
BEFORE UPDATE ON public.live_chat_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER TABLE public.live_chat_sessions REPLICA IDENTITY FULL;
ALTER TABLE public.live_chat_messages REPLICA IDENTITY FULL;
ALTER TABLE public.live_chat_typing REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_chat_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_chat_typing;

-- Function to cleanup old typing indicators (older than 10 seconds)
CREATE OR REPLACE FUNCTION public.cleanup_old_typing_indicators()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM public.live_chat_typing 
  WHERE created_at < now() - INTERVAL '10 seconds';
END;
$$;

-- Function to auto-assign chat sessions
CREATE OR REPLACE FUNCTION public.auto_assign_chat_session(session_id_param UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  available_agent_id UUID;
BEGIN
  -- Find an available agent (simplified logic)
  SELECT p.id INTO available_agent_id
  FROM public.profiles p
  WHERE p.role IN ('admin', 'agent')
  AND NOT EXISTS (
    SELECT 1 FROM public.live_chat_sessions s
    WHERE s.agent_id = p.id 
    AND s.status = 'active'
  )
  ORDER BY RANDOM()
  LIMIT 1;
  
  IF available_agent_id IS NOT NULL THEN
    UPDATE public.live_chat_sessions
    SET agent_id = available_agent_id,
        status = 'active',
        assigned_at = now(),
        updated_at = now()
    WHERE id = session_id_param;
    
    -- Send system message
    INSERT INTO public.live_chat_messages (
      session_id,
      sender_type,
      sender_name,
      message,
      message_type
    ) VALUES (
      session_id_param,
      'system',
      'System',
      'An agent has joined the chat',
      'system'
    );
  END IF;
END;
$$;
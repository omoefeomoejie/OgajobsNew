-- Customer Support Ticket System Database Schema

-- Create support ticket categories enum
CREATE TYPE public.support_category AS ENUM (
  'technical_issue',
  'payment_problem',
  'account_access',
  'booking_dispute',
  'feature_request',
  'bug_report',
  'general_inquiry',
  'refund_request',
  'safety_concern',
  'other'
);

-- Create support ticket priority enum
CREATE TYPE public.support_priority AS ENUM ('low', 'normal', 'high', 'urgent', 'critical');

-- Create support ticket status enum
CREATE TYPE public.support_status AS ENUM (
  'open',
  'in_progress', 
  'waiting_for_customer',
  'waiting_for_agent',
  'escalated',
  'resolved',
  'closed'
);

-- Enhanced support tickets table
CREATE TABLE public.support_tickets_v2 (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_number TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL,
  category public.support_category NOT NULL,
  priority public.support_priority NOT NULL DEFAULT 'normal',
  status public.support_status NOT NULL DEFAULT 'open',
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  assigned_agent_id UUID,
  resolution_notes TEXT,
  satisfaction_rating INTEGER CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),
  satisfaction_feedback TEXT,
  first_response_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  closed_at TIMESTAMP WITH TIME ZONE,
  due_date TIMESTAMP WITH TIME ZONE,
  tags TEXT[],
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Support ticket messages/replies
CREATE TABLE public.support_ticket_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.support_tickets_v2(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  sender_type TEXT NOT NULL DEFAULT 'user', -- 'user', 'agent', 'system'
  message TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false, -- for agent-only messages
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Support ticket attachments
CREATE TABLE public.support_ticket_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.support_tickets_v2(id) ON DELETE CASCADE,
  message_id UUID REFERENCES public.support_ticket_messages(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Support knowledge base
CREATE TABLE public.support_knowledge_base (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category public.support_category,
  tags TEXT[],
  is_published BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  not_helpful_count INTEGER DEFAULT 0,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Support SLA tracking
CREATE TABLE public.support_sla_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.support_tickets_v2(id) ON DELETE CASCADE,
  priority public.support_priority NOT NULL,
  first_response_sla_hours INTEGER NOT NULL,
  resolution_sla_hours INTEGER NOT NULL,
  first_response_due_at TIMESTAMP WITH TIME ZONE NOT NULL,
  resolution_due_at TIMESTAMP WITH TIME ZONE NOT NULL,
  first_response_met BOOLEAN,
  resolution_met BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.support_tickets_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_ticket_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_sla_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies for support_tickets_v2
CREATE POLICY "Users can view their own tickets" ON public.support_tickets_v2
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own tickets" ON public.support_tickets_v2
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own tickets" ON public.support_tickets_v2
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Support agents can view all tickets" ON public.support_tickets_v2
  FOR ALL USING (is_admin()); -- Assuming support agents have admin access

-- RLS Policies for support_ticket_messages
CREATE POLICY "Users can view messages for their tickets" ON public.support_ticket_messages
  FOR SELECT USING (
    ticket_id IN (
      SELECT id FROM public.support_tickets_v2 
      WHERE user_id = auth.uid()
    ) OR is_admin()
  );

CREATE POLICY "Users can create messages for their tickets" ON public.support_ticket_messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    ticket_id IN (
      SELECT id FROM public.support_tickets_v2 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Support agents can manage all messages" ON public.support_ticket_messages
  FOR ALL USING (is_admin());

-- RLS Policies for knowledge base
CREATE POLICY "Everyone can view published knowledge base" ON public.support_knowledge_base
  FOR SELECT USING (is_published = true);

CREATE POLICY "Support agents can manage knowledge base" ON public.support_knowledge_base
  FOR ALL USING (is_admin());

-- Update triggers
CREATE TRIGGER update_support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets_v2
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_knowledge_base_updated_at
  BEFORE UPDATE ON public.support_knowledge_base
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate ticket numbers
CREATE OR REPLACE FUNCTION public.generate_ticket_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  ticket_num TEXT;
  counter INTEGER;
BEGIN
  -- Get today's date in YYYYMMDD format
  ticket_num := 'TK' || to_char(now(), 'YYYYMMDD');
  
  -- Get the count of tickets created today
  SELECT COUNT(*) INTO counter
  FROM public.support_tickets_v2
  WHERE ticket_number LIKE ticket_num || '%';
  
  -- Append sequence number
  ticket_num := ticket_num || LPAD((counter + 1)::TEXT, 4, '0');
  
  RETURN ticket_num;
END;
$$;

-- Function to calculate SLA times
CREATE OR REPLACE FUNCTION public.calculate_sla_times(
  priority_level public.support_priority
)
RETURNS TABLE(
  first_response_hours INTEGER,
  resolution_hours INTEGER
)
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  CASE priority_level
    WHEN 'critical' THEN
      RETURN QUERY SELECT 1, 4;
    WHEN 'urgent' THEN
      RETURN QUERY SELECT 2, 8;
    WHEN 'high' THEN
      RETURN QUERY SELECT 4, 24;
    WHEN 'normal' THEN
      RETURN QUERY SELECT 8, 72;
    WHEN 'low' THEN
      RETURN QUERY SELECT 24, 168;
    ELSE
      RETURN QUERY SELECT 8, 72;
  END CASE;
END;
$$;

-- Trigger function for automatic SLA tracking
CREATE OR REPLACE FUNCTION public.create_sla_tracking()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  sla_times RECORD;
BEGIN
  -- Get SLA times for the priority
  SELECT * INTO sla_times FROM public.calculate_sla_times(NEW.priority);
  
  -- Create SLA tracking record
  INSERT INTO public.support_sla_tracking (
    ticket_id,
    priority,
    first_response_sla_hours,
    resolution_sla_hours,
    first_response_due_at,
    resolution_due_at
  ) VALUES (
    NEW.id,
    NEW.priority,
    sla_times.first_response_hours,
    sla_times.resolution_hours,
    NEW.created_at + (sla_times.first_response_hours || ' hours')::INTERVAL,
    NEW.created_at + (sla_times.resolution_hours || ' hours')::INTERVAL
  );
  
  RETURN NEW;
END;
$$;

-- Trigger to create SLA tracking on ticket creation
CREATE TRIGGER create_sla_tracking_trigger
  AFTER INSERT ON public.support_tickets_v2
  FOR EACH ROW
  EXECUTE FUNCTION public.create_sla_tracking();

-- Function to auto-assign tickets based on category
CREATE OR REPLACE FUNCTION public.auto_assign_support_ticket(
  ticket_id_param UUID
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  ticket_record RECORD;
  agent_id UUID;
BEGIN
  -- Get ticket details
  SELECT * INTO ticket_record FROM public.support_tickets_v2 WHERE id = ticket_id_param;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Simple auto-assignment logic (can be enhanced)
  -- For now, just assign to any available admin/agent
  SELECT id INTO agent_id 
  FROM public.profiles 
  WHERE role = 'admin' 
  LIMIT 1;
  
  IF agent_id IS NOT NULL THEN
    UPDATE public.support_tickets_v2
    SET assigned_agent_id = agent_id,
        status = 'in_progress',
        updated_at = now()
    WHERE id = ticket_id_param;
  END IF;
END;
$$;

-- Function to update SLA status when responses are made
CREATE OR REPLACE FUNCTION public.update_sla_on_response()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- If this is the first agent response, mark first response SLA as met
  IF NEW.sender_type = 'agent' AND 
     NOT EXISTS(
       SELECT 1 FROM public.support_ticket_messages 
       WHERE ticket_id = NEW.ticket_id 
       AND sender_type = 'agent' 
       AND id != NEW.id
     ) THEN
    
    UPDATE public.support_sla_tracking
    SET first_response_met = (now() <= first_response_due_at),
        first_response_at = now()
    WHERE ticket_id = NEW.ticket_id;
    
    -- Update ticket with first response time
    UPDATE public.support_tickets_v2
    SET first_response_at = now()
    WHERE id = NEW.ticket_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger to update SLA on message creation
CREATE TRIGGER update_sla_on_response_trigger
  AFTER INSERT ON public.support_ticket_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_sla_on_response();

-- Create storage bucket for support attachments
INSERT INTO storage.buckets (id, name, public) 
VALUES ('support-attachments', 'support-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for support attachments
CREATE POLICY "Users can upload attachments for their tickets" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'support-attachments' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view attachments for their tickets" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'support-attachments' AND (
      auth.uid()::text = (storage.foldername(name))[1] OR
      is_admin()
    )
  );

CREATE POLICY "Support agents can manage all support attachments" ON storage.objects
  FOR ALL USING (bucket_id = 'support-attachments' AND is_admin());
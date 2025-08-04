-- Dispute Resolution System Database Schema

-- Create dispute status enum
CREATE TYPE public.dispute_status AS ENUM ('open', 'under_review', 'awaiting_response', 'resolved', 'closed');

-- Create dispute category enum  
CREATE TYPE public.dispute_category AS ENUM (
  'quality_of_work',
  'payment_issues', 
  'communication_problems',
  'incomplete_work',
  'property_damage',
  'schedule_conflicts',
  'safety_concerns',
  'billing_disputes',
  'contract_violations',
  'other'
);

-- Main disputes table
CREATE TABLE public.disputes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  complainant_id UUID NOT NULL,
  respondent_id UUID NOT NULL,
  category public.dispute_category NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status public.dispute_status NOT NULL DEFAULT 'open',
  priority INTEGER DEFAULT 1 CHECK (priority >= 1 AND priority <= 5),
  resolution TEXT,
  resolved_by UUID,
  resolved_at TIMESTAMP WITH TIME ZONE,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Dispute messages for communication thread
CREATE TABLE public.dispute_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dispute_id UUID NOT NULL REFERENCES public.disputes(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  message TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false, -- for admin-only messages
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Dispute evidence/attachments
CREATE TABLE public.dispute_evidence (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dispute_id UUID NOT NULL REFERENCES public.disputes(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Dispute activity log
CREATE TABLE public.dispute_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dispute_id UUID NOT NULL REFERENCES public.disputes(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  performed_by UUID NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispute_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispute_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispute_activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies for disputes
CREATE POLICY "Users can view disputes they're involved in" ON public.disputes
  FOR SELECT USING (
    complainant_id = auth.uid() OR 
    respondent_id = auth.uid() OR 
    is_admin()
  );

CREATE POLICY "Users can create disputes" ON public.disputes
  FOR INSERT WITH CHECK (complainant_id = auth.uid());

CREATE POLICY "Admins can update disputes" ON public.disputes
  FOR UPDATE USING (is_admin());

-- RLS Policies for dispute_messages
CREATE POLICY "Users can view messages in their disputes" ON public.dispute_messages
  FOR SELECT USING (
    dispute_id IN (
      SELECT id FROM public.disputes 
      WHERE complainant_id = auth.uid() OR respondent_id = auth.uid()
    ) OR is_admin()
  );

CREATE POLICY "Users can send messages in their disputes" ON public.dispute_messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    dispute_id IN (
      SELECT id FROM public.disputes 
      WHERE complainant_id = auth.uid() OR respondent_id = auth.uid()
    )
  );

CREATE POLICY "Admins can send internal messages" ON public.dispute_messages
  FOR INSERT WITH CHECK (is_admin());

-- RLS Policies for dispute_evidence
CREATE POLICY "Users can view evidence in their disputes" ON public.dispute_evidence
  FOR SELECT USING (
    dispute_id IN (
      SELECT id FROM public.disputes 
      WHERE complainant_id = auth.uid() OR respondent_id = auth.uid()
    ) OR is_admin()
  );

CREATE POLICY "Users can upload evidence to their disputes" ON public.dispute_evidence
  FOR INSERT WITH CHECK (
    uploaded_by = auth.uid() AND
    dispute_id IN (
      SELECT id FROM public.disputes 
      WHERE complainant_id = auth.uid() OR respondent_id = auth.uid()
    )
  );

-- RLS Policies for dispute_activities
CREATE POLICY "Users can view activities in their disputes" ON public.dispute_activities
  FOR SELECT USING (
    dispute_id IN (
      SELECT id FROM public.disputes 
      WHERE complainant_id = auth.uid() OR respondent_id = auth.uid()
    ) OR is_admin()
  );

-- Update triggers for updated_at
CREATE TRIGGER update_disputes_updated_at
  BEFORE UPDATE ON public.disputes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to log dispute activities
CREATE OR REPLACE FUNCTION public.log_dispute_activity(
  dispute_id_param UUID,
  action_param TEXT,
  performed_by_param UUID,
  details_param JSONB DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.dispute_activities (dispute_id, action, performed_by, details)
  VALUES (dispute_id_param, action_param, performed_by_param, details_param);
END;
$$;

-- Function to update dispute status with activity logging
CREATE OR REPLACE FUNCTION public.update_dispute_status(
  dispute_id_param UUID,
  new_status_param public.dispute_status,
  resolution_param TEXT DEFAULT NULL,
  admin_notes_param TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  old_status public.dispute_status;
  admin_id UUID;
BEGIN
  -- Get current status
  SELECT status INTO old_status FROM public.disputes WHERE id = dispute_id_param;
  
  -- Update dispute
  UPDATE public.disputes 
  SET status = new_status_param,
      resolution = COALESCE(resolution_param, resolution),
      admin_notes = COALESCE(admin_notes_param, admin_notes),
      resolved_by = CASE WHEN new_status_param = 'resolved' THEN auth.uid() ELSE resolved_by END,
      resolved_at = CASE WHEN new_status_param = 'resolved' THEN now() ELSE resolved_at END,
      updated_at = now()
  WHERE id = dispute_id_param;
  
  -- Log activity
  PERFORM public.log_dispute_activity(
    dispute_id_param,
    'status_changed',
    auth.uid(),
    jsonb_build_object(
      'old_status', old_status,
      'new_status', new_status_param,
      'resolution', resolution_param
    )
  );
END;
$$;

-- Create storage bucket for dispute evidence
INSERT INTO storage.buckets (id, name, public) 
VALUES ('dispute-evidence', 'dispute-evidence', false);

-- Storage policies for dispute evidence
CREATE POLICY "Users can upload evidence for their disputes" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'dispute-evidence' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view evidence in their disputes" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'dispute-evidence' AND (
      auth.uid()::text = (storage.foldername(name))[1] OR
      is_admin()
    )
  );

CREATE POLICY "Admins can manage all dispute evidence" ON storage.objects
  FOR ALL USING (bucket_id = 'dispute-evidence' AND is_admin());
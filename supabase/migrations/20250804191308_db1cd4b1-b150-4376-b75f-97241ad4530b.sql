-- Withdrawal System for Artisans Database Schema

-- Create withdrawal status enum
CREATE TYPE public.withdrawal_status AS ENUM (
  'pending',
  'processing', 
  'approved',
  'completed',
  'failed',
  'rejected',
  'cancelled'
);

-- Create withdrawal method enum
CREATE TYPE public.withdrawal_method AS ENUM (
  'bank_transfer',
  'mobile_money',
  'paypal',
  'stripe',
  'crypto'
);

-- Artisan earnings tracking table
CREATE TABLE public.artisan_earnings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  artisan_id UUID NOT NULL,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  transaction_id UUID REFERENCES public.payment_transactions(id) ON DELETE SET NULL,
  amount NUMERIC(10,2) NOT NULL,
  platform_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  net_amount NUMERIC(10,2) NOT NULL, -- amount - platform_fee
  currency TEXT NOT NULL DEFAULT 'NGN',
  earning_type TEXT NOT NULL DEFAULT 'job_completion', -- 'job_completion', 'bonus', 'referral', 'adjustment'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'available', 'withdrawn', 'held'
  available_for_withdrawal_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Withdrawal requests table
CREATE TABLE public.withdrawal_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  artisan_id UUID NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'NGN',
  withdrawal_method public.withdrawal_method NOT NULL,
  status public.withdrawal_status NOT NULL DEFAULT 'pending',
  
  -- Bank details
  bank_name TEXT,
  account_number TEXT,
  account_name TEXT,
  bank_code TEXT,
  
  -- Mobile money details
  mobile_number TEXT,
  mobile_network TEXT,
  
  -- PayPal details
  paypal_email TEXT,
  
  -- Processing information
  processed_by UUID,
  processed_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Transaction reference from payment processor
  external_reference TEXT,
  processor_response JSONB,
  
  -- Fees and final amounts
  processing_fee NUMERIC(10,2) DEFAULT 0,
  final_amount NUMERIC(10,2), -- amount - processing_fee
  
  -- Admin notes and rejection reason
  admin_notes TEXT,
  rejection_reason TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Artisan payment methods table
CREATE TABLE public.artisan_payment_methods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  artisan_id UUID NOT NULL,
  method_type public.withdrawal_method NOT NULL,
  is_default BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  
  -- Bank details
  bank_name TEXT,
  account_number TEXT,
  account_name TEXT,
  bank_code TEXT,
  
  -- Mobile money details
  mobile_number TEXT,
  mobile_network TEXT,
  
  -- PayPal details
  paypal_email TEXT,
  
  -- Verification information
  verification_status TEXT DEFAULT 'pending', -- 'pending', 'verified', 'failed'
  verification_notes TEXT,
  verified_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(artisan_id, method_type, account_number),
  UNIQUE(artisan_id, method_type, mobile_number),
  UNIQUE(artisan_id, method_type, paypal_email)
);

-- Withdrawal limits and settings
CREATE TABLE public.withdrawal_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  artisan_id UUID NOT NULL UNIQUE,
  min_withdrawal_amount NUMERIC(10,2) DEFAULT 1000.00,
  max_withdrawal_amount NUMERIC(10,2) DEFAULT 500000.00,
  daily_withdrawal_limit NUMERIC(10,2) DEFAULT 100000.00,
  weekly_withdrawal_limit NUMERIC(10,2) DEFAULT 500000.00,
  monthly_withdrawal_limit NUMERIC(10,2) DEFAULT 2000000.00,
  auto_withdrawal_enabled BOOLEAN DEFAULT false,
  auto_withdrawal_threshold NUMERIC(10,2) DEFAULT 50000.00,
  auto_withdrawal_day INTEGER DEFAULT 1, -- Day of month for auto withdrawal
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.artisan_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artisan_payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for artisan_earnings
CREATE POLICY "Artisans can view their own earnings" ON public.artisan_earnings
  FOR SELECT USING (artisan_id = auth.uid());

CREATE POLICY "Admins can view all earnings" ON public.artisan_earnings
  FOR ALL USING (is_admin());

-- RLS Policies for withdrawal_requests
CREATE POLICY "Artisans can view their own withdrawal requests" ON public.withdrawal_requests
  FOR SELECT USING (artisan_id = auth.uid());

CREATE POLICY "Artisans can create withdrawal requests" ON public.withdrawal_requests
  FOR INSERT WITH CHECK (artisan_id = auth.uid());

CREATE POLICY "Artisans can update their pending withdrawal requests" ON public.withdrawal_requests
  FOR UPDATE USING (artisan_id = auth.uid() AND status = 'pending');

CREATE POLICY "Admins can manage all withdrawal requests" ON public.withdrawal_requests
  FOR ALL USING (is_admin());

-- RLS Policies for artisan_payment_methods
CREATE POLICY "Artisans can manage their own payment methods" ON public.artisan_payment_methods
  FOR ALL USING (artisan_id = auth.uid());

CREATE POLICY "Admins can view all payment methods" ON public.artisan_payment_methods
  FOR SELECT USING (is_admin());

-- RLS Policies for withdrawal_settings
CREATE POLICY "Artisans can manage their own withdrawal settings" ON public.withdrawal_settings
  FOR ALL USING (artisan_id = auth.uid());

CREATE POLICY "Admins can manage all withdrawal settings" ON public.withdrawal_settings
  FOR ALL USING (is_admin());

-- Update triggers
CREATE TRIGGER update_artisan_earnings_updated_at
  BEFORE UPDATE ON public.artisan_earnings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_withdrawal_requests_updated_at
  BEFORE UPDATE ON public.withdrawal_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_artisan_payment_methods_updated_at
  BEFORE UPDATE ON public.artisan_payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_withdrawal_settings_updated_at
  BEFORE UPDATE ON public.withdrawal_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to get artisan available balance
CREATE OR REPLACE FUNCTION public.get_artisan_balance(artisan_id_param UUID)
RETURNS TABLE(
  total_earnings NUMERIC,
  available_balance NUMERIC,
  pending_withdrawals NUMERIC,
  withdrawn_amount NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(ae.net_amount), 0) as total_earnings,
    COALESCE(SUM(CASE WHEN ae.status = 'available' THEN ae.net_amount ELSE 0 END), 0) as available_balance,
    COALESCE(SUM(wr.amount), 0) as pending_withdrawals,
    COALESCE(SUM(CASE WHEN ae.status = 'withdrawn' THEN ae.net_amount ELSE 0 END), 0) as withdrawn_amount
  FROM public.artisan_earnings ae
  LEFT JOIN public.withdrawal_requests wr ON ae.artisan_id = wr.artisan_id 
    AND wr.status IN ('pending', 'processing', 'approved')
  WHERE ae.artisan_id = artisan_id_param;
END;
$$;

-- Function to validate withdrawal request
CREATE OR REPLACE FUNCTION public.validate_withdrawal_request(
  artisan_id_param UUID,
  amount_param NUMERIC
)
RETURNS TABLE(
  is_valid BOOLEAN,
  error_message TEXT,
  available_balance NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  balance_info RECORD;
  settings_info RECORD;
  today_withdrawals NUMERIC;
  week_withdrawals NUMERIC;
  month_withdrawals NUMERIC;
BEGIN
  -- Get artisan balance
  SELECT * INTO balance_info FROM public.get_artisan_balance(artisan_id_param);
  
  -- Get withdrawal settings
  SELECT * INTO settings_info FROM public.withdrawal_settings WHERE artisan_id = artisan_id_param;
  
  -- If no settings exist, use defaults
  IF NOT FOUND THEN
    settings_info.min_withdrawal_amount := 1000.00;
    settings_info.max_withdrawal_amount := 500000.00;
    settings_info.daily_withdrawal_limit := 100000.00;
    settings_info.weekly_withdrawal_limit := 500000.00;
    settings_info.monthly_withdrawal_limit := 2000000.00;
  END IF;
  
  -- Check if sufficient balance
  IF amount_param > balance_info.available_balance THEN
    RETURN QUERY SELECT false, 'Insufficient available balance', balance_info.available_balance;
    RETURN;
  END IF;
  
  -- Check minimum amount
  IF amount_param < settings_info.min_withdrawal_amount THEN
    RETURN QUERY SELECT false, 'Amount below minimum withdrawal limit', balance_info.available_balance;
    RETURN;
  END IF;
  
  -- Check maximum amount
  IF amount_param > settings_info.max_withdrawal_amount THEN
    RETURN QUERY SELECT false, 'Amount exceeds maximum withdrawal limit', balance_info.available_balance;
    RETURN;
  END IF;
  
  -- Check daily limit
  SELECT COALESCE(SUM(amount), 0) INTO today_withdrawals
  FROM public.withdrawal_requests
  WHERE artisan_id = artisan_id_param
  AND DATE(created_at) = CURRENT_DATE
  AND status NOT IN ('rejected', 'cancelled');
  
  IF (today_withdrawals + amount_param) > settings_info.daily_withdrawal_limit THEN
    RETURN QUERY SELECT false, 'Daily withdrawal limit exceeded', balance_info.available_balance;
    RETURN;
  END IF;
  
  -- Check weekly limit
  SELECT COALESCE(SUM(amount), 0) INTO week_withdrawals
  FROM public.withdrawal_requests
  WHERE artisan_id = artisan_id_param
  AND created_at >= date_trunc('week', now())
  AND status NOT IN ('rejected', 'cancelled');
  
  IF (week_withdrawals + amount_param) > settings_info.weekly_withdrawal_limit THEN
    RETURN QUERY SELECT false, 'Weekly withdrawal limit exceeded', balance_info.available_balance;
    RETURN;
  END IF;
  
  -- Check monthly limit
  SELECT COALESCE(SUM(amount), 0) INTO month_withdrawals
  FROM public.withdrawal_requests
  WHERE artisan_id = artisan_id_param
  AND created_at >= date_trunc('month', now())
  AND status NOT IN ('rejected', 'cancelled');
  
  IF (month_withdrawals + amount_param) > settings_info.monthly_withdrawal_limit THEN
    RETURN QUERY SELECT false, 'Monthly withdrawal limit exceeded', balance_info.available_balance;
    RETURN;
  END IF;
  
  -- All validations passed
  RETURN QUERY SELECT true, 'Validation successful', balance_info.available_balance;
END;
$$;

-- Function to process withdrawal completion
CREATE OR REPLACE FUNCTION public.complete_withdrawal(
  withdrawal_id_param UUID,
  external_reference_param TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  withdrawal_record RECORD;
  earnings_to_mark UUID[];
BEGIN
  -- Get withdrawal details
  SELECT * INTO withdrawal_record FROM public.withdrawal_requests WHERE id = withdrawal_id_param;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Withdrawal request not found';
  END IF;
  
  -- Update withdrawal status
  UPDATE public.withdrawal_requests
  SET status = 'completed',
      completed_at = now(),
      external_reference = external_reference_param,
      updated_at = now()
  WHERE id = withdrawal_id_param;
  
  -- Mark earnings as withdrawn (FIFO basis)
  WITH earnings_to_withdraw AS (
    SELECT id, net_amount,
           SUM(net_amount) OVER (ORDER BY created_at) as running_total
    FROM public.artisan_earnings
    WHERE artisan_id = withdrawal_record.artisan_id
    AND status = 'available'
    ORDER BY created_at
  )
  SELECT ARRAY_AGG(id) INTO earnings_to_mark
  FROM earnings_to_withdraw
  WHERE running_total <= withdrawal_record.amount;
  
  -- Update earnings status
  UPDATE public.artisan_earnings
  SET status = 'withdrawn',
      updated_at = now()
  WHERE id = ANY(earnings_to_mark);
END;
$$;

-- Function to record artisan earning
CREATE OR REPLACE FUNCTION public.record_artisan_earning(
  artisan_id_param UUID,
  booking_id_param UUID,
  amount_param NUMERIC,
  platform_fee_param NUMERIC DEFAULT 0,
  earning_type_param TEXT DEFAULT 'job_completion'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  earning_id UUID;
  net_amount NUMERIC;
BEGIN
  net_amount := amount_param - platform_fee_param;
  
  INSERT INTO public.artisan_earnings (
    artisan_id,
    booking_id,
    amount,
    platform_fee,
    net_amount,
    earning_type,
    status
  ) VALUES (
    artisan_id_param,
    booking_id_param,
    amount_param,
    platform_fee_param,
    net_amount,
    earning_type_param,
    'available'
  ) RETURNING id INTO earning_id;
  
  RETURN earning_id;
END;
$$;
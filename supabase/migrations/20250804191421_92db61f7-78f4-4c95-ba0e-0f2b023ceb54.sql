-- Updated Withdrawal System for Artisans Database Schema
-- (Avoiding conflicts with existing tables)

-- Create withdrawal status enum if not exists
DO $$ BEGIN
    CREATE TYPE public.withdrawal_status AS ENUM (
      'pending',
      'processing', 
      'approved',
      'completed',
      'failed',
      'rejected',
      'cancelled'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create withdrawal method enum if not exists
DO $$ BEGIN
    CREATE TYPE public.withdrawal_method AS ENUM (
      'bank_transfer',
      'mobile_money',
      'paypal',
      'stripe',
      'crypto'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Artisan earnings tracking table (new table name to avoid conflicts)
CREATE TABLE IF NOT EXISTS public.artisan_earnings_v2 (
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

-- Enhanced withdrawal requests table (using new name to avoid conflicts)
CREATE TABLE IF NOT EXISTS public.withdrawal_requests_v2 (
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
CREATE TABLE IF NOT EXISTS public.artisan_payment_methods (
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
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Withdrawal limits and settings
CREATE TABLE IF NOT EXISTS public.withdrawal_settings (
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
ALTER TABLE public.artisan_earnings_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_requests_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artisan_payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for artisan_earnings_v2
CREATE POLICY "Artisans can view their own earnings v2" ON public.artisan_earnings_v2
  FOR SELECT USING (artisan_id = auth.uid());

CREATE POLICY "Admins can view all earnings v2" ON public.artisan_earnings_v2
  FOR ALL USING (is_admin());

-- RLS Policies for withdrawal_requests_v2
CREATE POLICY "Artisans can view their own withdrawal requests v2" ON public.withdrawal_requests_v2
  FOR SELECT USING (artisan_id = auth.uid());

CREATE POLICY "Artisans can create withdrawal requests v2" ON public.withdrawal_requests_v2
  FOR INSERT WITH CHECK (artisan_id = auth.uid());

CREATE POLICY "Artisans can update their pending withdrawal requests v2" ON public.withdrawal_requests_v2
  FOR UPDATE USING (artisan_id = auth.uid() AND status = 'pending');

CREATE POLICY "Admins can manage all withdrawal requests v2" ON public.withdrawal_requests_v2
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
CREATE TRIGGER update_artisan_earnings_v2_updated_at
  BEFORE UPDATE ON public.artisan_earnings_v2
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_withdrawal_requests_v2_updated_at
  BEFORE UPDATE ON public.withdrawal_requests_v2
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

-- Function to get artisan available balance (updated for v2 tables)
CREATE OR REPLACE FUNCTION public.get_artisan_balance_v2(artisan_id_param UUID)
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
  FROM public.artisan_earnings_v2 ae
  LEFT JOIN public.withdrawal_requests_v2 wr ON ae.artisan_id = wr.artisan_id 
    AND wr.status IN ('pending', 'processing', 'approved')
  WHERE ae.artisan_id = artisan_id_param;
END;
$$;

-- Function to validate withdrawal request (updated for v2 tables)
CREATE OR REPLACE FUNCTION public.validate_withdrawal_request_v2(
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
  SELECT * INTO balance_info FROM public.get_artisan_balance_v2(artisan_id_param);
  
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
  FROM public.withdrawal_requests_v2
  WHERE artisan_id = artisan_id_param
  AND DATE(created_at) = CURRENT_DATE
  AND status NOT IN ('rejected', 'cancelled');
  
  IF (today_withdrawals + amount_param) > settings_info.daily_withdrawal_limit THEN
    RETURN QUERY SELECT false, 'Daily withdrawal limit exceeded', balance_info.available_balance;
    RETURN;
  END IF;
  
  -- All validations passed
  RETURN QUERY SELECT true, 'Validation successful', balance_info.available_balance;
END;
$$;
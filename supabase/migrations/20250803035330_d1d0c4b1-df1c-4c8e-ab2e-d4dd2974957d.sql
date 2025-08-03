-- Create payment transactions table
CREATE TABLE public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  booking_id UUID,
  artisan_id UUID,
  client_id UUID,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'NGN',
  paystack_reference TEXT UNIQUE,
  payment_status TEXT DEFAULT 'pending',
  transaction_type TEXT NOT NULL, -- 'booking_payment', 'profile_boost', 'withdrawal'
  platform_fee DECIMAL(10,2) DEFAULT 0,
  artisan_earnings DECIMAL(10,2) DEFAULT 0,
  escrow_status TEXT DEFAULT 'held', -- 'held', 'released', 'disputed'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create escrow table for secure payments
CREATE TABLE public.escrow_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID REFERENCES public.payment_transactions(id) ON DELETE CASCADE,
  booking_id UUID,
  client_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  artisan_id UUID,
  amount DECIMAL(10,2) NOT NULL,
  platform_fee DECIMAL(10,2) NOT NULL,
  artisan_amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'released', 'disputed', 'refunded'
  release_date TIMESTAMP WITH TIME ZONE,
  auto_release_date TIMESTAMP WITH TIME ZONE,
  dispute_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create withdrawal requests table
CREATE TABLE public.withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artisan_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  bank_account_number TEXT NOT NULL,
  bank_code TEXT NOT NULL,
  account_name TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  paystack_transfer_code TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all payment tables
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escrow_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payment_transactions
CREATE POLICY "Users can view their own transactions" ON public.payment_transactions
  FOR SELECT USING (
    user_id = auth.uid() OR 
    artisan_id = auth.uid() OR 
    client_id = auth.uid()
  );

CREATE POLICY "Users can create transactions" ON public.payment_transactions
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- RLS Policies for escrow_payments  
CREATE POLICY "Users can view their escrow payments" ON public.escrow_payments
  FOR SELECT USING (
    client_id = auth.uid() OR 
    artisan_id = auth.uid()
  );

-- RLS Policies for withdrawal_requests
CREATE POLICY "Artisans can view their withdrawal requests" ON public.withdrawal_requests
  FOR SELECT USING (artisan_id = auth.uid());

CREATE POLICY "Artisans can create withdrawal requests" ON public.withdrawal_requests
  FOR INSERT WITH CHECK (artisan_id = auth.uid());

CREATE POLICY "Artisans can update their withdrawal requests" ON public.withdrawal_requests
  FOR UPDATE USING (artisan_id = auth.uid());

-- Create function to calculate platform fees
CREATE OR REPLACE FUNCTION calculate_platform_fee(amount DECIMAL)
RETURNS DECIMAL AS $$
BEGIN
  -- 10% platform fee
  RETURN ROUND(amount * 0.10, 2);
END;
$$ LANGUAGE plpgsql;

-- Create function to calculate artisan earnings
CREATE OR REPLACE FUNCTION calculate_artisan_earnings(amount DECIMAL)
RETURNS DECIMAL AS $$
BEGIN
  -- 90% goes to artisan (amount minus 10% platform fee)
  RETURN ROUND(amount * 0.90, 2);
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_payment_transactions_updated_at
  BEFORE UPDATE ON public.payment_transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_escrow_payments_updated_at
  BEFORE UPDATE ON public.escrow_payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
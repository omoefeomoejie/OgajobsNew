-- Fix security warnings by updating function search paths
CREATE OR REPLACE FUNCTION calculate_platform_fee(amount DECIMAL)
RETURNS DECIMAL AS $$
BEGIN
  -- 10% platform fee
  RETURN ROUND(amount * 0.10, 2);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = '';

CREATE OR REPLACE FUNCTION calculate_artisan_earnings(amount DECIMAL)
RETURNS DECIMAL AS $$
BEGIN
  -- 90% goes to artisan (amount minus 10% platform fee)
  RETURN ROUND(amount * 0.90, 2);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = '';

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '';
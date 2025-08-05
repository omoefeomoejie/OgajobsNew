-- Fix security warnings for new dynamic pricing functions
ALTER FUNCTION public.calculate_dynamic_price(TEXT, NUMERIC, TEXT, TIMESTAMP WITH TIME ZONE, UUID, TEXT) SET search_path = '';
ALTER FUNCTION public.update_market_conditions() SET search_path = '';
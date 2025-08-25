-- Fix remaining functions missing search_path parameter
CREATE OR REPLACE FUNCTION public.get_artisan_balance_v2(artisan_id_param uuid)
RETURNS TABLE(total_earnings numeric, available_balance numeric, pending_withdrawals numeric, withdrawn_amount numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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
-- Enhance the bookings table with additional fields for better workflow
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending', -- 'pending', 'assigned', 'paid', 'in_progress', 'completed', 'cancelled'
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS urgency TEXT DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS budget DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS artisan_id UUID,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'unpaid', -- 'unpaid', 'paid', 'refunded'
ADD COLUMN IF NOT EXISTS completion_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON public.bookings(payment_status);

-- Add trigger to update the updated_at timestamp
CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add foreign key reference to payment_transactions
ALTER TABLE public.payment_transactions 
ADD CONSTRAINT fk_payment_booking 
FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE SET NULL;

-- Add booking completion workflow function
CREATE OR REPLACE FUNCTION complete_booking(booking_id_param UUID, completed_by_param UUID)
RETURNS JSON AS $$
DECLARE
  booking_record RECORD;
  result JSON;
BEGIN
  -- Get booking details
  SELECT * INTO booking_record FROM public.bookings WHERE id = booking_id_param;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Booking not found');
  END IF;
  
  -- Check if user is authorized to complete (either client or assigned artisan)
  IF booking_record.client_id != completed_by_param AND booking_record.artisan_id != completed_by_param THEN
    RETURN json_build_object('success', false, 'message', 'Not authorized to complete this booking');
  END IF;
  
  -- Update booking status
  UPDATE public.bookings 
  SET status = 'completed', 
      completion_date = now(),
      updated_at = now()
  WHERE id = booking_id_param;
  
  RETURN json_build_object('success', true, 'message', 'Booking completed successfully');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '';

-- Create RLS policies for the enhanced bookings table
CREATE POLICY "Enhanced booking access" ON public.bookings
FOR ALL USING (
  client_email = auth.email() OR 
  artisan_email = auth.email() OR
  artisan_id = auth.uid() OR
  is_admin()
);

-- Drop the old policies and recreate
DROP POLICY IF EXISTS "Clients can view their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Clients can create bookings" ON public.bookings;  
DROP POLICY IF EXISTS "Artisans can view bookings assigned to them" ON public.bookings;
DROP POLICY IF EXISTS "Artisans can update bookings assigned to them" ON public.bookings;
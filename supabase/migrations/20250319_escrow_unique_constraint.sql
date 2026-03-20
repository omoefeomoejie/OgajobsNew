-- Prevent duplicate escrow records for the same booking
-- Protects against Paystack webhook retries creating double-payment
ALTER TABLE public.escrow_payments
ADD CONSTRAINT escrow_payments_booking_id_unique UNIQUE (booking_id);

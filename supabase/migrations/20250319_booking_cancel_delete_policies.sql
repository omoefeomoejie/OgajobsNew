-- Allow clients to cancel their own pending bookings
CREATE POLICY "clients_can_cancel_own_bookings"
ON public.bookings FOR UPDATE
USING (
  client_email = auth.email()
  AND status = 'pending'
)
WITH CHECK (
  client_email = auth.email()
  AND status = 'cancelled'
);

-- Allow clients to delete their own cancelled or completed bookings
CREATE POLICY "clients_can_delete_own_bookings"
ON public.bookings FOR DELETE
USING (
  client_email = auth.email()
  AND status IN ('cancelled', 'completed')
);

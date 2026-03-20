-- Add client_id column to bookings table for direct user lookup.
-- This prevents email-mismatch issues where client_email may differ
-- from what is stored at auth time.
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES auth.users(id);

-- Backfill client_id from profiles table using client_email
UPDATE public.bookings b
SET client_id = p.id
FROM public.profiles p
WHERE p.email = b.client_email
  AND b.client_id IS NULL;

-- Drop the old artisan-only open-bookings policy and replace with
-- a single comprehensive policy that covers all access patterns.
DROP POLICY IF EXISTS "artisans_view_open_bookings" ON public.bookings;
DROP POLICY IF EXISTS "bookings_access_policy" ON public.bookings;

CREATE POLICY "bookings_access_policy"
ON public.bookings FOR ALL
USING (
  -- Open requests: any verified artisan can see unassigned pending bookings
  (
    status = 'pending'
    AND artisan_id IS NULL
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'artisan'
    )
  )
  -- Artisan sees their own accepted / active jobs
  OR artisan_id = auth.uid()
  -- Client sees their own bookings (by email or by client_id)
  OR client_email = auth.email()
  OR client_id = auth.uid()
  -- Admin sees everything
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  )
);

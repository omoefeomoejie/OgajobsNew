-- Allow users to read conversations they are part of
CREATE POLICY "users_can_read_own_conversations"
ON public.conversations FOR SELECT
USING (
  client_email = auth.email()
  OR artisan_id = auth.uid()
);

-- Allow artisans to create conversations
CREATE POLICY "artisans_can_create_conversations"
ON public.conversations FOR INSERT
WITH CHECK (
  artisan_id = auth.uid()
);

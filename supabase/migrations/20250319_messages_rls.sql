-- Allow users to read messages where they are sender or receiver
CREATE POLICY "users_can_read_own_messages"
ON public.messages FOR SELECT
USING (
  sender_email = auth.email() OR receiver_email = auth.email()
);

-- Allow users to insert messages where they are the sender
CREATE POLICY "users_can_send_messages"
ON public.messages FOR INSERT
WITH CHECK (
  sender_email = auth.email()
);

ALTER TABLE public.chat_messages
  ADD COLUMN IF NOT EXISTS sender_type text NOT NULL DEFAULT 'user'
  CHECK(sender_type IN('user','tutor','teacher','admin','system'));

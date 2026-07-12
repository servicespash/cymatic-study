-- Migration for Isolated Institutional Chatrooms

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  level TEXT NOT NULL CHECK (level IN ('S1', 'S2', 'S3', 'S4', 'S5', 'S6')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view messages in their own school and level"
  ON public.chat_messages
  FOR SELECT
  USING (
    org_id = public.get_user_org_id(auth.uid()) AND 
    level = (SELECT level FROM public.profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can send messages to their own school and level"
  ON public.chat_messages
  FOR INSERT
  WITH CHECK (
    org_id = public.get_user_org_id(auth.uid()) AND 
    level = (SELECT level FROM public.profiles WHERE user_id = auth.uid()) AND
    auth.uid() = user_id
  );

-- Enable Realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

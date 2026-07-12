-- Drop the overly broad duplicate policy; keep the one that honours expires_at
DROP POLICY IF EXISTS "Active broadcasts are public" ON public.news_broadcasts;

-- Enable RLS on realtime.messages and scope subscriptions
ALTER TABLE IF EXISTS realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can read news_broadcasts channel" ON realtime.messages;
CREATE POLICY "Authenticated can read news_broadcasts channel"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  (realtime.topic() = 'news_broadcasts')
  AND (extension = 'postgres_changes')
);

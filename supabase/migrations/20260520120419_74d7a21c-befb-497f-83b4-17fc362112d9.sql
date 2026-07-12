ALTER TABLE public.news_broadcasts
  ADD COLUMN IF NOT EXISTS expires_at timestamptz;

UPDATE public.news_broadcasts
SET expires_at = now() + interval '14 days'
WHERE media_url = 'https://cjoayorozpsrcupbekkj.supabase.co/storage/v1/object/public/cymatics/broadcasts/busowoko-expo-2026.jpeg';

DROP POLICY IF EXISTS "Public can view active broadcasts" ON public.news_broadcasts;
CREATE POLICY "Public can view active broadcasts"
ON public.news_broadcasts
FOR SELECT
USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));
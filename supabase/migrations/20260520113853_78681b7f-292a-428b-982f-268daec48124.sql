-- Remove self-award points policy (points awarded only via SECURITY DEFINER RPCs)
DROP POLICY IF EXISTS "Users can insert own points" ON public.user_points;

-- Tighten SECURITY DEFINER function execution
REVOKE EXECUTE ON FUNCTION public.submit_quiz_attempt(text, jsonb) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.submit_quiz_attempt(text, jsonb) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_or_create_daily_task() FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.get_or_create_daily_task() TO authenticated;

-- Internal helpers should not be callable via PostgREST
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

-- Storage policies for 'cymatics' bucket
-- This bucket is intentionally allowed public read access for shared cymatics assets.
-- Authenticated users may still only insert/update/delete objects under their own folder.
DROP POLICY IF EXISTS "Cymatics public read" ON storage.objects;
CREATE POLICY "Cymatics public read"
ON storage.objects FOR SELECT
USING (bucket_id = 'cymatics');

DROP POLICY IF EXISTS "Authenticated users can upload to cymatics" ON storage.objects;
CREATE POLICY "Authenticated users can upload to cymatics"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'cymatics'
  AND auth.uid() IS NOT NULL
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users can update own cymatics files" ON storage.objects;
CREATE POLICY "Users can update own cymatics files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'cymatics'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users can delete own cymatics files" ON storage.objects;
CREATE POLICY "Users can delete own cymatics files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'cymatics'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
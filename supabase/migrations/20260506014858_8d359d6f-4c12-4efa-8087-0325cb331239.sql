
-- 1. Storage policies for the private 'news' bucket: deny all client access.
-- Service role bypasses RLS, so admin-side uploads still work; clients use signed URLs.
DROP POLICY IF EXISTS "news_no_client_select" ON storage.objects;
DROP POLICY IF EXISTS "news_no_client_insert" ON storage.objects;
DROP POLICY IF EXISTS "news_no_client_update" ON storage.objects;
DROP POLICY IF EXISTS "news_no_client_delete" ON storage.objects;

CREATE POLICY "news_no_client_select" ON storage.objects
  FOR SELECT TO authenticated, anon
  USING (bucket_id <> 'news');
CREATE POLICY "news_no_client_insert" ON storage.objects
  FOR INSERT TO authenticated, anon
  WITH CHECK (bucket_id <> 'news');
CREATE POLICY "news_no_client_update" ON storage.objects
  FOR UPDATE TO authenticated, anon
  USING (bucket_id <> 'news');
CREATE POLICY "news_no_client_delete" ON storage.objects
  FOR DELETE TO authenticated, anon
  USING (bucket_id <> 'news');

-- 2. Score range guard
ALTER TABLE public.task_attempts
  DROP CONSTRAINT IF EXISTS task_attempts_score_range;
ALTER TABLE public.task_attempts
  ADD CONSTRAINT task_attempts_score_range CHECK (score_pct BETWEEN 0 AND 100);

-- 3. Server-side submission function: validates input, derives passed + points
CREATE OR REPLACE FUNCTION public.submit_quiz_attempt(
  _topic_id text,
  _score_pct numeric
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  passed boolean;
  pts integer := 0;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF _topic_id IS NULL OR length(_topic_id) = 0 OR length(_topic_id) > 128 THEN
    RAISE EXCEPTION 'Invalid topic_id';
  END IF;
  IF _score_pct IS NULL OR _score_pct < 0 OR _score_pct > 100 THEN
    RAISE EXCEPTION 'Invalid score_pct';
  END IF;

  passed := _score_pct >= 70;

  INSERT INTO public.task_attempts (user_id, topic_id, score_pct, passed)
  VALUES (uid, _topic_id, _score_pct, passed);

  IF passed THEN
    pts := 10 + GREATEST(0, FLOOR((_score_pct - 70) / 5))::int;
    INSERT INTO public.user_points (user_id, points, source, meta)
    VALUES (uid, pts, 'quiz', jsonb_build_object('topic_id', _topic_id, 'score_pct', _score_pct));
  END IF;

  RETURN jsonb_build_object('passed', passed, 'points', pts);
END;
$$;

REVOKE ALL ON FUNCTION public.submit_quiz_attempt(text, numeric) FROM public;
GRANT EXECUTE ON FUNCTION public.submit_quiz_attempt(text, numeric) TO authenticated;

-- 4. Remove direct INSERT on user_points (only the SECURITY DEFINER function writes now)
DROP POLICY IF EXISTS points_insert_own ON public.user_points;

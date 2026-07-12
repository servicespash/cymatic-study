-- 1. app_config: only authenticated users may read (was public)
DROP POLICY IF EXISTS "App config is publicly readable" ON public.app_config;
CREATE POLICY "App config readable by authenticated users"
  ON public.app_config
  FOR SELECT
  TO authenticated
  USING (true);

-- 2. quiz_questions: restrict SELECT to authenticated users so correct_index
-- isn't anonymously scrapeable. Server-side scoring trigger uses SECURITY
-- DEFINER and is unaffected.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'quiz_questions'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "questions_select_all" ON public.quiz_questions';
    EXECUTE 'DROP POLICY IF EXISTS "Quiz questions readable by authenticated" ON public.quiz_questions';
    EXECUTE 'CREATE POLICY "Quiz questions readable by authenticated"
             ON public.quiz_questions FOR SELECT TO authenticated USING (true)';
  END IF;
END $$;

-- 3. has_role: revoke direct execution from clients. RLS policies invoking it
-- internally still work because they execute under the system context.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'has_role'
  ) THEN
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated';
  END IF;
END $$;

-- 4. get_user_streak: add caller check + revoke public execute
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'get_user_streak'
  ) THEN
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.get_user_streak(uuid) FROM PUBLIC, anon';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.get_user_streak(uuid) TO authenticated';
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.get_user_streak(uid uuid)
RETURNS integer
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_streak int := 0;
BEGIN
  IF auth.uid() IS NULL OR uid IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  SELECT COUNT(DISTINCT task_date)::int INTO v_streak
  FROM public.daily_tasks
  WHERE user_id = uid
    AND is_completed = true
    AND task_date >= (now() AT TIME ZONE 'UTC')::date - INTERVAL '90 days';

  RETURN COALESCE(v_streak, 0);
END;
$function$;
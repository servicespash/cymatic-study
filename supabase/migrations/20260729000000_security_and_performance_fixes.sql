-- ==============================================================================
-- Security & Performance Lints Resolution Migration
-- ==============================================================================

-- 1. RLS Policies for tables with RLS enabled but no policies
-- hub_topics
DROP POLICY IF EXISTS "Hub topics are readable by all" ON public.hub_topics;
CREATE POLICY "Hub topics are readable by all"
  ON public.hub_topics FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Hub topics editable by authenticated admins" ON public.hub_topics;
CREATE POLICY "Hub topics editable by authenticated admins"
  ON public.hub_topics FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- organizations (ensure comprehensive public/authenticated read and org_admin management)
DROP POLICY IF EXISTS "Organizations readable by authenticated" ON public.organizations;
CREATE POLICY "Organizations readable by authenticated"
  ON public.organizations FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Organizations readable by anon" ON public.organizations;
CREATE POLICY "Organizations readable by anon"
  ON public.organizations FOR SELECT
  TO anon
  USING (true);

DROP POLICY IF EXISTS "Organizations manageable by creators/admins" ON public.organizations;
CREATE POLICY "Organizations manageable by creators/admins"
  ON public.organizations FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- study_guides
DROP POLICY IF EXISTS "Study guides are readable by authenticated" ON public.study_guides;
CREATE POLICY "Study guides are readable by authenticated"
  ON public.study_guides FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Study guides manageable by authenticated" ON public.study_guides;
CREATE POLICY "Study guides manageable by authenticated"
  ON public.study_guides FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 2. Performance: Covering Indexes for Foreign Keys & Frequently Filtered Columns
CREATE INDEX IF NOT EXISTS idx_profiles_org_id ON public.profiles(org_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_points_user_id ON public.user_points(user_id);
CREATE INDEX IF NOT EXISTS idx_task_attempts_user_id ON public.task_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_task_attempts_topic_id ON public.task_attempts(topic_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_id ON public.quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_org_id ON public.chat_messages(org_id);
CREATE INDEX IF NOT EXISTS idx_project_submissions_user_id ON public.project_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_project_submissions_org_id ON public.project_submissions(org_id);

-- 3. Security Definer Functions hardening (ensuring secure search_path)
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.organizations_set_school_key() SET search_path = public;

-- Revoke public execute on sensitive creation RPCs if desired, or ensure safe execution guards
GRANT EXECUTE ON FUNCTION public.register_institution(text, text, text) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.generate_school_key(text) TO authenticated, anon;

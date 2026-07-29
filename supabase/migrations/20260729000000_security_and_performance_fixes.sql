-- ==============================================================================
-- Security & Performance Lints Resolution Migration
-- ==============================================================================

-- 1. Ensure Tables Exist with RLS Enabled
CREATE TABLE IF NOT EXISTS public.hub_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_level TEXT NOT NULL,
  subject TEXT NOT NULL,
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.hub_topics ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.study_guides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id TEXT NOT NULL,
  content_markdown TEXT NOT NULL,
  reading_time_mins INTEGER DEFAULT 5,
  is_offline_ready BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.study_guides ENABLE ROW LEVEL SECURITY;

-- 2. Restrictive RLS Policies for hub_topics, organizations, and study_guides
-- hub_topics: readable by authenticated users, modifiable only by admins/org_admins
DROP POLICY IF EXISTS "Hub topics are readable by authenticated" ON public.hub_topics;
CREATE POLICY "Hub topics are readable by authenticated"
  ON public.hub_topics FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Hub topics manageable by admins" ON public.hub_topics;
CREATE POLICY "Hub topics manageable by admins"
  ON public.hub_topics FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'org_admin', 'teacher')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'org_admin', 'teacher')
    )
  );

-- organizations: readable by authenticated users and anon lookup (for school_key validation), modifiable by org_admin / creators
DROP POLICY IF EXISTS "Organizations readable by authenticated" ON public.organizations;
CREATE POLICY "Organizations readable by authenticated"
  ON public.organizations FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Organizations readable by anon for lookup" ON public.organizations;
CREATE POLICY "Organizations readable by anon for lookup"
  ON public.organizations FOR SELECT
  TO anon
  USING (true);

DROP POLICY IF EXISTS "Organizations manageable by org_admin or creator" ON public.organizations;
CREATE POLICY "Organizations manageable by org_admin or creator"
  ON public.organizations FOR ALL
  TO authenticated
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'org_admin'
    )
  )
  WITH CHECK (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'org_admin'
    )
  );

-- study_guides: readable by authenticated users, modifiable by teachers/admins
DROP POLICY IF EXISTS "Study guides are readable by authenticated" ON public.study_guides;
CREATE POLICY "Study guides are readable by authenticated"
  ON public.study_guides FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Study guides manageable by educators" ON public.study_guides;
CREATE POLICY "Study guides manageable by educators"
  ON public.study_guides FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'org_admin', 'teacher')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'org_admin', 'teacher')
    )
  );

-- 3. Security Definer Functions Hardening & Privilege Restrictions
-- Ensure secure search_path and restrict execution of sensitive functions

-- handle_new_user (Trigger function, keep security definer with secure search_path)
ALTER FUNCTION public.handle_new_user() SET search_path = public;

-- organizations_set_school_key (Trigger function)
ALTER FUNCTION public.organizations_set_school_key() SET search_path = public;

-- generate_school_key (Helper function)
ALTER FUNCTION public.generate_school_key(text) SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.generate_school_key(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.generate_school_key(text) TO authenticated, service_role;

-- register_institution (Creation RPC function)
ALTER FUNCTION public.register_institution(text, text, text) SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.register_institution(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.register_institution(text, text, text) TO authenticated;

-- 4. Performance: Covering Indexes for Foreign Keys & Frequent Filters
CREATE INDEX IF NOT EXISTS idx_profiles_org_id ON public.profiles(org_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_points_user_id ON public.user_points(user_id);
CREATE INDEX IF NOT EXISTS idx_task_attempts_user_id ON public.task_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_task_attempts_topic_id ON public.task_attempts(topic_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_id ON public.quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_org_id ON public.chat_messages(org_id);
CREATE INDEX IF NOT EXISTS idx_project_submissions_user_id ON public.project_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_project_submissions_org_id ON public.project_submissions(org_id);

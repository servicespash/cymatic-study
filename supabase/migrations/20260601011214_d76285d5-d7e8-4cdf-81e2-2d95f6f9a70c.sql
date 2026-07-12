
-- 1. Extend profiles with org membership, level, identifier columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS org_id uuid,
  ADD COLUMN IF NOT EXISTS level text,
  ADD COLUMN IF NOT EXISTS role text,
  ADD COLUMN IF NOT EXISTS username text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS teacher_license_id text;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_unique ON public.profiles (lower(username)) WHERE username IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS profiles_phone_unique ON public.profiles (phone) WHERE phone IS NOT NULL;

-- 2. Organizations table (institutional schools)
CREATE TABLE IF NOT EXISTS public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  school_key text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.organizations TO anon, authenticated;
GRANT ALL ON public.organizations TO service_role;

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Organizations are publicly readable" ON public.organizations;
CREATE POLICY "Organizations are publicly readable"
  ON public.organizations FOR SELECT
  USING (true);

-- 3. Chat messages table (subject/level scoped study chat)
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  org_id text,
  level text,
  content text,
  file_url text,
  file_type text,
  file_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS chat_messages_org_level_idx ON public.chat_messages (org_id, level, created_at);
CREATE INDEX IF NOT EXISTS chat_messages_user_idx ON public.chat_messages (user_id);

GRANT SELECT, INSERT ON public.chat_messages TO authenticated;
GRANT ALL ON public.chat_messages TO service_role;

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read chat messages" ON public.chat_messages;
CREATE POLICY "Authenticated users can read chat messages"
  ON public.chat_messages FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can post their own messages" ON public.chat_messages;
CREATE POLICY "Authenticated users can post their own messages"
  ON public.chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Add chat_messages to realtime publication if not already
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'chat_messages'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages';
  END IF;
END $$;

-- 4. Extend project_submissions with phase scores + institutional fields
ALTER TABLE public.project_submissions
  ADD COLUMN IF NOT EXISTS student_id uuid,
  ADD COLUMN IF NOT EXISTS org_id uuid,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS teacher_id uuid,
  ADD COLUMN IF NOT EXISTS teacher_name text,
  ADD COLUMN IF NOT EXISTS teacher_license text,
  ADD COLUMN IF NOT EXISTS school_key text,
  ADD COLUMN IF NOT EXISTS teacher_comments text,
  ADD COLUMN IF NOT EXISTS phase1_score numeric,
  ADD COLUMN IF NOT EXISTS phase2_score numeric,
  ADD COLUMN IF NOT EXISTS phase3_score numeric,
  ADD COLUMN IF NOT EXISTS phase4_score numeric,
  ADD COLUMN IF NOT EXISTS total_competency_score numeric,
  ADD COLUMN IF NOT EXISTS project_data jsonb;

-- Mirror student_user_id into student_id for legacy code paths
UPDATE public.project_submissions
SET student_id = student_user_id
WHERE student_id IS NULL AND student_user_id IS NOT NULL;

-- Mirror status from is_verified for legacy code paths
UPDATE public.project_submissions
SET status = CASE WHEN is_verified THEN 'verified' ELSE 'draft' END
WHERE status IS NULL OR status = 'draft';

-- Allow student to read their submissions via either column
DROP POLICY IF EXISTS "Students can view own project submissions" ON public.project_submissions;
CREATE POLICY "Students can view own project submissions"
  ON public.project_submissions FOR SELECT
  TO authenticated
  USING (student_user_id = auth.uid() OR student_id = auth.uid());

-- 5. has_role RPC (text-based; flexible for 'teacher', 'org_admin', etc.)
CREATE OR REPLACE FUNCTION public.has_role(uid uuid, requested_role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = uid AND p.role = requested_role
  );
$$;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, text) TO authenticated, anon;

-- 6. Trigger to keep student_id <-> student_user_id in sync
CREATE OR REPLACE FUNCTION public.sync_project_submission_student_ids()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.student_id IS NULL AND NEW.student_user_id IS NOT NULL THEN
    NEW.student_id := NEW.student_user_id;
  ELSIF NEW.student_user_id IS NULL AND NEW.student_id IS NOT NULL THEN
    NEW.student_user_id := NEW.student_id;
  END IF;

  -- mirror status <-> is_verified
  IF NEW.status = 'verified' AND NEW.is_verified IS DISTINCT FROM true THEN
    NEW.is_verified := true;
  ELSIF NEW.is_verified = true AND NEW.status IS DISTINCT FROM 'verified' THEN
    NEW.status := 'verified';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_project_submission_ids ON public.project_submissions;
CREATE TRIGGER sync_project_submission_ids
  BEFORE INSERT OR UPDATE ON public.project_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_project_submission_student_ids();

-- 7. app_config: nothing to change here (admin.login uses organizations.name, not app_config.name)

CREATE TABLE IF NOT EXISTS public.project_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id text NOT NULL,
  teacher_token uuid NOT NULL DEFAULT gen_random_uuid(),
  student_user_id uuid,
  student_email text,
  project_payload jsonb NOT NULL,
  is_verified boolean NOT NULL DEFAULT false,
  awarded_score integer,
  awarded_grade text,
  remarks text,
  marked_by text,
  teacher_title text,
  teacher_license_id text,
  school_reference_key text,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT project_submissions_score_range CHECK (awarded_score IS NULL OR (awarded_score >= 0 AND awarded_score <= 100)),
  CONSTRAINT project_submissions_grade_valid CHECK (awarded_grade IS NULL OR awarded_grade IN ('A','B','C','D','E')),
  CONSTRAINT project_submissions_payload_object CHECK (jsonb_typeof(project_payload) = 'object')
);

CREATE UNIQUE INDEX IF NOT EXISTS project_submissions_teacher_token_idx
  ON public.project_submissions (teacher_token);

CREATE INDEX IF NOT EXISTS project_submissions_project_id_idx
  ON public.project_submissions (project_id);

CREATE INDEX IF NOT EXISTS project_submissions_student_user_id_idx
  ON public.project_submissions (student_user_id)
  WHERE student_user_id IS NOT NULL;

ALTER TABLE public.project_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "No direct project submission reads" ON public.project_submissions;
DROP POLICY IF EXISTS "No direct project submission writes" ON public.project_submissions;

CREATE POLICY "No direct project submission reads"
ON public.project_submissions
FOR SELECT
TO public
USING (false);

CREATE POLICY "No direct project submission writes"
ON public.project_submissions
FOR ALL
TO public
USING (false)
WITH CHECK (false);

DROP TRIGGER IF EXISTS update_project_submissions_updated_at ON public.project_submissions;
CREATE TRIGGER update_project_submissions_updated_at
BEFORE UPDATE ON public.project_submissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.project_submissions;
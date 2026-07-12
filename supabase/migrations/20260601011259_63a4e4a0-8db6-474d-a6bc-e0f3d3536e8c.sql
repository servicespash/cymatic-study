
-- FK profiles.org_id -> organizations.id (allows PostgREST embedding)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'profiles_org_id_fkey' AND table_name = 'profiles'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_org_id_fkey
      FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Loosen NOT NULL on project_submissions columns that legacy & new code paths share
ALTER TABLE public.project_submissions
  ALTER COLUMN project_id DROP NOT NULL,
  ALTER COLUMN project_payload DROP NOT NULL;

ALTER TABLE public.project_submissions
  ALTER COLUMN project_payload SET DEFAULT '{}'::jsonb;

-- Add missing tracking columns referenced by SubmissionModal
ALTER TABLE public.project_submissions
  ADD COLUMN IF NOT EXISTS marking_token uuid,
  ADD COLUMN IF NOT EXISTS submitted_at timestamptz;

CREATE INDEX IF NOT EXISTS project_submissions_marking_token_idx
  ON public.project_submissions (marking_token);

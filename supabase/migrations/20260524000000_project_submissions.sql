-- Migration for Project Submissions and Teacher Evaluations

CREATE TYPE public.submission_status AS ENUM ('draft', 'pending', 'verified');

CREATE TABLE IF NOT EXISTS public.project_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  status submission_status NOT NULL DEFAULT 'draft',
  
  -- Teacher Evaluation Data
  teacher_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  teacher_name TEXT,
  teacher_license TEXT,
  school_key TEXT,
  
  -- NCDC Competency Points (Total max 10%)
  phase1_score NUMERIC(3, 1) DEFAULT 0, -- max 2
  phase2_score NUMERIC(3, 1) DEFAULT 0, -- max 3
  phase3_score NUMERIC(3, 1) DEFAULT 0, -- max 3
  phase4_score NUMERIC(3, 1) DEFAULT 0, -- max 2
  total_competency_score NUMERIC(3, 1) GENERATED ALWAYS AS (phase1_score + phase2_score + phase3_score + phase4_score) STORED,
  
  teacher_comments TEXT,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.project_submissions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Students can view and edit their own drafts"
  ON public.project_submissions
  FOR ALL
  USING (auth.uid() = student_id AND status = 'draft');

CREATE POLICY "Students can view their verified submissions"
  ON public.project_submissions
  FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Teachers can view pending submissions"
  ON public.project_submissions
  FOR SELECT
  USING (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Teachers can verify submissions"
  ON public.project_submissions
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'admin'));

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_submissions;

-- Function to handle submission update
CREATE OR REPLACE FUNCTION public.handle_submission_verification()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'verified' AND OLD.status != 'verified' THEN
    NEW.verified_at = now();
    -- Award XP or points here if needed
  END IF;
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_submission_verify
  BEFORE UPDATE ON public.project_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_submission_verification();

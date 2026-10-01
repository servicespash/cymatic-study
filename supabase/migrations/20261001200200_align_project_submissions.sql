DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='submission_status') THEN
  CREATE TYPE public.submission_status AS ENUM ('draft','pending','verified','returned');
 END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.project_submissions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
 cohort_id uuid REFERENCES public.cohorts(id) ON DELETE SET NULL,
 project_data jsonb NOT NULL DEFAULT '{}'::jsonb,
 status public.submission_status NOT NULL DEFAULT 'draft',
 teacher_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
 teacher_comments text,
 phase1_score numeric(4,1) NOT NULL DEFAULT 0 CHECK(phase1_score BETWEEN 0 AND 2),
 phase2_score numeric(4,1) NOT NULL DEFAULT 0 CHECK(phase2_score BETWEEN 0 AND 3),
 phase3_score numeric(4,1) NOT NULL DEFAULT 0 CHECK(phase3_score BETWEEN 0 AND 3),
 phase4_score numeric(4,1) NOT NULL DEFAULT 0 CHECK(phase4_score BETWEEN 0 AND 2),
 total_competency_score numeric(5,1) GENERATED ALWAYS AS(phase1_score+phase2_score+phase3_score+phase4_score) STORED,
 submitted_at timestamptz, verified_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.project_submissions ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS project_submissions_org_status_idx ON public.project_submissions(organization_id,status,created_at DESC);
CREATE INDEX IF NOT EXISTS project_submissions_student_idx ON public.project_submissions(student_id,created_at DESC);

DROP POLICY IF EXISTS submissions_student_read ON public.project_submissions;
CREATE POLICY submissions_student_read ON public.project_submissions FOR SELECT TO authenticated USING(student_id=auth.uid());
DROP POLICY IF EXISTS submissions_student_insert ON public.project_submissions;
CREATE POLICY submissions_student_insert ON public.project_submissions FOR INSERT TO authenticated WITH CHECK(student_id=auth.uid() AND organization_id IS NOT DISTINCT FROM public.current_organization_id());
DROP POLICY IF EXISTS submissions_student_update_draft ON public.project_submissions;
CREATE POLICY submissions_student_update_draft ON public.project_submissions FOR UPDATE TO authenticated USING(student_id=auth.uid() AND status='draft') WITH CHECK(student_id=auth.uid() AND status IN('draft','pending'));
DROP POLICY IF EXISTS submissions_staff_read ON public.project_submissions;
CREATE POLICY submissions_staff_read ON public.project_submissions FOR SELECT TO authenticated USING(organization_id=public.current_organization_id() AND(public.has_app_role(auth.uid(),'teacher') OR public.has_app_role(auth.uid(),'admin') OR public.has_app_role(auth.uid(),'org_admin')));
DROP POLICY IF EXISTS submissions_staff_update ON public.project_submissions;
CREATE POLICY submissions_staff_update ON public.project_submissions FOR UPDATE TO authenticated USING(organization_id=public.current_organization_id() AND(public.has_app_role(auth.uid(),'teacher') OR public.has_app_role(auth.uid(),'admin') OR public.has_app_role(auth.uid(),'org_admin'))) WITH CHECK(organization_id=public.current_organization_id());

CREATE OR REPLACE FUNCTION public.set_submission_timestamps() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
BEGIN
 NEW.updated_at=now();
 IF NEW.status='pending' AND OLD.status IS DISTINCT FROM 'pending' AND NEW.submitted_at IS NULL THEN NEW.submitted_at=now(); END IF;
 IF NEW.status='verified' AND OLD.status IS DISTINCT FROM 'verified' THEN NEW.verified_at=now(); END IF;
 RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS submission_timestamps ON public.project_submissions;
CREATE TRIGGER submission_timestamps BEFORE UPDATE ON public.project_submissions FOR EACH ROW EXECUTE FUNCTION public.set_submission_timestamps();

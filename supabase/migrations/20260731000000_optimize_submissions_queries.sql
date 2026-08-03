-- Migration to optimize project_submissions performance
CREATE INDEX IF NOT EXISTS idx_project_submissions_org_id ON public.project_submissions(org_id);
CREATE INDEX IF NOT EXISTS idx_project_submissions_school_id ON public.project_submissions(school_id);

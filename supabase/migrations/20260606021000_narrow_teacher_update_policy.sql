-- Migration: Narrow teacher UPDATE policy on project_submissions
-- Allow only users with a teacher/org_admin role in the same org to update submissions.

DROP POLICY IF EXISTS "Teachers can verify submissions" ON public.project_submissions;

CREATE POLICY "Teachers can update submissions in their org"
  ON public.project_submissions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role IN ('teacher', 'org_admin')
    )
    AND org_id IS NOT NULL
    AND org_id IN (
      SELECT p.org_id FROM public.profiles p WHERE p.user_id = auth.uid()
    )
  );

-- Note: Column-level UPDATE restrictions are enforced separately via REVOKE statements.

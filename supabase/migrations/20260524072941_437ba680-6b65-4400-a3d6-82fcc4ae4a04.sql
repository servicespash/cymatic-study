DROP POLICY IF EXISTS "Students can view own project submissions" ON public.project_submissions;

CREATE POLICY "Students can view own project submissions"
ON public.project_submissions
FOR SELECT
TO authenticated
USING (student_user_id = auth.uid());
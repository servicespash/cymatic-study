-- Migration: Revoke client UPDATE privileges on sensitive project_submissions columns
-- Ensures only server-side SECURITY DEFINER functions (like submit_evaluation_by_token)
-- can change verification/awarding fields.

-- Revoke UPDATE on privileged columns from client roles
REVOKE UPDATE (is_verified, status, teacher_name, teacher_title, teacher_license, marked_by, verified_at, awarded_score, awarded_grade, total_competency_score, phase1_score, phase2_score, phase3_score, phase4_score)
  ON public.project_submissions FROM authenticated;
REVOKE UPDATE (is_verified, status, teacher_name, teacher_title, teacher_license, marked_by, verified_at, awarded_score, awarded_grade, total_competency_score, phase1_score, phase2_score, phase3_score, phase4_score)
  ON public.project_submissions FROM anon;

-- Allow clients to update safe, non-privileged columns (e.g., draft content)
GRANT UPDATE (project_payload, project_data, remarks) ON public.project_submissions TO authenticated;

-- Note: SECURITY DEFINER functions continue to be able to update all columns.

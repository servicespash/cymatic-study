-- Migration: Restrict token-based marking RPCs to authenticated users only
-- This revokes anonymous/public execute on the token RPCs and grants execute to `authenticated` role.

REVOKE EXECUTE ON FUNCTION public.get_submission_by_token(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.submit_evaluation_by_token(uuid, numeric, numeric, numeric, numeric, text, text, text, text) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.get_submission_by_token(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_evaluation_by_token(uuid, numeric, numeric, numeric, numeric, text, text, text, text) TO authenticated;

-- Service role retains execute by default; explicit grant is optional in some setups.

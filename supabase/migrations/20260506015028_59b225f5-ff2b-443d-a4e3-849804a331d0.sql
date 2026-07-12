REVOKE EXECUTE ON FUNCTION public.submit_quiz_attempt(text, numeric) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.submit_quiz_attempt(text, numeric) TO authenticated;
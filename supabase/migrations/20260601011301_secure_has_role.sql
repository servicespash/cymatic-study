
-- Revoke anon access to has_role RPC for security
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, text) TO authenticated;

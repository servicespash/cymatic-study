-- Force non-recursive has_role function
CREATE OR REPLACE FUNCTION public.has_role(uid uuid, requested_role text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = uid AND role::text = requested_role
  );
END;
$$;

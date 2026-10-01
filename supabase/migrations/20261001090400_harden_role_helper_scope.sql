-- has_app_role may only inspect the caller's own role,
-- unless the caller is already an organization/system administrator.
CREATE OR REPLACE FUNCTION public.has_app_role(target_user_id uuid, requested_role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = target_user_id
      AND ur.role = requested_role
      AND (
        target_user_id = (SELECT auth.uid())
        OR EXISTS (
          SELECT 1
          FROM public.user_roles caller_role
          WHERE caller_role.user_id = (SELECT auth.uid())
            AND caller_role.role IN ('admin'::public.app_role, 'org_admin'::public.app_role)
        )
      )
  );
$$;

REVOKE ALL ON FUNCTION public.has_app_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_app_role(uuid, public.app_role) TO authenticated;

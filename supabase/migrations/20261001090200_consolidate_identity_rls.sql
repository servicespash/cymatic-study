-- Consolidate canonical identity RLS policies and remove duplicate index.
DROP INDEX IF EXISTS public.user_roles_user_role_unique;

DROP POLICY IF EXISTS profiles_select_self ON public.profiles;
DROP POLICY IF EXISTS profiles_select_same_org_admin_teacher ON public.profiles;
CREATE POLICY profiles_select_scoped
ON public.profiles FOR SELECT TO authenticated
USING (
  user_id = (SELECT auth.uid())
  OR (
    organization_id IS NOT NULL
    AND organization_id = public.current_organization_id()
    AND (
      public.has_app_role((SELECT auth.uid()), 'admin'::public.app_role)
      OR public.has_app_role((SELECT auth.uid()), 'org_admin'::public.app_role)
      OR public.has_app_role((SELECT auth.uid()), 'teacher'::public.app_role)
    )
  )
);

DROP POLICY IF EXISTS users_read_own_roles ON public.user_roles;
DROP POLICY IF EXISTS org_admins_read_org_roles ON public.user_roles;
CREATE POLICY user_roles_select_scoped
ON public.user_roles FOR SELECT TO authenticated
USING (
  user_id = (SELECT auth.uid())
  OR (
    organization_id IS NOT NULL
    AND organization_id = public.current_organization_id()
    AND (
      public.has_app_role((SELECT auth.uid()), 'admin'::public.app_role)
      OR public.has_app_role((SELECT auth.uid()), 'org_admin'::public.app_role)
    )
  )
);

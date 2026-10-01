-- Cymatic Study canonical identity, tenancy, and tutor boundary.
-- Role authority: public.user_roles.role.
-- Tenant authority: public.user_roles.organization_id / profiles.organization_id.
-- Tutor persona is presentation state, never authorization.

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS organization_id uuid;
UPDATE public.profiles SET organization_id = org_id WHERE organization_id IS NULL AND org_id IS NOT NULL;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS profiles_organization_id_idx ON public.profiles(organization_id);
CREATE UNIQUE INDEX IF NOT EXISTS user_roles_user_role_unique ON public.user_roles(user_id, role);

ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS organization_id uuid;
UPDATE public.user_roles ur
SET organization_id = p.organization_id
FROM public.profiles p
WHERE p.user_id = ur.user_id AND ur.organization_id IS NULL AND p.organization_id IS NOT NULL;

ALTER TABLE public.user_roles
  ADD CONSTRAINT user_roles_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS user_roles_org_role_idx ON public.user_roles(organization_id, role);

ALTER TABLE public.tutor_content
  ADD COLUMN IF NOT EXISTS organization_id uuid,
  ADD COLUMN IF NOT EXISTS audience_role public.app_role,
  ADD COLUMN IF NOT EXISTS content_scope text NOT NULL DEFAULT 'global',
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

ALTER TABLE public.tutor_content
  ADD CONSTRAINT tutor_content_scope_check
  CHECK (content_scope IN ('global','organization'));

ALTER TABLE public.tutor_content
  ADD CONSTRAINT tutor_content_org_scope_check
  CHECK (
    (content_scope = 'global' AND organization_id IS NULL)
    OR (content_scope = 'organization' AND organization_id IS NOT NULL)
  );

CREATE INDEX IF NOT EXISTS tutor_content_org_role_idx
  ON public.tutor_content(organization_id, audience_role, is_active);

ALTER TABLE public.tutor_sessions
  ADD COLUMN IF NOT EXISTS organization_id uuid,
  ADD COLUMN IF NOT EXISTS role_snapshot public.app_role,
  ADD COLUMN IF NOT EXISTS tutor_persona text;

UPDATE public.tutor_sessions ts
SET organization_id = p.organization_id,
    role_snapshot = ur.role,
    tutor_persona = p.tutor_persona
FROM public.profiles p
LEFT JOIN LATERAL (
  SELECT role FROM public.user_roles
  WHERE user_id = p.user_id
  ORDER BY created_at ASC LIMIT 1
) ur ON true
WHERE ts.user_id = p.user_id
  AND (ts.organization_id IS NULL OR ts.role_snapshot IS NULL OR ts.tutor_persona IS NULL);

CREATE INDEX IF NOT EXISTS tutor_sessions_org_user_idx
  ON public.tutor_sessions(organization_id, user_id);

CREATE OR REPLACE FUNCTION public.has_app_role(target_user_id uuid, requested_role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = target_user_id AND ur.role = requested_role
  );
$$;

REVOKE ALL ON FUNCTION public.has_app_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_app_role(uuid, public.app_role) TO authenticated;

CREATE OR REPLACE FUNCTION public.current_organization_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT p.organization_id FROM public.profiles p
  WHERE p.user_id = (SELECT auth.uid()) LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.current_organization_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_organization_id() TO authenticated;

DROP POLICY IF EXISTS profiles_delete_admin_only ON public.profiles;
DROP POLICY IF EXISTS profiles_insert_admin_only ON public.profiles;
DROP POLICY IF EXISTS profiles_update_admin_only ON public.profiles;
DROP POLICY IF EXISTS profiles_select_all_authenticated ON public.profiles;
DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
DROP POLICY IF EXISTS "Independent learners isolation" ON public.profiles;
DROP POLICY IF EXISTS "Institutional profiles restriction" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to update own profile" ON public.profiles;
DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
DROP POLICY IF EXISTS profiles_update_own_authenticated ON public.profiles;

CREATE POLICY profiles_select_self ON public.profiles
FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));

CREATE POLICY profiles_select_same_org_admin_teacher ON public.profiles
FOR SELECT TO authenticated
USING (
  organization_id IS NOT NULL
  AND organization_id = public.current_organization_id()
  AND (
    public.has_app_role((SELECT auth.uid()), 'admin'::public.app_role)
    OR public.has_app_role((SELECT auth.uid()), 'org_admin'::public.app_role)
    OR public.has_app_role((SELECT auth.uid()), 'teacher'::public.app_role)
  )
);

CREATE POLICY profiles_update_self_safe ON public.profiles
FOR UPDATE TO authenticated
USING (user_id = (SELECT auth.uid()))
WITH CHECK (
  user_id = (SELECT auth.uid())
  AND role IS NOT DISTINCT FROM (SELECT p.role FROM public.profiles p WHERE p.user_id = (SELECT auth.uid()))
  AND organization_id IS NOT DISTINCT FROM (SELECT p.organization_id FROM public.profiles p WHERE p.user_id = (SELECT auth.uid()))
  AND tutor_persona IS NOT DISTINCT FROM (SELECT p.tutor_persona FROM public.profiles p WHERE p.user_id = (SELECT auth.uid()))
);

DROP POLICY IF EXISTS "Anyone can read tutor content" ON public.tutor_content;
DROP POLICY IF EXISTS "Admins can insert tutor content" ON public.tutor_content;
DROP POLICY IF EXISTS "Admins can update tutor content" ON public.tutor_content;

CREATE POLICY tutor_content_read_scoped ON public.tutor_content
FOR SELECT TO authenticated
USING (is_active = true AND (content_scope = 'global' OR organization_id = public.current_organization_id()));

CREATE POLICY tutor_content_insert_admin ON public.tutor_content
FOR INSERT TO authenticated
WITH CHECK (
  public.has_app_role((SELECT auth.uid()), 'admin'::public.app_role)
  AND (content_scope = 'global' OR organization_id = public.current_organization_id())
);

CREATE POLICY tutor_content_update_admin ON public.tutor_content
FOR UPDATE TO authenticated
USING (
  public.has_app_role((SELECT auth.uid()), 'admin'::public.app_role)
  AND (content_scope = 'global' OR organization_id = public.current_organization_id())
)
WITH CHECK (
  public.has_app_role((SELECT auth.uid()), 'admin'::public.app_role)
  AND (content_scope = 'global' OR organization_id = public.current_organization_id())
);

DROP POLICY IF EXISTS "Users can insert their own sessions" ON public.tutor_sessions;
DROP POLICY IF EXISTS "Users can update their own sessions" ON public.tutor_sessions;
DROP POLICY IF EXISTS "Users can view their own sessions" ON public.tutor_sessions;

CREATE POLICY tutor_sessions_select_self ON public.tutor_sessions
FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));

CREATE POLICY tutor_sessions_insert_self ON public.tutor_sessions
FOR INSERT TO authenticated
WITH CHECK (
  user_id = (SELECT auth.uid())
  AND organization_id IS NOT DISTINCT FROM public.current_organization_id()
  AND role_snapshot IS NOT DISTINCT FROM (
    SELECT ur.role FROM public.user_roles ur
    WHERE ur.user_id = (SELECT auth.uid())
    ORDER BY ur.created_at ASC LIMIT 1
  )
);

CREATE POLICY tutor_sessions_update_self ON public.tutor_sessions
FOR UPDATE TO authenticated
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS admins_read_all_roles ON public.user_roles;
DROP POLICY IF EXISTS users_read_own_roles ON public.user_roles;

CREATE POLICY users_read_own_roles ON public.user_roles
FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));

CREATE POLICY org_admins_read_org_roles ON public.user_roles
FOR SELECT TO authenticated
USING (
  organization_id IS NOT NULL
  AND organization_id = public.current_organization_id()
  AND (
    public.has_app_role((SELECT auth.uid()), 'admin'::public.app_role)
    OR public.has_app_role((SELECT auth.uid()), 'org_admin'::public.app_role)
  )
);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id,user_id,display_name,school_name,phone,tutor_persona)
  VALUES (
    NEW.id, NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name',NEW.raw_user_meta_data->>'name',split_part(COALESCE(NEW.email,''),'@',1)),
    NEW.raw_user_meta_data->>'school_name',
    NEW.raw_user_meta_data->>'phone_number',
    'adam'
  )
  ON CONFLICT (user_id) DO UPDATE SET
    display_name=EXCLUDED.display_name,
    school_name=EXCLUDED.school_name,
    phone=EXCLUDED.phone,
    updated_at=now();

  INSERT INTO public.user_roles(user_id,role)
  VALUES (NEW.id,'student'::public.app_role)
  ON CONFLICT (user_id,role) DO NOTHING;

  RETURN NEW;
END;
$$;

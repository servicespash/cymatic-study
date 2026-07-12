
-- 1. Restrict organizations SELECT to own org + signup lookup via helper
DROP POLICY IF EXISTS "Organizations readable by authenticated" ON public.organizations;
CREATE POLICY "Users can read own organization"
ON public.organizations FOR SELECT TO authenticated
USING (
  id IN (SELECT p.org_id FROM public.profiles p WHERE p.user_id = auth.uid() AND p.org_id IS NOT NULL)
);

-- 2. Safe lookup of an organization by school_key (used during onboarding/signup)
CREATE OR REPLACE FUNCTION public.lookup_organization_by_key(_school_key text)
RETURNS TABLE(id uuid, name text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT o.id, o.name
  FROM public.organizations o
  WHERE o.school_key IS NOT NULL
    AND lower(trim(o.school_key)) = lower(trim(_school_key))
  LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.lookup_organization_by_key(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lookup_organization_by_key(text) TO authenticated, anon;

-- 3. Defense-in-depth: revoke column UPDATE on privileged profile columns from clients
REVOKE UPDATE (is_verified, role, org_id, level, teacher_license_id) ON public.profiles FROM authenticated;
REVOKE UPDATE (is_verified, role, org_id, level, teacher_license_id) ON public.profiles FROM anon;
-- Re-grant UPDATE on remaining editable columns explicitly
GRANT UPDATE (display_name, school_name, avatar_url, phone, username, updated_at) ON public.profiles TO authenticated;

-- 4. Allow SECURITY DEFINER enrollment to bypass the privilege-escalation trigger via session flag
CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF current_setting('app.allow_profile_privileged_update', true) = 'on' THEN
    RETURN NEW;
  END IF;
  IF NEW.is_verified IS DISTINCT FROM OLD.is_verified
     OR NEW.role IS DISTINCT FROM OLD.role
     OR NEW.org_id IS DISTINCT FROM OLD.org_id
     OR NEW.level IS DISTINCT FROM OLD.level
     OR NEW.teacher_license_id IS DISTINCT FROM OLD.teacher_license_id THEN
    RAISE EXCEPTION 'Cannot modify privileged profile columns from client';
  END IF;
  RETURN NEW;
END;
$$;

-- 5. Server-side enrollment: validates school_key, sets org_id + level on caller's profile
CREATE OR REPLACE FUNCTION public.enroll_self_in_school(_school_key text, _level text, _phone text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user uuid := auth.uid();
  v_org_id uuid;
  v_org_name text;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _level IS NULL OR _level !~ '^S[1-6]$' THEN RAISE EXCEPTION 'Invalid level'; END IF;

  IF _school_key IS NOT NULL AND length(trim(_school_key)) > 0 THEN
    SELECT o.id, o.name INTO v_org_id, v_org_name
    FROM public.organizations o
    WHERE lower(trim(o.school_key)) = lower(trim(_school_key))
    LIMIT 1;
    IF v_org_id IS NULL THEN RAISE EXCEPTION 'Invalid School ID'; END IF;
  END IF;

  PERFORM set_config('app.allow_profile_privileged_update', 'on', true);
  UPDATE public.profiles
  SET org_id = COALESCE(v_org_id, org_id),
      level = _level,
      phone = COALESCE(_phone, phone),
      school_name = COALESCE(v_org_name, school_name),
      updated_at = now()
  WHERE user_id = v_user;

  RETURN jsonb_build_object('org_id', v_org_id, 'org_name', v_org_name, 'level', _level);
END;
$$;
REVOKE ALL ON FUNCTION public.enroll_self_in_school(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.enroll_self_in_school(text, text, text) TO authenticated;

-- 6. Hide marking/teacher tokens and license id from authenticated readers (server fns use service role)
REVOKE SELECT (teacher_token, marking_token, teacher_license_id, school_key, teacher_license) ON public.project_submissions FROM authenticated;
REVOKE SELECT (teacher_token, marking_token, teacher_license_id, school_key, teacher_license) ON public.project_submissions FROM anon;

-- 7. Revoke EXECUTE on internal trigger functions from public clients
REVOKE EXECUTE ON FUNCTION public.prevent_profile_privilege_escalation() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_project_submission_student_ids() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

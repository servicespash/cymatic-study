-- Add 'org_admin' to the app_role enum
-- Note: PostgreSQL doesn't allow adding values to enums inside a transaction in some versions,
-- but for Supabase/PostgreSQL 12+ it's generally fine with ALTER TYPE.

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_role' AND e.enumlabel = 'org_admin') THEN
    ALTER TYPE public.app_role ADD VALUE 'org_admin';
  END IF;
END $$;

-- Update register_institution function to use 'org_admin' instead of 'admin' for the registrar
CREATE OR REPLACE FUNCTION public.register_institution(_name text, _email text, _phone text DEFAULT NULL)
RETURNS TABLE(school_key text, org_id uuid) 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public 
AS $$
DECLARE
  v_school_key text;
  v_org_id uuid;
  v_uid uuid;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  -- Generate unique key
  v_school_key := upper(substring(replace(_name, ' ', '') from 1 for 4) || '-' || floor(random() * 8999 + 1000)::text);

  -- 1. Create Organization
  INSERT INTO public.organizations (name, school_key, created_by)
  VALUES (_name, v_school_key, v_uid)
  RETURNING id INTO v_org_id;

  -- 2. Update Profile Role and Link to Org
  -- We use 'org_admin' specifically for school owners/registrars
  UPDATE public.profiles 
  SET role = 'org_admin', 
      org_id = v_org_id, 
      school_name = _name,
      phone = COALESCE(_phone, phone)
  WHERE user_id = v_uid;

  -- 3. Add to User Roles
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_uid, 'org_admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Remove 'student' role if it was default
  DELETE FROM public.user_roles WHERE user_id = v_uid AND role = 'student';

  RETURN QUERY SELECT v_school_key, v_org_id;
END; $$;

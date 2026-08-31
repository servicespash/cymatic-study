-- Migration to enforce strict role-based institutional isolation and update profiles schema.
-- File: /supabase/migrations/20260901020000_institutional_verification_schema.sql

-- 1. Add columns to public.profiles if they don't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS institution_id TEXT REFERENCES public.organizations(id);

-- 2. Ensure synchronization trigger exists to keep org_id and institution_id equal
CREATE OR REPLACE FUNCTION public.sync_profile_institution_ids()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.org_id IS NOT NULL AND NEW.institution_id IS NULL THEN
    NEW.institution_id := NEW.org_id;
  ELSIF NEW.institution_id IS NOT NULL AND NEW.org_id IS NULL THEN
    NEW.org_id := NEW.institution_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS sync_profile_institution_ids_trigger ON public.profiles;

CREATE TRIGGER sync_profile_institution_ids_trigger
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_profile_institution_ids();

-- 3. Backfill existing profiles to align columns
UPDATE public.profiles
SET institution_id = org_id
WHERE org_id IS NOT NULL AND institution_id IS NULL;

UPDATE public.profiles
SET org_id = institution_id
WHERE institution_id IS NOT NULL AND org_id IS NULL;

-- 4. Enable Row Level Security on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5. Clean up any existing policies on public.profiles to prevent conflicts
DROP POLICY IF EXISTS "Allow user to read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow user to update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Institutional silo access" ON public.profiles;
DROP POLICY IF EXISTS "Independent silo access" ON public.profiles;
DROP POLICY IF EXISTS "Profiles read access" ON public.profiles;
DROP POLICY IF EXISTS "Profiles update access" ON public.profiles;
DROP POLICY IF EXISTS "Admin read institutional profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin update institutional profiles" ON public.profiles;
DROP POLICY IF EXISTS "Student read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Student update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Teacher read institutional profiles" ON public.profiles;
DROP POLICY IF EXISTS "Independent read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Independent update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow system insertions" ON public.profiles;

-- 6. Helper function to securely find user's current institution
CREATE OR REPLACE FUNCTION public.get_my_institution_id()
RETURNS TEXT AS $$
  SELECT COALESCE(institution_id, org_id) FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 7. Policies for profiles table:

-- Admins: can only read and update profiles within their own institution
CREATE POLICY "Admin read institutional profiles" ON public.profiles
FOR SELECT
USING (
  (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'org_admin') OR role = 'admin' OR role = 'org_admin')
  AND COALESCE(institution_id, org_id) = public.get_my_institution_id()
);

CREATE POLICY "Admin update institutional profiles" ON public.profiles
FOR UPDATE
USING (
  (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'org_admin') OR role = 'admin' OR role = 'org_admin')
  AND COALESCE(institution_id, org_id) = public.get_my_institution_id()
)
WITH CHECK (
  (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'org_admin') OR role = 'admin' OR role = 'org_admin')
  AND COALESCE(institution_id, org_id) = public.get_my_institution_id()
);

-- Students: can only read and update their own specific profile
CREATE POLICY "Student read own profile" ON public.profiles
FOR SELECT
USING (
  auth.uid() = user_id
);

CREATE POLICY "Student update own profile" ON public.profiles
FOR UPDATE
USING (
  auth.uid() = user_id
)
WITH CHECK (
  auth.uid() = user_id
);

-- Teachers: can read profiles within the same institution
CREATE POLICY "Teacher read institutional profiles" ON public.profiles
FOR SELECT
USING (
  (public.has_role(auth.uid(), 'teacher') OR role = 'teacher')
  AND COALESCE(institution_id, org_id) = public.get_my_institution_id()
);

-- Independent learners & teachers: can read and update their own specific profiles
CREATE POLICY "Independent read own profile" ON public.profiles
FOR SELECT
USING (
  auth.uid() = user_id
);

CREATE POLICY "Independent update own profile" ON public.profiles
FOR UPDATE
USING (
  auth.uid() = user_id
)
WITH CHECK (
  auth.uid() = user_id
);

-- Allow profile creation (insert) during sign up process
CREATE POLICY "Allow system insertions" ON public.profiles
FOR INSERT
WITH CHECK (true);

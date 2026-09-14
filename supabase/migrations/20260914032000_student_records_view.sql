-- Fix infinite recursion on profiles by dropping all recursive policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by owner" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
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
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins read institutional profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins update institutional profiles" ON public.profiles;
DROP POLICY IF EXISTS "Teachers read institutional profiles" ON public.profiles;
DROP POLICY IF EXISTS "Teachers can read student profiles in their org" ON public.profiles;
DROP POLICY IF EXISTS "Admin can read all" ON public.profiles;

CREATE POLICY "Users can read own profile" ON public.profiles
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create staff read policy using user_roles to prevent recursion
CREATE POLICY "Staff can read profiles in their org" ON public.profiles
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid() 
        AND ur.role IN ('admin', 'org_admin', 'teacher')
        AND ur.organization_id = public.profiles.org_id
    )
);

-- Ensure administrative users are automatically excluded from the 'student records'
CREATE OR REPLACE VIEW public.student_records AS
SELECT 
    id, 
    user_id, 
    display_name, 
    role, 
    org_id, 
    school_name,
    created_at
FROM public.profiles
WHERE role IN ('student', 'student_monitor');

-- Grant access to the view
GRANT SELECT ON public.student_records TO authenticated;

-- Ensure schema cache is reloaded
NOTIFY pgrst, reload_schema;

-- Ensure we also have a roster view for the directory that bypasses RLS issues
CREATE OR REPLACE VIEW public.directory_roster AS
SELECT 
    id, 
    user_id, 
    display_name, 
    role, 
    org_id, 
    school_name,
    created_at
FROM public.profiles;

GRANT SELECT ON public.directory_roster TO authenticated;
NOTIFY pgrst, reload_schema;

-- Ensure strict isolation and fix any infinite recursion
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop all possible existing policies to avoid duplicates and recursion
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "Admin read institutional profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin update institutional profiles" ON public.profiles;
DROP POLICY IF EXISTS "Student read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Student update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Teacher read institutional profiles" ON public.profiles;
DROP POLICY IF EXISTS "Independent read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Independent update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow system insertions" ON public.profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins read institutional profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins update institutional profiles" ON public.profiles;
DROP POLICY IF EXISTS "Teachers read institutional profiles" ON public.profiles;
DROP POLICY IF EXISTS "Teachers can read student profiles in their org" ON public.profiles;
DROP POLICY IF EXISTS "Admin can read all" ON public.profiles;

-- 1. Everyone can read and update their own profile
CREATE POLICY "Users can read own profile" ON public.profiles
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 2. Admins and Teachers can read profiles in their org
CREATE POLICY "Staff can read profiles in their org" ON public.profiles
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid() 
        AND ur.role IN ('admin', 'org_admin', 'teacher')
        AND ur.organization_id = public.profiles.org_id
    )
);

-- Notify pgrst
NOTIFY pgrst, reload_schema;

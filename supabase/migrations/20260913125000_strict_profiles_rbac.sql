-- Fix: Enforce strict RBAC on profiles
-- Ensure students cannot access teacher-specific data
-- Ensure teachers cannot impersonate students/admin

-- 1. Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing problematic policies
DROP POLICY IF EXISTS "profiles_read_all" ON public.profiles;

-- 3. Create strict policies
CREATE POLICY "Users can read own profile" ON public.profiles
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Teachers can read student profiles in their org" ON public.profiles
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role IN ('teacher', 'admin', 'org_admin')
        AND organization_id = public.profiles.organization_id
    )
);

CREATE POLICY "Admin can read all" ON public.profiles
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

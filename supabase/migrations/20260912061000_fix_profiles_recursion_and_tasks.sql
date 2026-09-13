-- Migration to resolve infinite recursion in profiles and ensure dashboard_tasks existence
-- File: /supabase/migrations/20260912061000_fix_profiles_recursion_and_tasks.sql

-- 1. Ensure dashboard_tasks exists with correct schema
CREATE TABLE IF NOT EXISTS public.dashboard_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  task_type TEXT NOT NULL, -- 'quiz', 'project', 'interactive_question'
  points INTEGER NOT NULL DEFAULT 10,
  tutor_explanation TEXT,
  created_by TEXT DEFAULT 'tutor',
  organization_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS and Realtime for dashboard_tasks
ALTER TABLE public.dashboard_tasks ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON public.dashboard_tasks TO authenticated;
GRANT SELECT ON public.dashboard_tasks TO anon;

-- Policies for dashboard_tasks
DROP POLICY IF EXISTS "Read global or institutional tasks" ON public.dashboard_tasks;
CREATE POLICY "Read global or institutional tasks" ON public.dashboard_tasks
FOR SELECT
USING (
  organization_id IS NULL 
  OR organization_id = (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1)
);

DROP POLICY IF EXISTS "Manage institutional tasks" ON public.dashboard_tasks;
CREATE POLICY "Manage institutional tasks" ON public.dashboard_tasks
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('teacher', 'admin', 'org_admin')
  )
  AND organization_id = (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1)
);

-- 2. Fix Infinite Recursion in Profiles RLS
-- Use a SECURITY DEFINER function to bypass RLS for the organization lookup
CREATE OR REPLACE FUNCTION public.get_my_org_id_secure()
RETURNS TEXT AS $$
  -- This query executes as the owner (postgres) bypassing RLS
  SELECT organization_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- Drop problematic policies
DROP POLICY IF EXISTS "Admin read institutional profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin update institutional profiles" ON public.profiles;
DROP POLICY IF EXISTS "Teacher read institutional profiles" ON public.profiles;
DROP POLICY IF EXISTS "Student read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Student update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Independent read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Independent update own profile" ON public.profiles;

-- Re-implement policies using the secure lookup to break recursion
CREATE POLICY "Users can read own profile" ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins read institutional profiles" ON public.profiles
FOR SELECT
USING (
  (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'org_admin'))
  AND organization_id = public.get_my_org_id_secure()
);

CREATE POLICY "Admins update institutional profiles" ON public.profiles
FOR UPDATE
USING (
  (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'org_admin'))
  AND organization_id = public.get_my_org_id_secure()
);

CREATE POLICY "Teachers read institutional profiles" ON public.profiles
FOR SELECT
USING (
  public.has_role(auth.uid(), 'teacher')
  AND organization_id = public.get_my_org_id_secure()
);

-- Final fix for PostgREST cache: Grant access to the tables
GRANT SELECT ON public.profiles TO anon, authenticated;
GRANT SELECT ON public.user_roles TO anon, authenticated;

-- Migration: Fix infinite recursion in profiles RLS policies
-- Description: Drops recursive or missing RLS policies on public.profiles and recreates non-recursive policies using public.has_role().

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop all possible existing policies on public.profiles to prevent conflicts and infinite recursion
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Staff can read profiles in their org" ON public.profiles;
DROP POLICY IF EXISTS "Staff can update profiles in their org" ON public.profiles;
DROP POLICY IF EXISTS "Admin read institutional profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin update institutional profiles" ON public.profiles;
DROP POLICY IF EXISTS "Teacher read institutional profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin can read all" ON public.profiles;
DROP POLICY IF EXISTS "Teachers can read student profiles in their org" ON public.profiles;
DROP POLICY IF EXISTS "Staff can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Staff can update profiles" ON public.profiles;

-- 1. Users can read, insert, and update their own profile
CREATE POLICY "Users can read own profile" ON public.profiles
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 2. Staff (admins, org_admins, teachers) can read and update profiles using non-recursive role check
CREATE POLICY "Staff can read all profiles" ON public.profiles
FOR SELECT USING (
  public.has_role(auth.uid(), 'admin') 
  OR public.has_role(auth.uid(), 'org_admin') 
  OR public.has_role(auth.uid(), 'teacher')
);

CREATE POLICY "Staff can update profiles" ON public.profiles
FOR UPDATE USING (
  public.has_role(auth.uid(), 'admin') 
  OR public.has_role(auth.uid(), 'org_admin') 
  OR public.has_role(auth.uid(), 'teacher')
) WITH CHECK (
  public.has_role(auth.uid(), 'admin') 
  OR public.has_role(auth.uid(), 'org_admin') 
  OR public.has_role(auth.uid(), 'teacher')
);

-- Notify PostgREST cache reload
NOTIFY pgrst, 'reload_schema';

-- Migration: Strict Role Enforcement and Schema Alignment
-- File: /supabase/migrations/20260912070000_strict_roles_and_chat_alignment.sql

-- 1. Align chat_messages with organization_id (TEXT)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_messages' AND column_name = 'org_id') THEN
    ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS organization_id TEXT;
    UPDATE public.chat_messages SET organization_id = org_id::text WHERE organization_id IS NULL;
    -- Note: We keep org_id for now if it has constraints, but RLS will use organization_id
  END IF;
END $$;

-- 2. Create authorized_roles table for strict binding
CREATE TABLE IF NOT EXISTS public.authorized_roles (
  email TEXT NOT NULL,
  organization_id TEXT NOT NULL,
  role public.app_role NOT NULL,
  assigned_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (email, organization_id)
);

-- Enable RLS
ALTER TABLE public.authorized_roles ENABLE ROW LEVEL SECURITY;

-- Only super admins or existing org_admins can manage this
DROP POLICY IF EXISTS "Manage authorized roles" ON public.authorized_roles;
CREATE POLICY "Manage authorized roles" ON public.authorized_roles
FOR ALL USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'org_admin')
);

-- 3. Update handle_new_user to be strict
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  assigned_role public.app_role;
  assigned_org TEXT;
BEGIN
  -- 1. Check for explicit assignment by email
  SELECT role, organization_id INTO assigned_role, assigned_org
  FROM public.authorized_roles
  WHERE email = NEW.email
  LIMIT 1;

  -- 2. If no assignment, check if metadata has a requested role/org (for student self-signup)
  IF assigned_role IS NULL THEN
    -- Cast string to enum safely
    BEGIN
      assigned_role := (NEW.raw_user_meta_data->>'role')::public.app_role;
    EXCEPTION WHEN OTHERS THEN
      assigned_role := 'student'::public.app_role;
    END;
    
    assigned_org := NEW.raw_user_meta_data->>'organization_id';
    
    -- STRENGTHEN: Non-assigned users cannot self-promote to sensitive roles
    IF assigned_role IN ('teacher', 'admin', 'org_admin') THEN
      assigned_role := 'student';
    END IF;
  END IF;

  -- 3. Sync to profiles
  INSERT INTO public.profiles (user_id, display_name, organization_id, role, email)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'display_name', split_part(NEW.email,'@',1)),
    assigned_org,
    assigned_role,
    NEW.email
  )
  ON CONFLICT (user_id) DO UPDATE SET
    organization_id = COALESCE(EXCLUDED.organization_id, public.profiles.organization_id),
    role = EXCLUDED.role,
    email = EXCLUDED.email,
    updated_at = now();

  -- 4. Sync to user_roles
  DELETE FROM public.user_roles WHERE user_id = NEW.id;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, assigned_role);

  RETURN NEW;
END; $$;

-- 4. Update Chat Policies
-- Students can see messages in their level.
-- Teachers/Admins can see all messages in their organization.

DROP POLICY IF EXISTS "Users can view messages in their own school and level" ON public.chat_messages;
DROP POLICY IF EXISTS "Chat read access" ON public.chat_messages;
CREATE POLICY "Chat read access" ON public.chat_messages
FOR SELECT
USING (
  organization_id = (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1)
  AND (
    (
      public.has_role(auth.uid(), 'student') 
      AND level = (SELECT level FROM public.profiles WHERE user_id = auth.uid() LIMIT 1)
    )
    OR public.has_role(auth.uid(), 'teacher')
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'org_admin')
  )
);

DROP POLICY IF EXISTS "Users can send messages to their own school and level" ON public.chat_messages;
DROP POLICY IF EXISTS "Chat insert access" ON public.chat_messages;
CREATE POLICY "Chat insert access" ON public.chat_messages
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND organization_id = (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1)
  AND (
     (
       public.has_role(auth.uid(), 'student') 
       AND level = (SELECT level FROM public.profiles WHERE user_id = auth.uid() LIMIT 1)
     )
     OR public.has_role(auth.uid(), 'teacher')
     OR public.has_role(auth.uid(), 'admin')
     OR public.has_role(auth.uid(), 'org_admin')
  )
);

-- 5. Finalize profiles alignment
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'email') THEN
    ALTER TABLE public.profiles ADD COLUMN email TEXT;
  END IF;
END $$;

UPDATE public.profiles p SET email = u.email FROM public.users u WHERE p.user_id = u.id AND p.email IS NULL;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS email_match_auth;
ALTER TABLE public.profiles ADD CONSTRAINT email_match_auth CHECK (email IS NULL OR email = auth.email());

-- 6. Prevent Self-Promotion
CREATE OR REPLACE FUNCTION public.prevent_self_promotion()
RETURNS TRIGGER AS $$
BEGIN
  -- If the user is trying to change their own role or org and they are NOT already an admin
  IF auth.uid() = NEW.user_id THEN
    -- Check if OLD role was already admin
    IF NOT (SELECT (role IN ('admin', 'org_admin')) FROM public.profiles WHERE user_id = auth.uid()) THEN
      IF NEW.role <> OLD.role OR NEW.organization_id <> OLD.organization_id THEN
        RAISE EXCEPTION 'Security Policy: You are not authorized to modify your assigned role or institutional linkage.';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_prevent_self_promotion ON public.profiles;
CREATE TRIGGER trigger_prevent_self_promotion
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_self_promotion();

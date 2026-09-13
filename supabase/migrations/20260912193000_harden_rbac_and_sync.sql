-- Migration: Harden RBAC and Institutional Logic Sync
-- File: /supabase/migrations/20260912193000_harden_rbac_and_sync.sql

-- 1. Add organization_id to user_roles
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS organization_id TEXT;

-- Update existing user_roles from profiles if possible
UPDATE public.user_roles ur
SET organization_id = p.organization_id
FROM public.profiles p
WHERE ur.user_id = p.user_id AND ur.organization_id IS NULL;

-- 2. Create a secure role verification function (RPC)
-- This allows the frontend to verify roles without direct table access if desired
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role::text INTO v_role
  FROM public.user_roles
  WHERE user_id = auth.uid()
  LIMIT 1;
  
  RETURN COALESCE(v_role, 'student');
END;
$$;

-- 3. Enhance RLS on user_roles
DROP POLICY IF EXISTS "admins_read_all_roles" ON public.user_roles;
DROP POLICY IF EXISTS "users_read_own_roles" ON public.user_roles;

CREATE POLICY "Users can read own role" ON public.user_roles
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Institutional staff can read roles in their org" ON public.user_roles
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('admin', 'org_admin', 'teacher')
    AND ur.organization_id = public.user_roles.organization_id
  )
);

-- 4. Secure function for organization lookup
CREATE OR REPLACE FUNCTION public.get_user_organization(uid UUID)
RETURNS TEXT
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT organization_id FROM public.user_roles WHERE user_id = uid LIMIT 1;
$$;

-- 5. Update Chat Policies for strict context
-- Students: Only messages where level matches and organization_id matches.
-- Teachers/Admins: All messages in their organization.

DROP POLICY IF EXISTS "Chat read access" ON public.chat_messages;
CREATE POLICY "Chat read access" ON public.chat_messages
FOR SELECT
USING (
  organization_id = public.get_user_organization(auth.uid())
  AND (
    (
      public.has_role(auth.uid(), 'student') 
      AND level = (SELECT level FROM public.profiles WHERE user_id = auth.uid() LIMIT 1)
    )
    OR public.has_role(auth.uid(), 'teacher')
    OR public.has_role(auth.uid(), 'admin')
    -- 'org_admin' handled by public.has_role if updated
  )
);

-- Update has_role to handle new roles if needed (org_admin is often synonymous with admin in policies)
CREATE OR REPLACE FUNCTION public.has_role(uid uuid, requested_role text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = uid AND role::text = requested_role
  );
END;
$$;

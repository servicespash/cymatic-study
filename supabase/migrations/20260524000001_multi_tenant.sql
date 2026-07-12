-- Migration for Multi-Tenant Organization Support

-- 1. Create organizations table
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  school_key TEXT UNIQUE NOT NULL,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Add org_admin to app_role
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'org_admin';

-- 3. Extend profiles with org_id
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS level TEXT; -- S1, S2, etc.

-- 4. Extend project_submissions with org_id
ALTER TABLE public.project_submissions ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;

-- 5. RLS for organizations
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public select on organizations by school_key" 
  ON public.organizations FOR SELECT USING (true);

CREATE POLICY "Org admins can update their own org"
  ON public.organizations FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'org_admin' AND profiles.org_id = organizations.id)
  );

-- 6. Helper function to get user org_id
CREATE OR REPLACE FUNCTION public.get_user_org_id(uid uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (SELECT org_id FROM public.profiles WHERE user_id = uid);
END;
$$;

-- 7. Seed initial organizations
INSERT INTO public.organizations (name, slug, school_key)
VALUES 
  ('Kasenyi Secondary School', 'kasenyi-ss', 'kasenyi_ss'),
  ('Cymatic Secondary School', 'cymatic-ss', 'cymatic_ss')
ON CONFLICT (school_key) DO NOTHING;

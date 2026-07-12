-- Allow institution admins to register a new organization at signup
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS creator_user_id uuid,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS phone text;

CREATE UNIQUE INDEX IF NOT EXISTS organizations_school_key_unique
  ON public.organizations (school_key)
  WHERE school_key IS NOT NULL;

GRANT INSERT, UPDATE ON public.organizations TO authenticated;

DROP POLICY IF EXISTS "Authenticated users can create their organization" ON public.organizations;
CREATE POLICY "Authenticated users can create their organization"
  ON public.organizations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = creator_user_id);

DROP POLICY IF EXISTS "Creators can update their organization" ON public.organizations;
CREATE POLICY "Creators can update their organization"
  ON public.organizations
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = creator_user_id);


-- 1) Remove sensitive tables from realtime publication
ALTER PUBLICATION supabase_realtime DROP TABLE public.project_submissions;
ALTER PUBLICATION supabase_realtime DROP TABLE public.chat_messages;

-- 2) Block updates to sensitive profile columns via trigger
CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_verified IS DISTINCT FROM OLD.is_verified
     OR NEW.role IS DISTINCT FROM OLD.role
     OR NEW.org_id IS DISTINCT FROM OLD.org_id
     OR NEW.level IS DISTINCT FROM OLD.level
     OR NEW.teacher_license_id IS DISTINCT FROM OLD.teacher_license_id THEN
    RAISE EXCEPTION 'Cannot modify privileged profile columns from client';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_prevent_privilege_escalation ON public.profiles;
CREATE TRIGGER profiles_prevent_privilege_escalation
BEFORE UPDATE ON public.profiles
FOR EACH ROW
WHEN (current_setting('role', true) <> 'service_role')
EXECUTE FUNCTION public.prevent_profile_privilege_escalation();

-- 3) Restrict organizations SELECT to authenticated users only
DROP POLICY IF EXISTS "Organizations are publicly readable" ON public.organizations;
CREATE POLICY "Organizations readable by authenticated"
ON public.organizations FOR SELECT
TO authenticated
USING (true);

-- 4) Scope chat_messages SELECT by org_id + level matching caller's profile
DROP POLICY IF EXISTS "Authenticated users can read chat messages" ON public.chat_messages;
CREATE POLICY "Users read chat in their org and level"
ON public.chat_messages FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND (
        (chat_messages.org_id IS NULL AND p.org_id IS NULL)
        OR chat_messages.org_id::text = p.org_id::text
      )
      AND (
        (chat_messages.level IS NULL AND p.level IS NULL)
        OR chat_messages.level = p.level
      )
  )
);

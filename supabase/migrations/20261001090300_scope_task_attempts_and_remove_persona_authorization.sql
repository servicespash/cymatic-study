-- Task attempts are organization-scoped; tutor persona is never authorization.
ALTER TABLE public.task_attempts ADD COLUMN IF NOT EXISTS organization_id uuid;

UPDATE public.task_attempts ta
SET organization_id = p.organization_id
FROM public.profiles p
WHERE p.user_id = ta.user_id
  AND ta.organization_id IS NULL
  AND p.organization_id IS NOT NULL;

ALTER TABLE public.task_attempts
  ADD CONSTRAINT task_attempts_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS task_attempts_org_user_idx
  ON public.task_attempts(organization_id,user_id);

DROP POLICY IF EXISTS "Users/Teachers can update attempts" ON public.task_attempts;
DROP POLICY IF EXISTS attempts_select_own ON public.task_attempts;
DROP POLICY IF EXISTS attempts_insert_own ON public.task_attempts;

CREATE POLICY attempts_select_scoped ON public.task_attempts
FOR SELECT TO authenticated
USING (
  user_id = (SELECT auth.uid())
  OR (
    organization_id = public.current_organization_id()
    AND (
      public.has_app_role((SELECT auth.uid()), 'admin'::public.app_role)
      OR public.has_app_role((SELECT auth.uid()), 'org_admin'::public.app_role)
      OR public.has_app_role((SELECT auth.uid()), 'teacher'::public.app_role)
    )
  )
);

CREATE POLICY attempts_insert_own ON public.task_attempts
FOR INSERT TO authenticated
WITH CHECK (
  user_id = (SELECT auth.uid())
  AND organization_id IS NOT DISTINCT FROM public.current_organization_id()
);

CREATE POLICY attempts_update_scoped ON public.task_attempts
FOR UPDATE TO authenticated
USING (
  user_id = (SELECT auth.uid())
  OR (
    organization_id = public.current_organization_id()
    AND (
      public.has_app_role((SELECT auth.uid()), 'admin'::public.app_role)
      OR public.has_app_role((SELECT auth.uid()), 'org_admin'::public.app_role)
      OR public.has_app_role((SELECT auth.uid()), 'teacher'::public.app_role)
    )
  )
)
WITH CHECK (
  user_id = (SELECT auth.uid())
  OR (
    organization_id = public.current_organization_id()
    AND (
      public.has_app_role((SELECT auth.uid()), 'admin'::public.app_role)
      OR public.has_app_role((SELECT auth.uid()), 'org_admin'::public.app_role)
      OR public.has_app_role((SELECT auth.uid()), 'teacher'::public.app_role)
    )
  )
);

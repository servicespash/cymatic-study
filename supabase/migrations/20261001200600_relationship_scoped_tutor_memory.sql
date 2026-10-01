-- Relationship-scoped tutor memory. Broad model knowledge is never stored here.
CREATE TABLE IF NOT EXISTS public.tutor_relationship_memory (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
 subject_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 relationship text NOT NULL CHECK (relationship IN ('student','teacher','admin')),
 memory_type text NOT NULL CHECK (memory_type IN ('preference','learning_pattern','goal','academic_history','interaction_preference','helpful_context','safety_context')),
 memory text NOT NULL,
 confidence numeric(4,3) NOT NULL DEFAULT 0.5 CHECK(confidence BETWEEN 0 AND 1),
 source text NOT NULL DEFAULT 'conversation',
 sensitivity text NOT NULL DEFAULT 'standard' CHECK(sensitivity IN ('standard','restricted')),
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tutor_relationship_memory ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS tutor_rel_memory_subject_idx ON public.tutor_relationship_memory(subject_user_id,relationship,updated_at DESC);
CREATE INDEX IF NOT EXISTS tutor_rel_memory_org_idx ON public.tutor_relationship_memory(organization_id,subject_user_id);

-- The signed-in person can read/write only their own relationship memory.
DROP POLICY IF EXISTS tutor_rel_memory_self_read ON public.tutor_relationship_memory FOR SELECT TO authenticated
USING(subject_user_id=auth.uid());
DROP POLICY IF EXISTS tutor_rel_memory_self_insert ON public.tutor_relationship_memory FOR INSERT TO authenticated
WITH CHECK(subject_user_id=auth.uid() AND organization_id IS NOT DISTINCT FROM public.current_organization_id());
DROP POLICY IF EXISTS tutor_rel_memory_self_update ON public.tutor_relationship_memory FOR UPDATE TO authenticated
USING(subject_user_id=auth.uid()) WITH CHECK(subject_user_id=auth.uid() AND organization_id IS NOT DISTINCT FROM public.current_organization_id());

-- Staff can read only standard, organization-scoped relationship memory. Restricted memory
-- is never exposed through this policy.
DROP POLICY IF EXISTS tutor_rel_memory_staff_read ON public.tutor_relationship_memory FOR SELECT TO authenticated
USING(
 organization_id=public.current_organization_id()
 AND sensitivity='standard'
 AND (public.has_app_role(auth.uid(),'teacher') OR public.has_app_role(auth.uid(),'admin') OR public.has_app_role(auth.uid(),'org_admin'))
);

CREATE OR REPLACE FUNCTION public.get_tutor_relationship_memory(target_user uuid, target_relationship text DEFAULT NULL)
RETURNS TABLE(memory_type text,memory text,confidence numeric,source text,updated_at timestamptz)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path=public AS $$
 SELECT m.memory_type,m.memory,m.confidence,m.source,m.updated_at
 FROM public.tutor_relationship_memory m
 WHERE m.subject_user_id=target_user
   AND (target_relationship IS NULL OR m.relationship=target_relationship)
   AND (
     target_user=(select auth.uid())
     OR (
       m.organization_id=public.current_organization_id()
       AND m.sensitivity='standard'
       AND (public.has_app_role(auth.uid(),'teacher') OR public.has_app_role(auth.uid(),'admin') OR public.has_app_role(auth.uid(),'org_admin'))
     )
   )
 ORDER BY m.updated_at DESC LIMIT 60;
$$;
REVOKE ALL ON FUNCTION public.get_tutor_relationship_memory(uuid,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_tutor_relationship_memory(uuid,text) TO authenticated;

-- Safety/monitoring taxonomy. This stores signals, not accusations or diagnoses.
CREATE TABLE IF NOT EXISTS public.tutor_safety_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 chat_message_id uuid,
 category text NOT NULL CHECK(category IN ('self_harm','substance_risk','sexual_content','exploitation','hate_or_abuse','other_safety')),
 severity text NOT NULL CHECK(severity IN ('notice','elevated','urgent')),
 signal_summary text NOT NULL,
 action_taken text NOT NULL,
 notified_staff boolean NOT NULL DEFAULT false,
 created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tutor_safety_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tutor_safety_self_read ON public.tutor_safety_events FOR SELECT TO authenticated USING(user_id=auth.uid());
DROP POLICY IF EXISTS tutor_safety_staff_read ON public.tutor_safety_events FOR SELECT TO authenticated USING(
 organization_id=public.current_organization_id()
 AND (public.has_app_role(auth.uid(),'teacher') OR public.has_app_role(auth.uid(),'admin') OR public.has_app_role(auth.uid(),'org_admin'))
);

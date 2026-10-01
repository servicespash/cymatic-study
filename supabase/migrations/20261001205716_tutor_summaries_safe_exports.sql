CREATE TABLE IF NOT EXISTS public.tutor_study_summaries (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
 owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 cohort_id uuid REFERENCES public.cohorts(id) ON DELETE SET NULL,
 title text NOT NULL,
 summary text NOT NULL,
 findings jsonb NOT NULL DEFAULT '[]'::jsonb,
 sources jsonb NOT NULL DEFAULT '[]'::jsonb,
 visibility text NOT NULL DEFAULT 'private' CHECK(visibility IN('private','cohort','staff')),
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tutor_study_summaries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS study_summary_owner_read ON public.tutor_study_summaries;
CREATE POLICY study_summary_owner_read ON public.tutor_study_summaries FOR SELECT TO authenticated USING(owner_user_id=auth.uid());
DROP POLICY IF EXISTS study_summary_owner_write ON public.tutor_study_summaries;
CREATE POLICY study_summary_owner_write ON public.tutor_study_summaries FOR INSERT TO authenticated WITH CHECK(owner_user_id=auth.uid() AND organization_id IS NOT DISTINCT FROM public.current_organization_id());
DROP POLICY IF EXISTS study_summary_owner_update ON public.tutor_study_summaries;
CREATE POLICY study_summary_owner_update ON public.tutor_study_summaries FOR UPDATE TO authenticated USING(owner_user_id=auth.uid()) WITH CHECK(owner_user_id=auth.uid());
DROP POLICY IF EXISTS study_summary_staff_read ON public.tutor_study_summaries;
CREATE POLICY study_summary_staff_read ON public.tutor_study_summaries FOR SELECT TO authenticated USING(
 organization_id=public.current_organization_id() AND visibility IN('cohort','staff')
 AND (public.has_app_role(auth.uid(),'teacher') OR public.has_app_role(auth.uid(),'admin') OR public.has_app_role(auth.uid(),'org_admin'))
);

-- Export is an explicit, auditable outbox. It stores only the redacted payload.
CREATE TABLE IF NOT EXISTS public.tutor_summary_exports (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 summary_id uuid NOT NULL REFERENCES public.tutor_study_summaries(id) ON DELETE CASCADE,
 requested_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 channel text NOT NULL CHECK(channel IN('email','whatsapp','social','link')),
 redacted_payload text NOT NULL,
 destination_hint text,
 status text NOT NULL DEFAULT 'pending' CHECK(status IN('pending','sent','failed','revoked')),
 share_token_hash text,
 expires_at timestamptz NOT NULL DEFAULT now()+interval '24 hours',
 created_at timestamptz NOT NULL DEFAULT now(),
 sent_at timestamptz
);
ALTER TABLE public.tutor_summary_exports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS summary_export_owner_read ON public.tutor_summary_exports;
CREATE POLICY summary_export_owner_read ON public.tutor_summary_exports FOR SELECT TO authenticated
USING(requested_by=auth.uid());
DROP POLICY IF EXISTS summary_export_owner_insert ON public.tutor_summary_exports;
CREATE POLICY summary_export_owner_insert ON public.tutor_summary_exports FOR INSERT TO authenticated
WITH CHECK(requested_by=auth.uid());
DROP POLICY IF EXISTS summary_export_owner_update ON public.tutor_summary_exports;
CREATE POLICY summary_export_owner_update ON public.tutor_summary_exports FOR UPDATE TO authenticated
USING(requested_by=auth.uid()) WITH CHECK(requested_by=auth.uid());

CREATE OR REPLACE FUNCTION public.queue_tutor_summary_export(
 target_summary uuid, target_channel text, safe_payload text, destination text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE id_out uuid;
BEGIN
 IF target_channel NOT IN('email','whatsapp','social','link') THEN RAISE EXCEPTION 'Unsupported export channel'; END IF;
 IF length(safe_payload)>12000 THEN RAISE EXCEPTION 'Export payload too large'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.tutor_study_summaries s WHERE s.id=target_summary AND s.owner_user_id=auth.uid()) THEN
  RAISE EXCEPTION 'Not authorized for summary export';
 END IF;
 INSERT INTO public.tutor_summary_exports(summary_id,requested_by,channel,redacted_payload,destination_hint)
 VALUES(target_summary,auth.uid(),target_channel,safe_payload,destination) RETURNING id INTO id_out;
 RETURN id_out;
END; $$;
REVOKE ALL ON FUNCTION public.queue_tutor_summary_export(uuid,text,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.queue_tutor_summary_export(uuid,text,text,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.record_tutor_safety_event(
 target_user uuid,target_message uuid,target_category text,target_severity text,target_summary text,target_action text
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE org uuid; event_id uuid;
BEGIN
 IF auth.uid() IS NULL OR auth.uid() IS DISTINCT FROM target_user THEN RAISE EXCEPTION 'Unauthorized safety event'; END IF;
 SELECT organization_id INTO org FROM public.profiles WHERE user_id=target_user;
 INSERT INTO public.tutor_safety_events(organization_id,user_id,chat_message_id,category,severity,signal_summary,action_taken,notified_staff)
 VALUES(org,target_user,target_message,target_category,target_severity,target_summary,target_action,false) RETURNING id INTO event_id;
 IF target_severity='urgent' THEN
   UPDATE public.tutor_safety_events SET notified_staff=true WHERE id=event_id;
   INSERT INTO public.tutor_notifications(organization_id,recipient_user_id,title,message,severity)
   SELECT org,ur.user_id,'Tutor safety alert','A safety-sensitive interaction requires prompt staff review. The tutor has applied its safety response.','urgent'
   FROM public.user_roles ur WHERE ur.organization_id=org AND ur.role IN('teacher','admin','org_admin');
 END IF;
 RETURN event_id;
END; $$;
REVOKE ALL ON FUNCTION public.record_tutor_safety_event(uuid,uuid,text,text,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_tutor_safety_event(uuid,uuid,text,text,text,text) TO authenticated;

-- Cymatic Tutor cohort intelligence, performance monitoring, chat governance,
-- learning goals and privacy-bounded long-term memory.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS level text,
  ADD COLUMN IF NOT EXISTS username text,
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS teacher_license_id text;

ALTER TABLE public.user_points ADD COLUMN IF NOT EXISTS organization_id uuid;
UPDATE public.user_points up SET organization_id=p.organization_id
FROM public.profiles p WHERE p.user_id=up.user_id AND up.organization_id IS NULL;
CREATE INDEX IF NOT EXISTS user_points_org_user_date_idx ON public.user_points(organization_id,user_id,created_at);

CREATE TABLE IF NOT EXISTS public.cohorts (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
 name text NOT NULL, class_level text NOT NULL, stream text, academic_year integer,
 is_active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(organization_id,name)
);
CREATE INDEX IF NOT EXISTS cohorts_org_idx ON public.cohorts(organization_id);
ALTER TABLE public.cohorts ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.cohort_members (
 cohort_id uuid NOT NULL REFERENCES public.cohorts(id) ON DELETE CASCADE,
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
 membership_role public.app_role NOT NULL DEFAULT 'student',
 joined_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(cohort_id,user_id)
);
CREATE INDEX IF NOT EXISTS cohort_members_org_user_idx ON public.cohort_members(organization_id,user_id);
ALTER TABLE public.cohort_members ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.chat_messages (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
 cohort_id uuid REFERENCES public.cohorts(id) ON DELETE CASCADE,
 level text, stream text, subject text, content text NOT NULL,
 file_url text, file_type text, file_name text,
 sender_role public.app_role, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS chat_messages_scope_idx ON public.chat_messages(organization_id,cohort_id,created_at);
CREATE INDEX IF NOT EXISTS chat_messages_user_idx ON public.chat_messages(user_id,created_at);
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.chat_locks (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
 cohort_id uuid REFERENCES public.cohorts(id) ON DELETE CASCADE,
 user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
 locked_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
 reason text NOT NULL, severity text NOT NULL DEFAULT 'moderate'
   CHECK(severity IN ('notice','warning','moderate','high')),
 locked_at timestamptz NOT NULL DEFAULT now(), locked_until timestamptz NOT NULL,
 unlocked_at timestamptz, unlocked_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
 unlock_reason text, metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
 CHECK(locked_until>locked_at)
);
ALTER TABLE public.chat_locks ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS chat_locks_user_active_idx ON public.chat_locks(user_id,locked_until) WHERE unlocked_at IS NULL;

CREATE TABLE IF NOT EXISTS public.tutor_monitor_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
 cohort_id uuid REFERENCES public.cohorts(id) ON DELETE CASCADE,
 user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
 chat_message_id uuid REFERENCES public.chat_messages(id) ON DELETE SET NULL,
 event_type text NOT NULL CHECK(event_type IN('drift_notice','drift_warning','drift_escalation','performance_alert','lock_applied','lock_expired','teacher_advice')),
 severity text NOT NULL CHECK(severity IN('info','notice','warning','high')),
 score numeric(5,2), subject text, summary text NOT NULL,
 evidence jsonb NOT NULL DEFAULT '{}'::jsonb, created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tutor_monitor_events ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS tutor_monitor_events_org_date_idx ON public.tutor_monitor_events(organization_id,created_at DESC);

CREATE TABLE IF NOT EXISTS public.tutor_notifications (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
 recipient_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 event_id uuid REFERENCES public.tutor_monitor_events(id) ON DELETE CASCADE,
 title text NOT NULL, message text NOT NULL,
 severity text NOT NULL DEFAULT 'notice' CHECK(severity IN('info','notice','warning','high')),
 read_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tutor_notifications ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS tutor_notifications_recipient_idx ON public.tutor_notifications(recipient_user_id,read_at,created_at DESC);

CREATE TABLE IF NOT EXISTS public.learning_goals (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
 goal_scope text NOT NULL CHECK(goal_scope IN('daily','weekly','term')),
 period_start date NOT NULL, period_end date NOT NULL,
 target_points integer NOT NULL CHECK(target_points>=0),
 achieved_points integer NOT NULL DEFAULT 0 CHECK(achieved_points>=0),
 target_description text, created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(user_id,goal_scope,period_start)
);
ALTER TABLE public.learning_goals ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS learning_goals_user_scope_idx ON public.learning_goals(user_id,goal_scope,period_start DESC);

CREATE TABLE IF NOT EXISTS public.tutor_memory (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
 organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
 memory_type text NOT NULL CHECK(memory_type IN('preference','learning_pattern','goal','interaction_style','academic_history','teacher_note','admin_note')),
 subject text, memory text NOT NULL,
 confidence numeric(4,3) NOT NULL DEFAULT .5 CHECK(confidence BETWEEN 0 AND 1),
 source text NOT NULL DEFAULT 'tutor',
 sensitivity text NOT NULL DEFAULT 'standard' CHECK(sensitivity IN('standard','private')),
 expires_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tutor_memory ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS tutor_memory_user_type_idx ON public.tutor_memory(user_id,memory_type,updated_at DESC);

CREATE OR REPLACE FUNCTION public.get_cohort_performance(target_cohort uuid)
RETURNS TABLE(user_id uuid,display_name text,cohort_id uuid,average_score numeric,attempts bigint,passed_attempts bigint,points bigint,last_activity timestamptz,performance_band text)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path=public AS $$
 SELECT cm.user_id,p.display_name,cm.cohort_id,COALESCE(round(avg(ta.score_pct),2),0),
 count(ta.id),count(ta.id) FILTER(WHERE ta.passed),
 COALESCE((SELECT sum(up.points) FROM public.user_points up WHERE up.user_id=cm.user_id AND up.organization_id=cm.organization_id),0),
 max(ta.created_at),
 CASE WHEN count(ta.id)=0 THEN 'insufficient_data' WHEN avg(ta.score_pct)>=80 THEN 'strong_progress'
 WHEN avg(ta.score_pct)>=60 THEN 'on_track' WHEN avg(ta.score_pct)>=40 THEN 'needs_support' ELSE 'at_risk' END
 FROM public.cohort_members cm JOIN public.profiles p ON p.user_id=cm.user_id
 LEFT JOIN public.task_attempts ta ON ta.user_id=cm.user_id AND ta.organization_id=cm.organization_id
 WHERE cm.cohort_id=target_cohort
 GROUP BY cm.user_id,p.display_name,cm.cohort_id,cm.organization_id;
$$;

CREATE OR REPLACE FUNCTION public.get_active_chat_lock(target_user uuid)
RETURNS TABLE(locked_until timestamptz,reason text,severity text)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path=public AS $$
 SELECT locked_until,reason,severity FROM public.chat_locks
 WHERE user_id=target_user AND unlocked_at IS NULL AND locked_until>now()
 ORDER BY locked_until DESC LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.apply_tutor_chat_lock(target_user uuid,target_cohort uuid,lock_minutes integer,lock_reason text,lock_severity text DEFAULT 'warning')
RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE caller uuid:=auth.uid(); caller_org uuid; target_org uuid; new_lock uuid;
BEGIN
 SELECT organization_id INTO caller_org FROM public.profiles WHERE user_id=caller;
 SELECT organization_id INTO target_org FROM public.profiles WHERE user_id=target_user;
 IF caller IS NULL OR caller_org IS NULL OR target_org IS DISTINCT FROM caller_org THEN RAISE EXCEPTION 'Unauthorized organization scope'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=caller AND role IN('admin','org_admin','teacher')) THEN RAISE EXCEPTION 'Only authorized educators or administrators may apply a lock'; END IF;
 IF lock_minutes<1 OR lock_minutes>1440 THEN RAISE EXCEPTION 'Invalid lock duration'; END IF;
 INSERT INTO public.chat_locks(organization_id,cohort_id,user_id,locked_by,reason,severity,locked_until)
 VALUES(target_org,target_cohort,target_user,caller,lock_reason,lock_severity,now()+make_interval(mins=>lock_minutes))
 RETURNING id INTO new_lock; RETURN new_lock;
END; $$;

-- Sender role is derived from authoritative user_roles, never from the client.
CREATE OR REPLACE FUNCTION public.set_chat_sender_context() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
BEGIN
 SELECT ur.role,p.organization_id,p.level INTO NEW.sender_role,NEW.organization_id,NEW.level
 FROM public.profiles p JOIN LATERAL(
   SELECT role FROM public.user_roles WHERE user_id=NEW.user_id ORDER BY created_at LIMIT 1
 ) ur ON true WHERE p.user_id=NEW.user_id;
 RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS chat_sender_context ON public.chat_messages;
CREATE TRIGGER chat_sender_context BEFORE INSERT ON public.chat_messages FOR EACH ROW EXECUTE FUNCTION public.set_chat_sender_context();

-- Policies.
DROP POLICY IF EXISTS cohort_self_or_staff ON public.cohorts;
CREATE POLICY cohort_self_or_staff ON public.cohorts FOR SELECT TO authenticated USING(organization_id=public.current_organization_id());

DROP POLICY IF EXISTS cohort_members_self_or_staff ON public.cohort_members;
CREATE POLICY cohort_members_self_or_staff ON public.cohort_members FOR SELECT TO authenticated
USING(organization_id=public.current_organization_id() AND(
 user_id=auth.uid() OR public.has_app_role(auth.uid(),'teacher') OR public.has_app_role(auth.uid(),'admin') OR public.has_app_role(auth.uid(),'org_admin')));

DROP POLICY IF EXISTS chat_messages_scoped_read ON public.chat_messages;
CREATE POLICY chat_messages_scoped_read ON public.chat_messages FOR SELECT TO authenticated
USING(organization_id=public.current_organization_id() AND(
 user_id=auth.uid() OR public.has_app_role(auth.uid(),'teacher') OR public.has_app_role(auth.uid(),'admin') OR public.has_app_role(auth.uid(),'org_admin')
 OR EXISTS(SELECT 1 FROM public.cohort_members cm WHERE cm.cohort_id=chat_messages.cohort_id AND cm.user_id=auth.uid())));

DROP POLICY IF EXISTS chat_messages_scoped_insert ON public.chat_messages;
CREATE POLICY chat_messages_scoped_insert ON public.chat_messages FOR INSERT TO authenticated
WITH CHECK(user_id=auth.uid() AND organization_id IS NOT DISTINCT FROM public.current_organization_id()
 AND NOT EXISTS(SELECT 1 FROM public.chat_locks cl WHERE cl.user_id=auth.uid() AND cl.unlocked_at IS NULL AND cl.locked_until>now()));

DROP POLICY IF EXISTS chat_locks_self_read ON public.chat_locks;
CREATE POLICY chat_locks_self_read ON public.chat_locks FOR SELECT TO authenticated
USING(user_id=auth.uid() OR(organization_id=public.current_organization_id() AND(
 public.has_app_role(auth.uid(),'teacher') OR public.has_app_role(auth.uid(),'admin') OR public.has_app_role(auth.uid(),'org_admin'))));

DROP POLICY IF EXISTS monitor_events_staff ON public.tutor_monitor_events;
CREATE POLICY monitor_events_staff ON public.tutor_monitor_events FOR SELECT TO authenticated
USING(organization_id=public.current_organization_id() AND(user_id=auth.uid() OR public.has_app_role(auth.uid(),'teacher') OR public.has_app_role(auth.uid(),'admin') OR public.has_app_role(auth.uid(),'org_admin')));

DROP POLICY IF EXISTS notifications_recipient ON public.tutor_notifications;
CREATE POLICY notifications_recipient ON public.tutor_notifications FOR SELECT TO authenticated USING(recipient_user_id=auth.uid());

DROP POLICY IF EXISTS goals_self ON public.learning_goals;
CREATE POLICY goals_self ON public.learning_goals FOR SELECT TO authenticated USING(user_id=auth.uid());

DROP POLICY IF EXISTS memory_self ON public.tutor_memory;
CREATE POLICY memory_self ON public.tutor_memory FOR SELECT TO authenticated USING(user_id=auth.uid());

DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='chat_messages')
 THEN ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages; END IF;
END $$;


-- The tutor may monitor only the authenticated user's own drift.
-- Three drift events inside ten minutes trigger a 15-minute study reset,
-- plus notifications to authorized staff in the same organization.
CREATE OR REPLACE FUNCTION public.record_tutor_drift(
 target_user uuid,target_cohort uuid,target_message uuid,target_subject text,
 drift_score numeric,drift_summary text
) RETURNS TABLE(lock_applied boolean,locked_until timestamptz,escalation_count integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE caller uuid:=auth.uid(); org uuid; recent_count integer; until_ts timestamptz;
BEGIN
 IF caller IS NULL OR caller IS DISTINCT FROM target_user THEN RAISE EXCEPTION 'Only the monitored user may trigger their own tutor drift monitor'; END IF;
 SELECT organization_id INTO org FROM public.profiles WHERE user_id=target_user;
 INSERT INTO public.tutor_monitor_events(organization_id,cohort_id,user_id,chat_message_id,event_type,severity,score,subject,summary,evidence)
 VALUES(org,target_cohort,target_user,target_message,CASE WHEN drift_score>=.8 THEN 'drift_warning' ELSE 'drift_notice' END,
 CASE WHEN drift_score>=.8 THEN 'warning' ELSE 'notice' END,drift_score,target_subject,drift_summary,
 jsonb_build_object('source','tutor','window_minutes',10));
 SELECT count(*)::integer INTO recent_count FROM public.tutor_monitor_events
 WHERE user_id=target_user AND event_type IN('drift_notice','drift_warning','drift_escalation')
 AND created_at>=now()-interval '10 minutes';
 IF recent_count>=3 THEN
  until_ts:=now()+interval '15 minutes';
  INSERT INTO public.tutor_monitor_events(organization_id,cohort_id,user_id,event_type,severity,score,subject,summary,evidence)
  VALUES(org,target_cohort,target_user,'drift_escalation','high',drift_score,target_subject,
   'Study-content drift persisted across multiple tutor interventions; chat temporarily locked for a focused study reset.',
   jsonb_build_object('escalation_count',recent_count,'lock_minutes',15));
  INSERT INTO public.chat_locks(organization_id,cohort_id,user_id,locked_by,reason,severity,locked_until,metadata)
  VALUES(org,target_cohort,target_user,target_user,'Persistent off-study chat drift after repeated tutor redirection.','moderate',until_ts,
   jsonb_build_object('source','tutor','escalation_count',recent_count));
  INSERT INTO public.tutor_notifications(organization_id,recipient_user_id,title,message,severity)
  SELECT org,ur.user_id,'Tutor study-monitor alert',
   format('%s has repeatedly drifted away from study content in chat. The tutor applied a 15-minute study reset and flagged the interaction for review.',
     COALESCE((SELECT display_name FROM public.profiles WHERE user_id=target_user),'A student')),'warning'
  FROM public.user_roles ur WHERE ur.organization_id=org AND ur.role IN('teacher','admin','org_admin');
  RETURN QUERY SELECT true,until_ts,recent_count;
 ELSE
  RETURN QUERY SELECT false,NULL::timestamptz,recent_count;
 END IF;
END; $$;
REVOKE ALL ON FUNCTION public.record_tutor_drift(uuid,uuid,uuid,text,numeric,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_tutor_drift(uuid,uuid,uuid,text,numeric,text) TO authenticated;

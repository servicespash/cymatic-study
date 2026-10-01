CREATE OR REPLACE FUNCTION public.get_organization_student_performance()
RETURNS TABLE(user_id uuid,display_name text,level text,average_score numeric,attempts bigint,passed_attempts bigint,points bigint,last_activity timestamptz,performance_band text)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path=public AS $$
 SELECT p.user_id,p.display_name,p.level,COALESCE(round(avg(ta.score_pct),2),0),
 count(ta.id),count(ta.id) FILTER(WHERE ta.passed),
 COALESCE((SELECT sum(up.points) FROM public.user_points up WHERE up.user_id=p.user_id AND up.organization_id=p.organization_id),0),
 max(ta.created_at),
 CASE WHEN count(ta.id)=0 THEN 'insufficient_data' WHEN avg(ta.score_pct)>=80 THEN 'strong_progress'
 WHEN avg(ta.score_pct)>=60 THEN 'on_track' WHEN avg(ta.score_pct)>=40 THEN 'needs_support' ELSE 'at_risk' END
 FROM public.profiles p LEFT JOIN public.task_attempts ta ON ta.user_id=p.user_id AND ta.organization_id=p.organization_id
 WHERE p.organization_id=public.current_organization_id()
 AND EXISTS(SELECT 1 FROM public.user_roles ur WHERE ur.user_id=p.user_id AND ur.role='student')
 GROUP BY p.user_id,p.display_name,p.level,p.organization_id;
$$;

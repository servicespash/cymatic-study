DROP POLICY IF EXISTS hub_topics_authenticated_read ON public.hub_topics;
CREATE POLICY hub_topics_authenticated_read ON public.hub_topics FOR SELECT TO authenticated USING(true);

DROP POLICY IF EXISTS study_guides_authenticated_read ON public.study_guides;
CREATE POLICY study_guides_authenticated_read ON public.study_guides FOR SELECT TO authenticated USING(true);

DROP POLICY IF EXISTS organizations_current_org_read ON public.organizations;
CREATE POLICY organizations_current_org_read ON public.organizations FOR SELECT TO authenticated
USING(id=public.current_organization_id());

ALTER FUNCTION public._auth_uid() SET search_path = public, pg_temp;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_submissions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_submissions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_submissions TO service_role;
NOTIFY pgrst, reload_schema;

ALTER TABLE public.daily_tasks
 ADD COLUMN IF NOT EXISTS title text,
 ADD COLUMN IF NOT EXISTS subject text,
 ADD COLUMN IF NOT EXISTS points integer NOT NULL DEFAULT 0,
 ADD COLUMN IF NOT EXISTS tutor_explanation text,
 ADD COLUMN IF NOT EXISTS created_by text DEFAULT 'tutor',
 ADD COLUMN IF NOT EXISTS organization_id uuid;
UPDATE public.daily_tasks dt SET organization_id=p.organization_id
FROM public.profiles p WHERE p.user_id=dt.user_id AND dt.organization_id IS NULL;
CREATE INDEX IF NOT EXISTS daily_tasks_org_date_idx ON public.daily_tasks(organization_id,assigned_date,user_id);

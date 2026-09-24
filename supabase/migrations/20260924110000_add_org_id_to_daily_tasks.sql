ALTER TABLE public.daily_tasks
ADD COLUMN IF NOT EXISTS org_id TEXT;

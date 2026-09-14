ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS level TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stream TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS school_id TEXT;
NOTIFY pgrst, reload_schema;

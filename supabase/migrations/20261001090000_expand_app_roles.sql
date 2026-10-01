-- Expand the canonical application role enum before role-scoped migrations.
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'org_admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'independent_learner';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'independent_teacher';

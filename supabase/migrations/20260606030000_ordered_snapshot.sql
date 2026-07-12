-- Ordered schema snapshot for selected public tables.
-- This file is runnable and creates the listed tables and related types in the correct order.
-- It is intended as a standalone schema snapshot for reference or initial provisioning.

SET search_path = public;

CREATE TYPE IF NOT EXISTS public.app_role AS ENUM ('admin', 'student', 'teacher', 'org_admin');

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  display_name text,
  tutor_persona text NOT NULL DEFAULT 'adam',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  school_name text,
  phone text,
  current_mood text,
  referral_code text DEFAULT SUBSTRING(md5((random())::text) FROM 1 FOR 8) UNIQUE,
  CONSTRAINT profiles_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL DEFAULT 'student',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_roles_pkey PRIMARY KEY (id),
  CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS public.user_points (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  points integer NOT NULL DEFAULT 0,
  source text NOT NULL,
  meta jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_points_pkey PRIMARY KEY (id),
  CONSTRAINT user_points_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS public.task_attempts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  topic_id text NOT NULL,
  score_pct numeric NOT NULL CHECK (score_pct >= 0 AND score_pct <= 100),
  passed boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  answers jsonb,
  CONSTRAINT task_attempts_pkey PRIMARY KEY (id),
  CONSTRAINT task_attempts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS public.news_broadcasts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  media_url text,
  media_type text,
  is_ad boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  published_at timestamptz NOT NULL DEFAULT now(),
  is_curriculum_update boolean DEFAULT false,
  category text DEFAULT 'General',
  priority text DEFAULT 'normal',
  expires_at timestamptz,
  CONSTRAINT news_broadcasts_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.quiz_questions (
  id text NOT NULL,
  topic_id text NOT NULL,
  question text NOT NULL,
  options text[] NOT NULL,
  correct_index integer NOT NULL,
  explanation text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT quiz_questions_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.daily_tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  task_type text NOT NULL,
  reference_id text,
  description text NOT NULL,
  is_completed boolean NOT NULL DEFAULT false,
  assigned_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT daily_tasks_pkey PRIMARY KEY (id),
  CONSTRAINT daily_tasks_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS public.daily_challenges (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  assigned_date date NOT NULL DEFAULT CURRENT_DATE,
  target_points integer NOT NULL DEFAULT 100,
  earned_points integer NOT NULL DEFAULT 0,
  is_completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT daily_challenges_pkey PRIMARY KEY (id),
  CONSTRAINT daily_challenges_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS public.users (
  id uuid NOT NULL,
  email text UNIQUE,
  full_name text,
  avatar_url text,
  is_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS public.app_config (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  whatsapp_number text,
  support_email text,
  mobile_money_details text,
  merchant_id text,
  support_price text,
  about_app text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT app_config_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.referrals (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL,
  referred_user_id uuid NOT NULL UNIQUE,
  referred_at timestamptz NOT NULL DEFAULT now(),
  is_verified boolean NOT NULL DEFAULT false,
  CONSTRAINT referrals_pkey PRIMARY KEY (id),
  CONSTRAINT referrals_referrer_id_fkey FOREIGN KEY (referrer_id) REFERENCES auth.users(id),
  CONSTRAINT referrals_referred_user_id_fkey FOREIGN KEY (referred_user_id) REFERENCES auth.users(id)
);


-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  display_name TEXT,
  tutor_persona TEXT NOT NULL DEFAULT 'adams',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Points
CREATE TABLE public.user_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  points INTEGER NOT NULL DEFAULT 0,
  source TEXT NOT NULL,
  meta JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;
CREATE POLICY "points_select_own" ON public.user_points FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "points_insert_own" ON public.user_points FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Task attempts
CREATE TABLE public.task_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  topic_id TEXT NOT NULL,
  score_pct NUMERIC NOT NULL,
  passed BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.task_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "attempts_select_own" ON public.task_attempts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "attempts_insert_own" ON public.task_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);

-- News broadcasts
CREATE TABLE public.news_broadcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  media_url TEXT,
  media_type TEXT,
  is_ad BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  published_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.news_broadcasts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "news_public_read" ON public.news_broadcasts FOR SELECT USING (is_active = true);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email,'@',1)));
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
-- 1. Storage policies for the private 'news' bucket: deny all client access.
-- Service role bypasses RLS, so admin-side uploads still work; clients use signed URLs.
DROP POLICY IF EXISTS "news_no_client_select" ON storage.objects;
DROP POLICY IF EXISTS "news_no_client_insert" ON storage.objects;
DROP POLICY IF EXISTS "news_no_client_update" ON storage.objects;
DROP POLICY IF EXISTS "news_no_client_delete" ON storage.objects;

CREATE POLICY "news_no_client_select" ON storage.objects
  FOR SELECT TO authenticated, anon
  USING (bucket_id <> 'news');
CREATE POLICY "news_no_client_insert" ON storage.objects
  FOR INSERT TO authenticated, anon
  WITH CHECK (bucket_id <> 'news');
CREATE POLICY "news_no_client_update" ON storage.objects
  FOR UPDATE TO authenticated, anon
  USING (bucket_id <> 'news');
CREATE POLICY "news_no_client_delete" ON storage.objects
  FOR DELETE TO authenticated, anon
  USING (bucket_id <> 'news');

-- 2. Score range guard
ALTER TABLE public.task_attempts
  DROP CONSTRAINT IF EXISTS task_attempts_score_range;
ALTER TABLE public.task_attempts
  ADD CONSTRAINT task_attempts_score_range CHECK (score_pct BETWEEN 0 AND 100);

-- 3. Server-side submission function: validates input, derives passed + points
CREATE OR REPLACE FUNCTION public.submit_quiz_attempt(
  _topic_id text,
  _score_pct numeric
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  passed boolean;
  pts integer := 0;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF _topic_id IS NULL OR length(_topic_id) = 0 OR length(_topic_id) > 128 THEN
    RAISE EXCEPTION 'Invalid topic_id';
  END IF;
  IF _score_pct IS NULL OR _score_pct < 0 OR _score_pct > 100 THEN
    RAISE EXCEPTION 'Invalid score_pct';
  END IF;

  passed := _score_pct >= 70;

  INSERT INTO public.task_attempts (user_id, topic_id, score_pct, passed)
  VALUES (uid, _topic_id, _score_pct, passed);

  IF passed THEN
    pts := 10 + GREATEST(0, FLOOR((_score_pct - 70) / 5))::int;
    INSERT INTO public.user_points (user_id, points, source, meta)
    VALUES (uid, pts, 'quiz', jsonb_build_object('topic_id', _topic_id, 'score_pct', _score_pct));
  END IF;

  RETURN jsonb_build_object('passed', passed, 'points', pts);
END;
$$;

REVOKE ALL ON FUNCTION public.submit_quiz_attempt(text, numeric) FROM public;
GRANT EXECUTE ON FUNCTION public.submit_quiz_attempt(text, numeric) TO authenticated;

-- 4. Remove direct INSERT on user_points (only the SECURITY DEFINER function writes now)
DROP POLICY IF EXISTS points_insert_own ON public.user_points;
REVOKE EXECUTE ON FUNCTION public.submit_quiz_attempt(text, numeric) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.submit_quiz_attempt(text, numeric) TO authenticated;
-- 1. New schema for private internal logic
CREATE SCHEMA IF NOT EXISTS private;

-- 2. Quiz Questions table
CREATE TABLE IF NOT EXISTS public.quiz_questions (
  id TEXT PRIMARY KEY,
  topic_id TEXT NOT NULL,
  question TEXT NOT NULL,
  options TEXT[] NOT NULL,
  correct_index INTEGER NOT NULL,
  explanation TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on questions (readable by all)
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "questions_select_all" ON public.quiz_questions;
CREATE POLICY "questions_select_all" ON public.quiz_questions FOR SELECT USING (true);

-- 3. Update task_attempts to store answers
ALTER TABLE public.task_attempts ADD COLUMN IF NOT EXISTS answers JSONB;

-- 4. Secure Point Awarding Logic (Private Schema)
CREATE OR REPLACE FUNCTION private.process_quiz_submission()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  correct_count INTEGER := 0;
  total_count INTEGER;
  score_pct NUMERIC;
  passed BOOLEAN;
  pts INTEGER := 0;
  ans_record RECORD;
  q_correct_index INTEGER;
BEGIN
  -- We expect NEW.answers to be a JSONB array of { question_id: string, selected_index: number }
  -- Re-calculate score server-side
  
  -- Get total questions for this topic
  SELECT count(*) INTO total_count FROM public.quiz_questions WHERE topic_id = NEW.topic_id;
  
  IF total_count = 0 THEN
    -- Fallback for topics not yet in DB or legacy
    RETURN NEW;
  END IF;

  -- Calculate correct answers
  -- NEW.answers is expected to be like: [{"questionId": "q1", "selectedIndex": 0}, ...]
  FOR ans_record IN SELECT * FROM jsonb_to_recordset(NEW.answers) AS x(questionId text, selectedIndex int)
  LOOP
    SELECT correct_index INTO q_correct_index FROM public.quiz_questions WHERE id = ans_record.questionId;
    IF q_correct_index = ans_record.selectedIndex THEN
      correct_count := correct_count + 1;
    END IF;
  END LOOP;

  score_pct := (correct_count::numeric / total_count::numeric) * 100;
  passed := score_pct >= 70;

  -- Overwrite user-provided values to ensure integrity
  NEW.score_pct := score_pct;
  NEW.passed := passed;

  -- Award points if passed
  IF passed THEN
    pts := 10 + GREATEST(0, FLOOR((score_pct - 70) / 5))::int;
    INSERT INTO public.user_points (user_id, points, source, meta)
    VALUES (NEW.user_id, pts, 'quiz', jsonb_build_object('topic_id', NEW.topic_id, 'score_pct', score_pct));
    
    -- Mark daily task as completed if it was a retry for this topic
    UPDATE public.daily_tasks
    SET is_completed = true
    WHERE user_id = NEW.user_id 
      AND assigned_date = CURRENT_DATE 
      AND task_type = 'retry_quiz' 
      AND reference_id = NEW.topic_id;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger to process submission
DROP TRIGGER IF EXISTS on_quiz_submission ON public.task_attempts;
CREATE TRIGGER on_quiz_submission
  BEFORE INSERT ON public.task_attempts
  FOR EACH ROW
  EXECUTE FUNCTION private.process_quiz_submission();

-- 5. Lock user_points table
-- Ensure no one can insert points directly. Only our SECURITY DEFINER trigger can.
DROP POLICY IF EXISTS "points_insert_own" ON public.user_points;
ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;
-- No INSERT policy means only service_role and SECURITY DEFINER functions can insert.

-- 6. Move sensitive functions out of public schema
-- handle_new_user should not be directly executable by users.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE OR REPLACE FUNCTION private.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email,'@',1)));
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created 
  AFTER INSERT ON auth.users 
  FOR EACH ROW 
  EXECUTE FUNCTION private.handle_new_user();

-- Drop the old one from public schema
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 7. Secure the Quiz Submission RPC
CREATE OR REPLACE FUNCTION public.submit_quiz_attempt(
  _topic_id text,
  _answers jsonb
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER -- Use invoker's rights to ensure they can only insert their own records
SET search_path = public
AS $$
DECLARE
  new_attempt_id uuid;
  final_score numeric;
  is_passed boolean;
BEGIN
  -- This insert will trigger private.process_quiz_submission()
  INSERT INTO public.task_attempts (user_id, topic_id, answers, score_pct, passed)
  VALUES (auth.uid(), _topic_id, _answers, 0, false) -- Dummy score, trigger will overwrite
  RETURNING id, score_pct, passed INTO new_attempt_id, final_score, is_passed;

  RETURN jsonb_build_object(
    'id', new_attempt_id,
    'score_pct', final_score,
    'passed', is_passed
  );
END;
$$;

-- Ensure public cannot execute it directly without auth
REVOKE ALL ON FUNCTION public.submit_quiz_attempt(text, jsonb) FROM public;
GRANT EXECUTE ON FUNCTION public.submit_quiz_attempt(text, jsonb) TO authenticated;

-- 9. Daily Tasks and Personalization
CREATE TABLE IF NOT EXISTS public.daily_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_type TEXT NOT NULL, -- 'retry_quiz', 'study_topic', 'activity'
  reference_id TEXT,       -- topic_id or quiz_id
  description TEXT NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  assigned_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, assigned_date)
);

ALTER TABLE public.daily_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_select_own_tasks" ON public.daily_tasks FOR SELECT USING (auth.uid() = user_id);

-- Function to generate/get daily task
CREATE OR REPLACE FUNCTION public.get_or_create_daily_task()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  today date := CURRENT_DATE;
  existing_task record;
  failed_attempt record;
  new_task_desc text;
  new_task_type text;
  new_ref_id text;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  -- Check if task already exists for today
  SELECT * INTO existing_task FROM public.daily_tasks 
  WHERE user_id = uid AND assigned_date = today;

  IF existing_task.id IS NOT NULL THEN
    RETURN row_to_json(existing_task)::jsonb;
  END IF;

  -- Try to find a failed attempt first (prioritize the most recent failure)
  SELECT * INTO failed_attempt FROM public.task_attempts
  WHERE user_id = uid AND passed = false
  ORDER BY created_at DESC
  LIMIT 1;

  IF failed_attempt.id IS NOT NULL THEN
    new_task_type := 'retry_quiz';
    new_ref_id := failed_attempt.topic_id;
    new_task_desc := 'Master your previous challenge: Retry the ' || new_ref_id || ' quiz and aim for 70%+!';
  ELSE
    -- Default to a study task if no failures
    new_task_type := 'study_topic';
    new_ref_id := 'm1-1'; -- Default or random logic could go here
    new_task_desc := 'Start your day with something fresh: Explore ' || new_ref_id || ' now.';
  END IF;

  INSERT INTO public.daily_tasks (user_id, task_type, reference_id, description, assigned_date)
  VALUES (uid, new_task_type, new_ref_id, new_task_desc, today)
  RETURNING * INTO existing_task;

  RETURN row_to_json(existing_task)::jsonb;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_or_create_daily_task() TO authenticated;

-- Ensure a public 'users' table exists for easier access and metadata mapping
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on public.users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_read_own" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_update_own" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Update handle_new_user to sync auth.users metadata to public.users and public.profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Sync to public.profiles (legacy support)
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'display_name', split_part(NEW.email,'@',1))
  )
  ON CONFLICT (user_id) DO UPDATE SET
    display_name = COALESCE(EXCLUDED.display_name, public.profiles.display_name);

  -- Sync to public.users (new standard)
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.users.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.users.avatar_url),
    updated_at = now();

  RETURN NEW;
END; $$;

-- Ensure the trigger is active
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT OR UPDATE ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill existing users
INSERT INTO public.users (id, email, full_name, avatar_url)
SELECT 
  id, 
  email, 
  raw_user_meta_data->>'full_name',
  raw_user_meta_data->>'avatar_url'
FROM auth.users
ON CONFLICT (id) DO NOTHING;
-- Create app_config table
CREATE TABLE IF NOT EXISTS public.app_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    whatsapp_number TEXT,
    support_email TEXT,
    mobile_money_details TEXT,
    merchant_id TEXT,
    support_price TEXT,
    about_app TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access to app_config" ON public.app_config
    FOR SELECT USING (true);

-- Insert default config
INSERT INTO public.app_config (
    whatsapp_number,
    support_email,
    mobile_money_details,
    merchant_id,
    support_price,
    about_app
) VALUES (
    '+256768715065',
    'latifisabirye123@gmail.com',
    'Send 5,000 UGX to +256 768 715065 (MTN) - Latif Sabirye. After payment, send a screenshot to WhatsApp for instant activation.',
    '7064464',
    '5,000 UGX',
    'Cymatic Hub is an advanced educational platform tailored for Uganda''s New Lower Secondary Curriculum, providing students with interactive tools, high-quality notes, and AI-powered learning assistance.'
) ON CONFLICT DO NOTHING;
-- 1. Create helper function for streak calculation
CREATE OR REPLACE FUNCTION public.get_user_streak(uid uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  streak integer := 0;
  check_date date := CURRENT_DATE - 1;
BEGIN
  -- Simple streak count (days active in last 90 days)
  SELECT count(DISTINCT assigned_date)::integer INTO streak
  FROM public.daily_tasks
  WHERE user_id = uid 
    AND is_completed = true
    AND assigned_date >= CURRENT_DATE - 90;
  
  RETURN streak;
END;
$$;

-- 2. Update process_quiz_submission to include multiplier and task protection
CREATE OR REPLACE FUNCTION private.process_quiz_submission()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  correct_count INTEGER := 0;
  total_count INTEGER;
  score_pct NUMERIC;
  passed BOOLEAN;
  base_pts INTEGER := 0;
  final_pts INTEGER := 0;
  streak INTEGER := 0;
  multiplier NUMERIC := 1.0;
  task_record RECORD;
BEGIN
  -- Get total questions
  SELECT count(*) INTO total_count FROM public.quiz_questions WHERE topic_id = NEW.topic_id;
  IF total_count = 0 THEN RETURN NEW; END IF;

  -- Re-calculate score
  FOR ans_record IN SELECT * FROM jsonb_to_recordset(NEW.answers) AS x(questionId text, selectedIndex int)
  LOOP
    IF (SELECT correct_index FROM public.quiz_questions WHERE id = ans_record.questionId) = ans_record.selectedIndex THEN
      correct_count := correct_count + 1;
    END IF;
  END LOOP;

  score_pct := (correct_count::numeric / total_count::numeric) * 100;
  passed := score_pct >= 70;

  NEW.score_pct := score_pct;
  NEW.passed := passed;

  IF passed THEN
    base_pts := 10 + GREATEST(0, FLOOR((score_pct - 70) / 5))::int;
    
    -- Check for existing daily task for this topic
    SELECT * INTO task_record FROM public.daily_tasks
    WHERE user_id = NEW.user_id AND assigned_date = CURRENT_DATE AND reference_id = NEW.topic_id;

    -- Apply multiplier and task protection
    streak := public.get_user_streak(NEW.user_id);
    -- 90-day logic: multiplier up to 1.11x (11% bonus)
    multiplier := 1.0 + (LEAST(streak, 90) / 900.0);
    
    -- If it's a "retry_quiz" daily task, award full points. Otherwise, cap it.
    IF task_record.id IS NOT NULL AND task_record.task_type = 'retry_quiz' THEN
        final_pts := floor(base_pts * multiplier)::int;
        UPDATE public.daily_tasks SET is_completed = true WHERE id = task_record.id;
    ELSE
        -- Protect pool: Subsequent attempts on same day get 50%
        final_pts := floor((base_pts * multiplier) / 2)::int;
    END IF;

    INSERT INTO public.user_points (user_id, points, source, meta)
    VALUES (NEW.user_id, final_pts, 'quiz', jsonb_build_object('topic_id', NEW.topic_id, 'score_pct', score_pct, 'streak', streak));
  END IF;

  RETURN NEW;
END;
$$;
-- 1. Extend profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS school_name TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS current_mood TEXT;

-- 2. Daily Challenges table
CREATE TABLE IF NOT EXISTS public.daily_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_date DATE NOT NULL DEFAULT CURRENT_DATE,
  target_points INTEGER NOT NULL DEFAULT 100,
  earned_points INTEGER NOT NULL DEFAULT 0,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, assigned_date)
);

ALTER TABLE public.daily_challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_select_own_challenges" ON public.daily_challenges FOR SELECT USING (auth.uid() = user_id);

-- 3. Roles System
CREATE TYPE public.app_role AS ENUM ('admin', 'student', 'teacher');

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'student',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_read_all_roles" ON public.user_roles FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
);
CREATE POLICY "users_read_own_roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(uid uuid, requested_role public.app_role)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = uid AND role = requested_role
  );
END;
$$;

-- 4. Update News Policies for Admins
ALTER TABLE public.news_broadcasts ADD COLUMN IF NOT EXISTS is_curriculum_update BOOLEAN DEFAULT false;

DROP POLICY IF EXISTS "news_admin_insert" ON public.news_broadcasts;
CREATE POLICY "news_admin_insert" ON public.news_broadcasts 
FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "news_admin_update" ON public.news_broadcasts;
CREATE POLICY "news_admin_update" ON public.news_broadcasts 
FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- 5. Update handle_new_user to sync metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Sync to public.profiles
  INSERT INTO public.profiles (user_id, display_name, school_name, phone)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'display_name', split_part(NEW.email,'@',1)),
    NEW.raw_user_meta_data->>'school_name',
    NEW.raw_user_meta_data->>'phone_number'
  )
  ON CONFLICT (user_id) DO UPDATE SET
    display_name = COALESCE(EXCLUDED.display_name, public.profiles.display_name),
    school_name = COALESCE(EXCLUDED.school_name, public.profiles.school_name),
    phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
    updated_at = now();

  -- Sync to public.users
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.users.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.users.avatar_url),
    updated_at = now();

  -- Default role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'student')
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END; $$;
-- 1. Create referrals table
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_verified BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(referred_user_id)
);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "referrals_select_own" ON public.referrals FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_user_id);

-- 2. Add referral_code to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE DEFAULT substring(md5(random()::text) from 1 for 8);

-- 3. Function to record a new referral
CREATE OR REPLACE FUNCTION public.record_referral(referrer_code TEXT, new_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  referrer_uuid UUID;
BEGIN
  -- Get the referrer's user_id from their code
  SELECT user_id INTO referrer_uuid FROM public.profiles WHERE referral_code = referrer_code;
  
  IF referrer_uuid IS NOT NULL AND referrer_uuid != new_user_id THEN
    INSERT INTO public.referrals (referrer_id, referred_user_id)
    VALUES (referrer_uuid, new_user_id)
    ON CONFLICT (referred_user_id) DO NOTHING;
  END IF;
END;
$$;

-- =========================================================
-- PROFILES
-- =========================================================
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id uuid NOT NULL UNIQUE,
  display_name text,
  school_name text,
  is_verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by owner"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id AND auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, user_id, display_name, school_name)
  VALUES (
    NEW.id,
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'school_name'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================================
-- USER POINTS
-- =========================================================
CREATE TABLE public.user_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  points integer NOT NULL DEFAULT 0,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_points_user_created ON public.user_points(user_id, created_at DESC);

ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own points"
  ON public.user_points FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own points"
  ON public.user_points FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =========================================================
-- NEWS BROADCASTS
-- =========================================================
CREATE TABLE public.news_broadcasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text,
  is_active boolean NOT NULL DEFAULT true,
  is_ad boolean NOT NULL DEFAULT false,
  published_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_news_active_pub ON public.news_broadcasts(is_active, published_at DESC);

ALTER TABLE public.news_broadcasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active broadcasts are public"
  ON public.news_broadcasts FOR SELECT
  USING (is_active = true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.news_broadcasts;

-- =========================================================
-- APP CONFIG (single-row config)
-- =========================================================
CREATE TABLE public.app_config (
  id integer PRIMARY KEY DEFAULT 1,
  whatsapp_number text,
  support_email text,
  merchant_id text,
  support_price text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT app_config_singleton CHECK (id = 1)
);

INSERT INTO public.app_config (id) VALUES (1);

ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "App config is publicly readable"
  ON public.app_config FOR SELECT
  USING (true);

CREATE TRIGGER app_config_set_updated_at
  BEFORE UPDATE ON public.app_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- QUIZ ATTEMPTS + SUBMIT RPC
-- =========================================================
CREATE TABLE public.quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id text NOT NULL,
  answers jsonb NOT NULL DEFAULT '[]'::jsonb,
  score integer NOT NULL DEFAULT 0,
  total integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_quiz_attempts_user_topic ON public.quiz_attempts(user_id, topic_id, created_at DESC);

ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own attempts"
  ON public.quiz_attempts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own attempts"
  ON public.quiz_attempts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.submit_quiz_attempt(_topic_id text, _answers jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_total int;
  v_score int;
  v_points int;
  v_attempt_id uuid;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  v_total := COALESCE(jsonb_array_length(_answers), 0);
  -- count answers flagged as correct (objects with "correct": true) or boolean true entries
  SELECT COUNT(*) INTO v_score
  FROM jsonb_array_elements(_answers) elem
  WHERE (elem = 'true'::jsonb)
     OR (jsonb_typeof(elem) = 'object' AND COALESCE((elem->>'correct')::boolean, false) = true);

  INSERT INTO public.quiz_attempts (user_id, topic_id, answers, score, total)
  VALUES (v_user, _topic_id, _answers, v_score, v_total)
  RETURNING id INTO v_attempt_id;

  v_points := v_score * 5;
  IF v_points > 0 THEN
    INSERT INTO public.user_points (user_id, points, reason)
    VALUES (v_user, v_points, 'quiz:' || _topic_id);
  END IF;

  RETURN jsonb_build_object(
    'attempt_id', v_attempt_id,
    'score', v_score,
    'total', v_total,
    'points_awarded', v_points
  );
END;
$$;

REVOKE ALL ON FUNCTION public.submit_quiz_attempt(text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_quiz_attempt(text, jsonb) TO authenticated;

-- =========================================================
-- DAILY TASKS + get_or_create_daily_task RPC
-- =========================================================
CREATE TABLE public.daily_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_date date NOT NULL DEFAULT (now() AT TIME ZONE 'UTC')::date,
  task_type text NOT NULL,
  description text NOT NULL,
  is_completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, task_date)
);

ALTER TABLE public.daily_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own daily tasks"
  ON public.daily_tasks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own daily tasks"
  ON public.daily_tasks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.get_or_create_daily_task()
RETURNS public.daily_tasks
RETURNS NULL ON NULL INPUT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_today date := (now() AT TIME ZONE 'UTC')::date;
  v_row public.daily_tasks;
  v_options text[][] := ARRAY[
    ARRAY['read_notes',  'Read one lesson from your Physics notes today.'],
    ARRAY['retry_quiz',  'Retake a quiz and beat your previous score.'],
    ARRAY['read_notes',  'Spend 10 focused minutes reviewing a new topic.'],
    ARRAY['retry_quiz',  'Complete any quiz to earn 25+ points.']
  ];
  v_pick text[];
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_row
  FROM public.daily_tasks
  WHERE user_id = v_user AND task_date = v_today;

  IF FOUND THEN
    RETURN v_row;
  END IF;

  v_pick := v_options[1 + floor(random() * array_length(v_options, 1))::int];

  INSERT INTO public.daily_tasks (user_id, task_date, task_type, description)
  VALUES (v_user, v_today, v_pick[1], v_pick[2])
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.get_or_create_daily_task() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_or_create_daily_task() TO authenticated;
ALTER TABLE public.news_broadcasts
  ADD COLUMN media_url text,
  ADD COLUMN media_type text;-- 1. Lock down record_referral: derive user from auth.uid(), not client input.
DROP FUNCTION IF EXISTS public.record_referral(text, uuid);
DROP FUNCTION IF EXISTS public.record_referral(text);

CREATE OR REPLACE FUNCTION public.record_referral(referrer_code TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  referrer_uuid UUID;
  caller_uuid UUID := auth.uid();
BEGIN
  SELECT user_id INTO referrer_uuid
  FROM public.profiles
  WHERE referral_code = referrer_code;

  IF referrer_uuid IS NULL THEN
    RAISE EXCEPTION 'Invalid referral code';
  END IF;

  -- Allow pre-signup referral validation for anonymous users.
  IF caller_uuid IS NULL THEN
    RETURN;
  END IF;

  IF referrer_uuid <> caller_uuid THEN
    INSERT INTO public.referrals (referrer_id, referred_user_id)
    VALUES (referrer_uuid, caller_uuid)
    ON CONFLICT (referred_user_id) DO NOTHING;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.record_referral(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_referral(text) TO PUBLIC, authenticated;

-- 2. Server-side AI quota table for tutor-chat.
CREATE TABLE IF NOT EXISTS public.ai_usage_daily (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  usage_date DATE NOT NULL DEFAULT (now() AT TIME ZONE 'UTC')::date,
  request_count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, usage_date)
);

ALTER TABLE public.ai_usage_daily ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_usage_select_own" ON public.ai_usage_daily
  FOR SELECT USING (auth.uid() = user_id);

-- Service role bypasses RLS; no INSERT/UPDATE policy is exposed to clients on purpose.

CREATE OR REPLACE FUNCTION public.increment_ai_usage(p_user_id UUID, p_limit INTEGER)
RETURNS TABLE(allowed BOOLEAN, current_count INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  today DATE := (now() AT TIME ZONE 'UTC')::date;
  new_count INTEGER;
BEGIN
  INSERT INTO public.ai_usage_daily (user_id, usage_date, request_count)
  VALUES (p_user_id, today, 1)
  ON CONFLICT (user_id, usage_date)
    DO UPDATE SET request_count = public.ai_usage_daily.request_count + 1
  RETURNING request_count INTO new_count;

  RETURN QUERY SELECT (new_count <= p_limit), new_count;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_ai_usage(uuid, integer) FROM PUBLIC, anon, authenticated;
-- Only the edge function (service role) may call this.
-- Remove self-award points policy (points awarded only via SECURITY DEFINER RPCs)
DROP POLICY IF EXISTS "Users can insert own points" ON public.user_points;

-- Tighten SECURITY DEFINER function execution
REVOKE EXECUTE ON FUNCTION public.submit_quiz_attempt(text, jsonb) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.submit_quiz_attempt(text, jsonb) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_or_create_daily_task() FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.get_or_create_daily_task() TO authenticated;

-- Internal helpers should not be callable via PostgREST
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

-- Storage policies for 'cymatics' bucket
-- This bucket is intentionally allowed public read access for shared cymatics assets.
-- Authenticated users may still only insert/update/delete objects under their own folder.
DROP POLICY IF EXISTS "Cymatics public read" ON storage.objects;
CREATE POLICY "Cymatics public read"
ON storage.objects FOR SELECT
USING (bucket_id = 'cymatics');

DROP POLICY IF EXISTS "Authenticated users can upload to cymatics" ON storage.objects;
CREATE POLICY "Authenticated users can upload to cymatics"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'cymatics'
  AND auth.uid() IS NOT NULL
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users can update own cymatics files" ON storage.objects;
CREATE POLICY "Users can update own cymatics files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'cymatics'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users can delete own cymatics files" ON storage.objects;
CREATE POLICY "Users can delete own cymatics files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'cymatics'
  AND auth.uid()::text = (storage.foldername(name))[1]
);ALTER TABLE public.news_broadcasts
  ADD COLUMN IF NOT EXISTS expires_at timestamptz;

UPDATE public.news_broadcasts
SET expires_at = now() + interval '14 days'
WHERE media_url = 'https://cjoayorozpsrcupbekkj.supabase.co/storage/v1/object/public/cymatics/broadcasts/busowoko-expo-2026.jpeg';

DROP POLICY IF EXISTS "Public can view active broadcasts" ON public.news_broadcasts;
CREATE POLICY "Public can view active broadcasts"
ON public.news_broadcasts
FOR SELECT
USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));-- 1. app_config: only authenticated users may read (was public)
DROP POLICY IF EXISTS "App config is publicly readable" ON public.app_config;
CREATE POLICY "App config readable by authenticated users"
  ON public.app_config
  FOR SELECT
  TO authenticated
  USING (true);

-- 2. quiz_questions: restrict SELECT to authenticated users so correct_index
-- isn't anonymously scrapeable. Server-side scoring trigger uses SECURITY
-- DEFINER and is unaffected.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'quiz_questions'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "questions_select_all" ON public.quiz_questions';
    EXECUTE 'DROP POLICY IF EXISTS "Quiz questions readable by authenticated" ON public.quiz_questions';
    EXECUTE 'CREATE POLICY "Quiz questions readable by authenticated"
             ON public.quiz_questions FOR SELECT TO authenticated USING (true)';
  END IF;
END $$;

-- 3. has_role: revoke direct execution from clients. RLS policies invoking it
-- internally still work because they execute under the system context.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'has_role'
  ) THEN
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated';
  END IF;
END $$;

-- 4. get_user_streak: add caller check + revoke public execute
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'get_user_streak'
  ) THEN
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.get_user_streak(uuid) FROM PUBLIC, anon';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.get_user_streak(uuid) TO authenticated';
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.get_user_streak(uid uuid)
RETURNS integer
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_streak int := 0;
BEGIN
  IF auth.uid() IS NULL OR uid IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  SELECT COUNT(DISTINCT task_date)::int INTO v_streak
  FROM public.daily_tasks
  WHERE user_id = uid
    AND is_completed = true
    AND task_date >= (now() AT TIME ZONE 'UTC')::date - INTERVAL '90 days';

  RETURN COALESCE(v_streak, 0);
END;
$function$;-- Drop the overly broad duplicate policy; keep the one that honours expires_at
DROP POLICY IF EXISTS "Active broadcasts are public" ON public.news_broadcasts;

-- Enable RLS on realtime.messages and scope subscriptions
ALTER TABLE IF EXISTS realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can read news_broadcasts channel" ON realtime.messages;
CREATE POLICY "Authenticated can read news_broadcasts channel"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  (realtime.topic() = 'news_broadcasts')
  AND (extension = 'postgres_changes')
);
-- Migration for Project Submissions and Teacher Evaluations

CREATE TYPE public.submission_status AS ENUM ('draft', 'pending', 'verified');

CREATE TABLE IF NOT EXISTS public.project_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  status submission_status NOT NULL DEFAULT 'draft',
  
  -- Teacher Evaluation Data
  teacher_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  teacher_name TEXT,
  teacher_license TEXT,
  school_key TEXT,
  
  -- NCDC Competency Points (Total max 10%)
  phase1_score NUMERIC(3, 1) DEFAULT 0, -- max 2
  phase2_score NUMERIC(3, 1) DEFAULT 0, -- max 3
  phase3_score NUMERIC(3, 1) DEFAULT 0, -- max 3
  phase4_score NUMERIC(3, 1) DEFAULT 0, -- max 2
  total_competency_score NUMERIC(3, 1) GENERATED ALWAYS AS (phase1_score + phase2_score + phase3_score + phase4_score) STORED,
  
  teacher_comments TEXT,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.project_submissions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Students can view and edit their own drafts"
  ON public.project_submissions
  FOR ALL
  USING (auth.uid() = student_id AND status = 'draft');

CREATE POLICY "Students can view their verified submissions"
  ON public.project_submissions
  FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Teachers can view pending submissions"
  ON public.project_submissions
  FOR SELECT
  USING (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Teachers can verify submissions"
  ON public.project_submissions
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'admin'));

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_submissions;

-- Function to handle submission update
CREATE OR REPLACE FUNCTION public.handle_submission_verification()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'verified' AND OLD.status != 'verified' THEN
    NEW.verified_at = now();
    -- Award XP or points here if needed
  END IF;
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_submission_verify
  BEFORE UPDATE ON public.project_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_submission_verification();
-- Migration for Multi-Tenant Organization Support

-- 1. Create organizations table
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  school_key TEXT UNIQUE NOT NULL,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Add org_admin to app_role
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'org_admin';

-- 3. Extend profiles with org_id
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS level TEXT; -- S1, S2, etc.

-- 4. Extend project_submissions with org_id
ALTER TABLE public.project_submissions ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;

-- 5. RLS for organizations
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public select on organizations by school_key" 
  ON public.organizations FOR SELECT USING (true);

CREATE POLICY "Org admins can update their own org"
  ON public.organizations FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'org_admin' AND profiles.org_id = organizations.id)
  );

-- 6. Helper function to get user org_id
CREATE OR REPLACE FUNCTION public.get_user_org_id(uid uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (SELECT org_id FROM public.profiles WHERE user_id = uid);
END;
$$;

-- 7. Seed initial organizations
INSERT INTO public.organizations (name, slug, school_key)
VALUES 
  ('Kasenyi Secondary School', 'kasenyi-ss', 'kasenyi_ss'),
  ('Cymatic Secondary School', 'cymatic-ss', 'cymatic_ss')
ON CONFLICT (school_key) DO NOTHING;
-- Migration for Isolated Institutional Chatrooms

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  level TEXT NOT NULL CHECK (level IN ('S1', 'S2', 'S3', 'S4', 'S5', 'S6')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view messages in their own school and level"
  ON public.chat_messages
  FOR SELECT
  USING (
    org_id = public.get_user_org_id(auth.uid()) AND 
    level = (SELECT level FROM public.profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can send messages to their own school and level"
  ON public.chat_messages
  FOR INSERT
  WITH CHECK (
    org_id = public.get_user_org_id(auth.uid()) AND 
    level = (SELECT level FROM public.profiles WHERE user_id = auth.uid()) AND
    auth.uid() = user_id
  );

-- Enable Realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
-- Migration for Chat Media Attachments

-- 1. Update chat_messages table to support attachments
ALTER TABLE public.chat_messages 
ADD COLUMN IF NOT EXISTS file_url TEXT,
ADD COLUMN IF NOT EXISTS file_type TEXT, -- 'image', 'pdf', 'doc'
ADD COLUMN IF NOT EXISTS file_name TEXT;

-- 2. Storage Bucket for Chat Attachments
-- (Note: Bucket creation usually happens via Supabase UI or API, 
-- but we can define the policies here assuming the bucket 'chat_attachments' exists)

-- Policies for chat_attachments bucket (handled via storage schema)
-- We need to ensure users can only access files from their own school/level
-- This is often done by including org_id/level in the storage path.

-- Example path structure: {org_id}/{level}/{user_id}/{filename}

-- Helper for storage policies
CREATE OR REPLACE FUNCTION public.get_user_level(uid uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (SELECT level FROM public.profiles WHERE user_id = uid);
END;
$$;
CREATE TABLE IF NOT EXISTS public.project_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id text NOT NULL,
  teacher_token uuid NOT NULL DEFAULT gen_random_uuid(),
  student_user_id uuid,
  student_email text,
  project_payload jsonb NOT NULL,
  is_verified boolean NOT NULL DEFAULT false,
  awarded_score integer,
  awarded_grade text,
  remarks text,
  marked_by text,
  teacher_title text,
  teacher_license_id text,
  school_reference_key text,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT project_submissions_score_range CHECK (awarded_score IS NULL OR (awarded_score >= 0 AND awarded_score <= 100)),
  CONSTRAINT project_submissions_grade_valid CHECK (awarded_grade IS NULL OR awarded_grade IN ('A','B','C','D','E')),
  CONSTRAINT project_submissions_payload_object CHECK (jsonb_typeof(project_payload) = 'object')
);

CREATE UNIQUE INDEX IF NOT EXISTS project_submissions_teacher_token_idx
  ON public.project_submissions (teacher_token);

CREATE INDEX IF NOT EXISTS project_submissions_project_id_idx
  ON public.project_submissions (project_id);

CREATE INDEX IF NOT EXISTS project_submissions_student_user_id_idx
  ON public.project_submissions (student_user_id)
  WHERE student_user_id IS NOT NULL;

ALTER TABLE public.project_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "No direct project submission reads" ON public.project_submissions;
DROP POLICY IF EXISTS "No direct project submission writes" ON public.project_submissions;

CREATE POLICY "No direct project submission reads"
ON public.project_submissions
FOR SELECT
TO public
USING (false);

CREATE POLICY "No direct project submission writes"
ON public.project_submissions
FOR ALL
TO public
USING (false)
WITH CHECK (false);

DROP TRIGGER IF EXISTS update_project_submissions_updated_at ON public.project_submissions;
CREATE TRIGGER update_project_submissions_updated_at
BEFORE UPDATE ON public.project_submissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.project_submissions;DROP POLICY IF EXISTS "Students can view own project submissions" ON public.project_submissions;

CREATE POLICY "Students can view own project submissions"
ON public.project_submissions
FOR SELECT
TO authenticated
USING (student_user_id = auth.uid());
-- 1. Extend profiles with org membership, level, identifier columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS org_id uuid,
  ADD COLUMN IF NOT EXISTS level text,
  ADD COLUMN IF NOT EXISTS role text,
  ADD COLUMN IF NOT EXISTS username text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS teacher_license_id text;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_unique ON public.profiles (lower(username)) WHERE username IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS profiles_phone_unique ON public.profiles (phone) WHERE phone IS NOT NULL;

-- 2. Organizations table (institutional schools)
CREATE TABLE IF NOT EXISTS public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  school_key text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.organizations TO anon, authenticated;
GRANT ALL ON public.organizations TO service_role;

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Organizations are publicly readable" ON public.organizations;
CREATE POLICY "Organizations are publicly readable"
  ON public.organizations FOR SELECT
  USING (true);

-- 3. Chat messages table (subject/level scoped study chat)
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  org_id text,
  level text,
  content text,
  file_url text,
  file_type text,
  file_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS chat_messages_org_level_idx ON public.chat_messages (org_id, level, created_at);
CREATE INDEX IF NOT EXISTS chat_messages_user_idx ON public.chat_messages (user_id);

GRANT SELECT, INSERT ON public.chat_messages TO authenticated;
GRANT ALL ON public.chat_messages TO service_role;

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read chat messages" ON public.chat_messages;
CREATE POLICY "Authenticated users can read chat messages"
  ON public.chat_messages FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can post their own messages" ON public.chat_messages;
CREATE POLICY "Authenticated users can post their own messages"
  ON public.chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Add chat_messages to realtime publication if not already
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'chat_messages'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages';
  END IF;
END $$;

-- 4. Extend project_submissions with phase scores + institutional fields
ALTER TABLE public.project_submissions
  ADD COLUMN IF NOT EXISTS student_id uuid,
  ADD COLUMN IF NOT EXISTS org_id uuid,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS teacher_id uuid,
  ADD COLUMN IF NOT EXISTS teacher_name text,
  ADD COLUMN IF NOT EXISTS teacher_license text,
  ADD COLUMN IF NOT EXISTS school_key text,
  ADD COLUMN IF NOT EXISTS teacher_comments text,
  ADD COLUMN IF NOT EXISTS phase1_score numeric,
  ADD COLUMN IF NOT EXISTS phase2_score numeric,
  ADD COLUMN IF NOT EXISTS phase3_score numeric,
  ADD COLUMN IF NOT EXISTS phase4_score numeric,
  ADD COLUMN IF NOT EXISTS total_competency_score numeric,
  ADD COLUMN IF NOT EXISTS project_data jsonb;

-- Mirror student_user_id into student_id for legacy code paths
UPDATE public.project_submissions
SET student_id = student_user_id
WHERE student_id IS NULL AND student_user_id IS NOT NULL;

-- Mirror status from is_verified for legacy code paths
UPDATE public.project_submissions
SET status = CASE WHEN is_verified THEN 'verified' ELSE 'draft' END
WHERE status IS NULL OR status = 'draft';

-- Allow student to read their submissions via either column
DROP POLICY IF EXISTS "Students can view own project submissions" ON public.project_submissions;
CREATE POLICY "Students can view own project submissions"
  ON public.project_submissions FOR SELECT
  TO authenticated
  USING (student_user_id = auth.uid() OR student_id = auth.uid());

-- 5. has_role RPC (text-based; flexible for 'teacher', 'org_admin', etc.)
CREATE OR REPLACE FUNCTION public.has_role(uid uuid, requested_role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = uid AND p.role = requested_role
  );
$$;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, text) TO authenticated, anon;

-- 6. Trigger to keep student_id <-> student_user_id in sync
CREATE OR REPLACE FUNCTION public.sync_project_submission_student_ids()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.student_id IS NULL AND NEW.student_user_id IS NOT NULL THEN
    NEW.student_id := NEW.student_user_id;
  ELSIF NEW.student_user_id IS NULL AND NEW.student_id IS NOT NULL THEN
    NEW.student_user_id := NEW.student_id;
  END IF;

  -- mirror status <-> is_verified
  IF NEW.status = 'verified' AND NEW.is_verified IS DISTINCT FROM true THEN
    NEW.is_verified := true;
  ELSIF NEW.is_verified = true AND NEW.status IS DISTINCT FROM 'verified' THEN
    NEW.status := 'verified';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_project_submission_ids ON public.project_submissions;
CREATE TRIGGER sync_project_submission_ids
  BEFORE INSERT OR UPDATE ON public.project_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_project_submission_student_ids();

-- 7. app_config: nothing to change here (admin.login uses organizations.name, not app_config.name)

-- FK profiles.org_id -> organizations.id (allows PostgREST embedding)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'profiles_org_id_fkey' AND table_name = 'profiles'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_org_id_fkey
      FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Loosen NOT NULL on project_submissions columns that legacy & new code paths share
ALTER TABLE public.project_submissions
  ALTER COLUMN project_id DROP NOT NULL,
  ALTER COLUMN project_payload DROP NOT NULL;

ALTER TABLE public.project_submissions
  ALTER COLUMN project_payload SET DEFAULT '{}'::jsonb;

-- Add missing tracking columns referenced by SubmissionModal
ALTER TABLE public.project_submissions
  ADD COLUMN IF NOT EXISTS marking_token uuid,
  ADD COLUMN IF NOT EXISTS submitted_at timestamptz;

CREATE INDEX IF NOT EXISTS project_submissions_marking_token_idx
  ON public.project_submissions (marking_token);

-- RPC to resolve username / phone / school key to a normalized lookup object
CREATE OR REPLACE FUNCTION public.resolve_identifier(identifier text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  resolved_email text;
  clean_id text := trim(identifier);
  org_row record;
BEGIN
  IF clean_id IS NULL OR clean_id = '' THEN
    RETURN NULL;
  END IF;

  -- Try to find by username or phone
  SELECT u.email INTO resolved_email
  FROM public.profiles p
  JOIN auth.users u ON p.user_id = u.id
  WHERE lower(trim(p.username)) = lower(clean_id)
     OR trim(p.phone) = clean_id
  LIMIT 1;

  IF resolved_email IS NOT NULL THEN
    RETURN jsonb_build_object('type', 'email', 'email', resolved_email);
  END IF;

  -- Try to find by school key
  SELECT o.id, o.name, o.school_key INTO org_row
  FROM public.organizations o
  WHERE o.school_key IS NOT NULL
    AND lower(trim(o.school_key)) = lower(clean_id)
  LIMIT 1;

  IF org_row.id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'type', 'organization',
      'data', jsonb_build_object(
        'id', org_row.id,
        'name', org_row.name,
        'school_key', org_row.school_key
      )
    );
  END IF;

  -- If it looks like an email already, just return it.
  IF clean_id LIKE '%@%' THEN
    RETURN jsonb_build_object('type', 'email', 'email', clean_id);
  END IF;

  RETURN NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION public.resolve_identifier(text) TO anon, authenticated;

-- Revoke anon access to has_role RPC for security
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, text) TO authenticated;

-- RPC to resolve username / phone / school key to a normalized lookup object
CREATE OR REPLACE FUNCTION public.resolve_identifier(identifier text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  resolved_email text;
  clean_id text;
  org_row record;
BEGIN
  clean_id := trim(identifier);

  IF clean_id IS NULL OR clean_id = '' THEN
    RETURN NULL;
  END IF;

  -- Try to find by username
  SELECT u.email INTO resolved_email
  FROM public.profiles p
  JOIN auth.users u ON p.user_id = u.id
  WHERE lower(trim(p.username)) = lower(clean_id)
     OR trim(p.phone) = clean_id
  LIMIT 1;

  IF resolved_email IS NOT NULL THEN
    RETURN jsonb_build_object('type', 'email', 'email', resolved_email);
  END IF;

  -- Try to find by school key
  SELECT o.id, o.name, o.school_key INTO org_row
  FROM public.organizations o
  WHERE o.school_key IS NOT NULL
    AND lower(trim(o.school_key)) = lower(clean_id)
  LIMIT 1;

  IF org_row.id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'type', 'organization',
      'data', jsonb_build_object(
        'id', org_row.id,
        'name', org_row.name,
        'school_key', org_row.school_key
      )
    );
  END IF;

  -- If it looks like an email already, just return it.
  IF clean_id LIKE '%@%' THEN
    RETURN jsonb_build_object('type', 'email', 'email', clean_id);
  END IF;

  RETURN NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION public.resolve_identifier(text) TO anon, authenticated;

-- 1. Redefine handle_new_user to be atomic and capture all metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    user_id, 
    display_name, 
    school_name, 
    username, 
    phone, 
    org_id, 
    level, 
    role
  )
  VALUES (
    NEW.id,
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'school_name',
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'phone_number',
    CASE 
      WHEN (NEW.raw_user_meta_data->>'school_id') IS NOT NULL AND (NEW.raw_user_meta_data->>'school_id') ~ '^[0-9a-fA-F-]{36}$' 
      THEN (NEW.raw_user_meta_data->>'school_id')::uuid 
      ELSE NULL 
    END,
    NEW.raw_user_meta_data->>'level',
    COALESCE(NEW.raw_user_meta_data->>'onboarding_path', NEW.raw_user_meta_data->>'role')
  )
  ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    phone = EXCLUDED.phone,
    display_name = EXCLUDED.display_name,
    school_name = EXCLUDED.school_name,
    org_id = EXCLUDED.org_id,
    level = EXCLUDED.level,
    role = EXCLUDED.role,
    updated_at = now();
  RETURN NEW;
END;
$$;

-- 2. Ensure trigger is active
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Backfill existing profiles with metadata if missing (best effort)
UPDATE public.profiles p
SET 
  username = u.raw_user_meta_data->>'username',
  phone = u.raw_user_meta_data->>'phone_number'
FROM auth.users u
WHERE p.id = u.id 
  AND (p.username IS NULL OR p.phone IS NULL)
  AND (u.raw_user_meta_data->>'username' IS NOT NULL OR u.raw_user_meta_data->>'phone_number' IS NOT NULL);
ALTER TABLE public.news_broadcasts
  ADD COLUMN IF NOT EXISTS category text DEFAULT 'General',
  ADD COLUMN IF NOT EXISTS priority text DEFAULT 'normal';

-- Update existing rows if necessary
UPDATE public.news_broadcasts SET category = 'General', priority = 'normal' WHERE category IS NULL;
-- Allow institution admins to register a new organization at signup
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS creator_user_id uuid,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS phone text;

CREATE UNIQUE INDEX IF NOT EXISTS organizations_school_key_unique
  ON public.organizations (school_key)
  WHERE school_key IS NOT NULL;

GRANT INSERT, UPDATE ON public.organizations TO authenticated;

DROP POLICY IF EXISTS "Authenticated users can create their organization" ON public.organizations;
CREATE POLICY "Authenticated users can create their organization"
  ON public.organizations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = creator_user_id);

DROP POLICY IF EXISTS "Creators can update their organization" ON public.organizations;
CREATE POLICY "Creators can update their organization"
  ON public.organizations
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = creator_user_id);

-- 1) Remove sensitive tables from realtime publication
ALTER PUBLICATION supabase_realtime DROP TABLE public.project_submissions;
ALTER PUBLICATION supabase_realtime DROP TABLE public.chat_messages;

-- 2) Block updates to sensitive profile columns via trigger
CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_verified IS DISTINCT FROM OLD.is_verified
     OR NEW.role IS DISTINCT FROM OLD.role
     OR NEW.org_id IS DISTINCT FROM OLD.org_id
     OR NEW.level IS DISTINCT FROM OLD.level
     OR NEW.teacher_license_id IS DISTINCT FROM OLD.teacher_license_id THEN
    RAISE EXCEPTION 'Cannot modify privileged profile columns from client';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_prevent_privilege_escalation ON public.profiles;
CREATE TRIGGER profiles_prevent_privilege_escalation
BEFORE UPDATE ON public.profiles
FOR EACH ROW
WHEN (current_setting('role', true) <> 'service_role')
EXECUTE FUNCTION public.prevent_profile_privilege_escalation();

-- 3) Restrict organizations SELECT to authenticated users only
DROP POLICY IF EXISTS "Organizations are publicly readable" ON public.organizations;
CREATE POLICY "Organizations readable by authenticated"
ON public.organizations FOR SELECT
TO authenticated
USING (true);

-- 4) Scope chat_messages SELECT by org_id + level matching caller's profile
DROP POLICY IF EXISTS "Authenticated users can read chat messages" ON public.chat_messages;
CREATE POLICY "Users read chat in their org and level"
ON public.chat_messages FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND (
        (chat_messages.org_id IS NULL AND p.org_id IS NULL)
        OR chat_messages.org_id::text = p.org_id::text
      )
      AND (
        (chat_messages.level IS NULL AND p.level IS NULL)
        OR chat_messages.level = p.level
      )
  )
);

-- 1) Chat INSERT must match sender's org_id + level
DROP POLICY IF EXISTS "Authenticated users can post their own messages" ON public.chat_messages;
CREATE POLICY "chat_insert_own_org_level"
  ON public.chat_messages FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.org_id IS NOT NULL
        AND chat_messages.org_id = (p.org_id)::text
        AND p.level IS NOT NULL
        AND chat_messages.level = p.level
    )
  );

-- 2) Chat SELECT: require non-null org & level (closes null-org bypass)
DROP POLICY IF EXISTS "Users read chat in their org and level" ON public.chat_messages;
CREATE POLICY "chat_select_own_org_level"
  ON public.chat_messages FOR SELECT TO authenticated
  USING (
    chat_messages.org_id IS NOT NULL
    AND chat_messages.level IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.org_id IS NOT NULL
        AND chat_messages.org_id = (p.org_id)::text
        AND p.level IS NOT NULL
        AND chat_messages.level = p.level
    )
  );

-- 3) Hide sensitive token columns from students; only service_role may read them
REVOKE SELECT (teacher_token, marking_token) ON public.project_submissions FROM authenticated;

-- 1. Restrict organizations SELECT to own org + signup lookup via helper
DROP POLICY IF EXISTS "Organizations readable by authenticated" ON public.organizations;
CREATE POLICY "Users can read own organization"
ON public.organizations FOR SELECT TO authenticated
USING (
  id IN (SELECT p.org_id FROM public.profiles p WHERE p.user_id = auth.uid() AND p.org_id IS NOT NULL)
);

-- 2. Safe lookup of an organization by school_key (used during onboarding/signup)
CREATE OR REPLACE FUNCTION public.lookup_organization_by_key(_school_key text)
RETURNS TABLE(id uuid, name text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT o.id, o.name
  FROM public.organizations o
  WHERE o.school_key IS NOT NULL
    AND lower(trim(o.school_key)) = lower(trim(_school_key))
  LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.lookup_organization_by_key(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lookup_organization_by_key(text) TO authenticated, anon;

-- 3. Defense-in-depth: revoke column UPDATE on privileged profile columns from clients
REVOKE UPDATE (is_verified, role, org_id, level, teacher_license_id) ON public.profiles FROM authenticated;
REVOKE UPDATE (is_verified, role, org_id, level, teacher_license_id) ON public.profiles FROM anon;
-- Re-grant UPDATE on remaining editable columns explicitly
GRANT UPDATE (display_name, school_name, avatar_url, phone, username, updated_at) ON public.profiles TO authenticated;

-- 4. Allow SECURITY DEFINER enrollment to bypass the privilege-escalation trigger via session flag
CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF current_setting('app.allow_profile_privileged_update', true) = 'on' THEN
    RETURN NEW;
  END IF;
  IF NEW.is_verified IS DISTINCT FROM OLD.is_verified
     OR NEW.role IS DISTINCT FROM OLD.role
     OR NEW.org_id IS DISTINCT FROM OLD.org_id
     OR NEW.level IS DISTINCT FROM OLD.level
     OR NEW.teacher_license_id IS DISTINCT FROM OLD.teacher_license_id THEN
    RAISE EXCEPTION 'Cannot modify privileged profile columns from client';
  END IF;
  RETURN NEW;
END;
$$;

-- 5. Server-side enrollment: validates school_key, sets org_id + level on caller's profile
CREATE OR REPLACE FUNCTION public.enroll_self_in_school(_school_key text, _level text, _phone text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user uuid := auth.uid();
  v_org_id uuid;
  v_org_name text;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _level IS NULL OR _level !~ '^S[1-6]$' THEN RAISE EXCEPTION 'Invalid level'; END IF;

  IF _school_key IS NOT NULL AND length(trim(_school_key)) > 0 THEN
    SELECT o.id, o.name INTO v_org_id, v_org_name
    FROM public.organizations o
    WHERE lower(trim(o.school_key)) = lower(trim(_school_key))
    LIMIT 1;
    IF v_org_id IS NULL THEN RAISE EXCEPTION 'Invalid School ID'; END IF;
  END IF;

  PERFORM set_config('app.allow_profile_privileged_update', 'on', true);
  UPDATE public.profiles
  SET org_id = COALESCE(v_org_id, org_id),
      level = _level,
      phone = COALESCE(_phone, phone),
      school_name = COALESCE(v_org_name, school_name),
      updated_at = now()
  WHERE user_id = v_user;

  RETURN jsonb_build_object('org_id', v_org_id, 'org_name', v_org_name, 'level', _level);
END;
$$;
REVOKE ALL ON FUNCTION public.enroll_self_in_school(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.enroll_self_in_school(text, text, text) TO authenticated;

-- 6. Hide marking/teacher tokens and license id from authenticated readers (server fns use service role)
REVOKE SELECT (teacher_token, marking_token, teacher_license_id, school_key, teacher_license) ON public.project_submissions FROM authenticated;
REVOKE SELECT (teacher_token, marking_token, teacher_license_id, school_key, teacher_license) ON public.project_submissions FROM anon;

-- 7. Revoke EXECUTE on internal trigger functions from public clients
REVOKE EXECUTE ON FUNCTION public.prevent_profile_privilege_escalation() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_project_submission_student_ids() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

-- 1. Auto-generate unique school_key on organization insert
CREATE OR REPLACE FUNCTION public.generate_school_key(_name text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prefix text;
  v_candidate text;
  v_exists boolean;
  v_attempts int := 0;
BEGIN
  v_prefix := upper(regexp_replace(coalesce(_name, 'SCH'), '[^a-zA-Z0-9]', '', 'g'));
  v_prefix := left(v_prefix, 4);
  IF length(v_prefix) < 3 THEN v_prefix := rpad(v_prefix, 3, 'X'); END IF;

  LOOP
    v_candidate := v_prefix || '-' || lpad(floor(random() * 10000)::text, 4, '0') || '-' || lpad(floor(random() * 10000)::text, 4, '0');
    SELECT EXISTS(SELECT 1 FROM public.organizations WHERE school_key = v_candidate) INTO v_exists;
    EXIT WHEN NOT v_exists;
    v_attempts := v_attempts + 1;
    IF v_attempts > 10 THEN RAISE EXCEPTION 'Could not allocate school_key'; END IF;
  END LOOP;
  RETURN v_candidate;
END;
$$;

CREATE OR REPLACE FUNCTION public.organizations_set_school_key()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.school_key IS NULL OR length(trim(NEW.school_key)) = 0 THEN
    NEW.school_key := public.generate_school_key(NEW.name);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_organizations_set_school_key ON public.organizations;
CREATE TRIGGER trg_organizations_set_school_key
BEFORE INSERT ON public.organizations
FOR EACH ROW EXECUTE FUNCTION public.organizations_set_school_key();

CREATE UNIQUE INDEX IF NOT EXISTS organizations_school_key_unique ON public.organizations (school_key) WHERE school_key IS NOT NULL;

-- 2. SECURITY DEFINER RPC for institution registration (replaces insecure client insert)
CREATE OR REPLACE FUNCTION public.register_institution(_name text, _email text, _phone text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_org_id uuid;
  v_school_key text;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _name IS NULL OR length(trim(_name)) < 2 THEN RAISE EXCEPTION 'Invalid school name'; END IF;
  IF _email IS NULL OR _email !~ '^[^@]+@[^@]+\.[^@]+$' THEN RAISE EXCEPTION 'Invalid email'; END IF;

  INSERT INTO public.organizations (name, email, phone, creator_user_id)
  VALUES (trim(_name), trim(_email), nullif(trim(coalesce(_phone, '')), ''), v_user)
  RETURNING id, school_key INTO v_org_id, v_school_key;

  PERFORM set_config('app.allow_profile_privileged_update', 'on', true);
  UPDATE public.profiles
  SET org_id = v_org_id,
      role = 'institution_admin',
      school_name = trim(_name),
      phone = COALESCE(nullif(trim(coalesce(_phone, '')), ''), phone),
      updated_at = now()
  WHERE user_id = v_user;

  RETURN jsonb_build_object('org_id', v_org_id, 'school_key', v_school_key, 'name', trim(_name));
END;
$$;

GRANT EXECUTE ON FUNCTION public.register_institution(text, text, text) TO authenticated;

-- 3. resolve_identifier RPC (login expects it; resolves username/phone -> email,
--    and also resolves school_key to organization details for unified lookup.)
CREATE OR REPLACE FUNCTION public.resolve_identifier(identifier text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  clean_id text := trim(identifier);
  resolved_email text;
  org_row record;
BEGIN
  IF clean_id IS NULL OR clean_id = '' THEN
    RETURN NULL;
  END IF;

  -- Try a profile identifier first
  SELECT u.email INTO resolved_email
  FROM public.profiles p
  JOIN auth.users u ON p.user_id = u.id
  WHERE lower(trim(p.username)) = lower(clean_id)
     OR trim(p.phone) = clean_id
  LIMIT 1;

  IF resolved_email IS NOT NULL THEN
    RETURN jsonb_build_object('type', 'email', 'email', resolved_email);
  END IF;

  -- Then try a school key lookup
  SELECT o.id, o.name, o.school_key INTO org_row
  FROM public.organizations o
  WHERE o.school_key IS NOT NULL
    AND lower(trim(o.school_key)) = lower(clean_id)
  LIMIT 1;

  IF org_row.id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'type', 'organization',
      'data', jsonb_build_object(
        'id', org_row.id,
        'name', org_row.name,
        'school_key', org_row.school_key
      )
    );
  END IF;

  -- If it looks like an email already, return it directly
  IF clean_id LIKE '%@%' THEN
    RETURN jsonb_build_object('type', 'email', 'email', clean_id);
  END IF;

  RETURN NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION public.resolve_identifier(text) TO anon, authenticated;

-- 4. Token-based marking RPC for public marking station
CREATE OR REPLACE FUNCTION public.get_submission_by_token(_token uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.project_submissions;
BEGIN
  IF _token IS NULL THEN RAISE EXCEPTION 'Invalid token'; END IF;
  SELECT * INTO v_row FROM public.project_submissions
  WHERE teacher_token = _token OR marking_token = _token
  LIMIT 1;
  IF v_row.id IS NULL THEN RAISE EXCEPTION 'Submission not found'; END IF;

  RETURN jsonb_build_object(
    'id', v_row.id,
    'project_id', v_row.project_id,
    'student_user_id', v_row.student_user_id,
    'project_data', v_row.project_data,
    'project_payload', v_row.project_payload,
    'status', v_row.status,
    'is_verified', v_row.is_verified,
    'phase1_score', v_row.phase1_score,
    'phase2_score', v_row.phase2_score,
    'phase3_score', v_row.phase3_score,
    'phase4_score', v_row.phase4_score,
    'awarded_score', v_row.awarded_score,
    'awarded_grade', v_row.awarded_grade,
    'remarks', v_row.remarks,
    'teacher_name', v_row.teacher_name,
    'teacher_title', v_row.teacher_title,
    'teacher_license', v_row.teacher_license,
    'submitted_at', v_row.submitted_at
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_submission_by_token(uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.submit_evaluation_by_token(
  _token uuid,
  _phase1 numeric,
  _phase2 numeric,
  _phase3 numeric,
  _phase4 numeric,
  _remarks text,
  _teacher_name text,
  _teacher_title text DEFAULT NULL,
  _teacher_license text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.project_submissions;
  v_total numeric;
  v_caller uuid := auth.uid();
BEGIN
  IF _token IS NULL THEN RAISE EXCEPTION 'Invalid token'; END IF;
  IF _teacher_name IS NULL OR length(trim(_teacher_name)) < 2 THEN RAISE EXCEPTION 'Teacher name required'; END IF;

  SELECT * INTO v_row FROM public.project_submissions
  WHERE teacher_token = _token OR marking_token = _token
  LIMIT 1;
  IF v_row.id IS NULL THEN RAISE EXCEPTION 'Submission not found'; END IF;

  -- Reject self-grading
  IF v_caller IS NOT NULL AND v_caller = v_row.student_user_id THEN
    RAISE EXCEPTION 'Students cannot grade their own submissions';
  END IF;

  -- Validate scores
  IF _phase1 < 0 OR _phase1 > 10 OR _phase2 < 0 OR _phase2 > 10
     OR _phase3 < 0 OR _phase3 > 10 OR _phase4 < 0 OR _phase4 > 10 THEN
    RAISE EXCEPTION 'Phase scores must be between 0 and 10';
  END IF;

  v_total := round(((_phase1 + _phase2 + _phase3 + _phase4) / 4.0)::numeric, 2);

  UPDATE public.project_submissions
  SET phase1_score = _phase1,
      phase2_score = _phase2,
      phase3_score = _phase3,
      phase4_score = _phase4,
      total_competency_score = v_total,
      awarded_score = round(v_total * 10)::int,
      remarks = nullif(trim(coalesce(_remarks, '')), ''),
      teacher_name = trim(_teacher_name),
      teacher_title = nullif(trim(coalesce(_teacher_title, '')), ''),
      teacher_license = nullif(trim(coalesce(_teacher_license, '')), ''),
      marked_by = trim(_teacher_name),
      is_verified = true,
      status = 'verified',
      verified_at = now(),
      updated_at = now()
  WHERE id = v_row.id;

  RETURN jsonb_build_object('id', v_row.id, 'total_competency_score', v_total, 'verified', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_evaluation_by_token(uuid, numeric, numeric, numeric, numeric, text, text, text, text) TO anon, authenticated;
-- Migration: Restrict token-based marking RPCs to authenticated users only
-- This revokes anonymous/public execute on the token RPCs and grants execute to `authenticated` role.

REVOKE EXECUTE ON FUNCTION public.get_submission_by_token(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.submit_evaluation_by_token(uuid, numeric, numeric, numeric, numeric, text, text, text, text) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.get_submission_by_token(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_evaluation_by_token(uuid, numeric, numeric, numeric, numeric, text, text, text, text) TO authenticated;

-- Service role retains execute by default; explicit grant is optional in some setups.
-- Migration: Revoke client UPDATE privileges on sensitive project_submissions columns
-- Ensures only server-side SECURITY DEFINER functions (like submit_evaluation_by_token)
-- can change verification/awarding fields.

-- Revoke UPDATE on privileged columns from client roles
REVOKE UPDATE (is_verified, status, teacher_name, teacher_title, teacher_license, marked_by, verified_at, awarded_score, awarded_grade, total_competency_score, phase1_score, phase2_score, phase3_score, phase4_score)
  ON public.project_submissions FROM authenticated;
REVOKE UPDATE (is_verified, status, teacher_name, teacher_title, teacher_license, marked_by, verified_at, awarded_score, awarded_grade, total_competency_score, phase1_score, phase2_score, phase3_score, phase4_score)
  ON public.project_submissions FROM anon;

-- Allow clients to update safe, non-privileged columns (e.g., draft content)
GRANT UPDATE (project_payload, project_data, remarks) ON public.project_submissions TO authenticated;

-- Note: SECURITY DEFINER functions continue to be able to update all columns.
-- Migration: Narrow teacher UPDATE policy on project_submissions
-- Allow only users with a teacher/org_admin role in the same org to update submissions.

DROP POLICY IF EXISTS "Teachers can verify submissions" ON public.project_submissions;

CREATE POLICY "Teachers can update submissions in their org"
  ON public.project_submissions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role IN ('teacher', 'org_admin')
    )
    AND org_id IS NOT NULL
    AND org_id IN (
      SELECT p.org_id FROM public.profiles p WHERE p.user_id = auth.uid()
    )
  );

-- Note: Column-level UPDATE restrictions are enforced separately via REVOKE statements.
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
-- Create reactions table
CREATE TABLE IF NOT EXISTS public.reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_id UUID NOT NULL REFERENCES public.news_broadcasts(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('like', 'dislike')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, content_id)
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, category_id)
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Simple Policies
CREATE POLICY "Public read reactions" ON public.reactions FOR SELECT USING (true);
CREATE POLICY "Users can manage own reactions" ON public.reactions USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own reactions" ON public.reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own reactions" ON public.reactions FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can read own subscriptions" ON public.user_subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own subscriptions" ON public.user_subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own subscriptions" ON public.user_subscriptions FOR DELETE USING (auth.uid() = user_id);
-- Create tutor_sessions table
CREATE TABLE IF NOT EXISTS tutor_sessions (
  session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  current_state JSONB DEFAULT '{}'::jsonb,
  history JSONB DEFAULT '[]'::jsonb,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create tutor_content table
CREATE TABLE IF NOT EXISTS tutor_content (
  content_key TEXT PRIMARY KEY,
  content_value TEXT NOT NULL,
  language TEXT DEFAULT 'en'
);

-- Enable RLS
ALTER TABLE tutor_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutor_content ENABLE ROW LEVEL SECURITY;

-- Policies for tutor_sessions
CREATE POLICY "Users can view their own sessions" ON tutor_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions" ON tutor_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions" ON tutor_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy for tutor_content
CREATE POLICY "Anyone can read tutor content" ON tutor_content
  FOR SELECT USING (true);
-- Create content_comments table
CREATE TABLE IF NOT EXISTS public.content_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_id UUID NOT NULL REFERENCES public.news_broadcasts(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create engagement_logs table
CREATE TABLE IF NOT EXISTS public.engagement_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  content_id UUID REFERENCES public.news_broadcasts(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create user_bookmarks table
CREATE TABLE IF NOT EXISTS public.user_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_id UUID NOT NULL REFERENCES public.news_broadcasts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, content_id)
);

-- Enable RLS
ALTER TABLE public.content_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.engagement_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_bookmarks ENABLE ROW LEVEL SECURITY;

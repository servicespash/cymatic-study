
-- =========================================================
-- PROFILES
-- =========================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id uuid NOT NULL UNIQUE,
  display_name text,
  school_name text,
  is_verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles are viewable by owner" ON public.profiles;
CREATE POLICY "Profiles are viewable by owner"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id AND auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
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

DROP TRIGGER IF EXISTS profiles_set_updated_at ON public.profiles;
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
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

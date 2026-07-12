
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

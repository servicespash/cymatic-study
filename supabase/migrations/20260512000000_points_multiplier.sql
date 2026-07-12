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

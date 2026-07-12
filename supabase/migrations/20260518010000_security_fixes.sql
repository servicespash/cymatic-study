-- 1. Lock down record_referral: derive user from auth.uid(), not client input.
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

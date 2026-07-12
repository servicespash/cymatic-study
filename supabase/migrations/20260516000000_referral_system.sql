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

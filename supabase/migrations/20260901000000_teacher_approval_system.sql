-- 1. Add verification status to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;

-- 2. Update existing independent users to be verified by default
UPDATE public.profiles
SET is_verified = true
WHERE role IN ('independent_learner', 'independent_teacher');

-- 3. Policy update: Only admins can verify teachers
-- Note: This is an RLS policy proposal, ensure you have an 'is_admin' function or similar.
-- A simple way is to check the user's role in public.user_roles.

CREATE OR REPLACE POLICY "Admins can update profile verification" ON public.profiles
FOR UPDATE
USING (
    public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
    public.has_role(auth.uid(), 'admin')
);

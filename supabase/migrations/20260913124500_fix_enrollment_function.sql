-- Fix: Ensure the enrollment function exists and is accessible
CREATE OR REPLACE FUNCTION public.enroll_self_in_school(
    _school_key TEXT,
    _level TEXT,
    _phone TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Update the profile/user role with school info
    -- Assumes 'user_roles' or 'profiles' exists and is correctly structured
    -- This is a placeholder for the actual enrollment logic which needs to be robust
    UPDATE public.profiles
    SET school_id = _school_key,
        level = _level,
        phone = _phone
    WHERE user_id = auth.uid();
END;
$$;

-- Grant permissions
REVOKE ALL ON FUNCTION public.enroll_self_in_school(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.enroll_self_in_school(text, text, text) TO authenticated;

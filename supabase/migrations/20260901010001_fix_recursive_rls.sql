-- 1. Fix the recursive function by using SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.get_my_institution_id()
RETURNS TEXT AS $$
  SELECT school_id FROM public.profiles WHERE user_id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 2. If public.has_role also queries profiles, it must also be SECURITY DEFINER
-- Assuming it exists and queries profiles:
CREATE OR REPLACE FUNCTION public.has_role(uid UUID, role_name TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = uid AND role = role_name
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

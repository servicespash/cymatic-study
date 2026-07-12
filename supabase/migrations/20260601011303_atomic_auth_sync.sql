
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

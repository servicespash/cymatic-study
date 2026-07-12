
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

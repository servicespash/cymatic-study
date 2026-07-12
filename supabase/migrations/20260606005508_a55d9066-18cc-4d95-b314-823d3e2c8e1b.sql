
-- 1. Auto-generate unique school_key on organization insert
CREATE OR REPLACE FUNCTION public.generate_school_key(_name text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prefix text;
  v_candidate text;
  v_exists boolean;
  v_attempts int := 0;
BEGIN
  v_prefix := upper(regexp_replace(coalesce(_name, 'SCH'), '[^a-zA-Z0-9]', '', 'g'));
  v_prefix := left(v_prefix, 4);
  IF length(v_prefix) < 3 THEN v_prefix := rpad(v_prefix, 3, 'X'); END IF;

  LOOP
    v_candidate := v_prefix || '-' || lpad(floor(random() * 10000)::text, 4, '0') || '-' || lpad(floor(random() * 10000)::text, 4, '0');
    SELECT EXISTS(SELECT 1 FROM public.organizations WHERE school_key = v_candidate) INTO v_exists;
    EXIT WHEN NOT v_exists;
    v_attempts := v_attempts + 1;
    IF v_attempts > 10 THEN RAISE EXCEPTION 'Could not allocate school_key'; END IF;
  END LOOP;
  RETURN v_candidate;
END;
$$;

CREATE OR REPLACE FUNCTION public.organizations_set_school_key()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.school_key IS NULL OR length(trim(NEW.school_key)) = 0 THEN
    NEW.school_key := public.generate_school_key(NEW.name);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_organizations_set_school_key ON public.organizations;
CREATE TRIGGER trg_organizations_set_school_key
BEFORE INSERT ON public.organizations
FOR EACH ROW EXECUTE FUNCTION public.organizations_set_school_key();

CREATE UNIQUE INDEX IF NOT EXISTS organizations_school_key_unique ON public.organizations (school_key) WHERE school_key IS NOT NULL;

-- 2. SECURITY DEFINER RPC for institution registration (replaces insecure client insert)
CREATE OR REPLACE FUNCTION public.register_institution(_name text, _email text, _phone text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_org_id uuid;
  v_school_key text;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _name IS NULL OR length(trim(_name)) < 2 THEN RAISE EXCEPTION 'Invalid school name'; END IF;
  IF _email IS NULL OR _email !~ '^[^@]+@[^@]+\.[^@]+$' THEN RAISE EXCEPTION 'Invalid email'; END IF;

  INSERT INTO public.organizations (name, email, phone, creator_user_id)
  VALUES (trim(_name), trim(_email), nullif(trim(coalesce(_phone, '')), ''), v_user)
  RETURNING id, school_key INTO v_org_id, v_school_key;

  PERFORM set_config('app.allow_profile_privileged_update', 'on', true);
  UPDATE public.profiles
  SET org_id = v_org_id,
      role = 'institution_admin',
      school_name = trim(_name),
      phone = COALESCE(nullif(trim(coalesce(_phone, '')), ''), phone),
      updated_at = now()
  WHERE user_id = v_user;

  RETURN jsonb_build_object('org_id', v_org_id, 'school_key', v_school_key, 'name', trim(_name));
END;
$$;

GRANT EXECUTE ON FUNCTION public.register_institution(text, text, text) TO authenticated;

-- 3. resolve_identifier RPC (login expects it; resolves username/phone -> email,
--    and also resolves school_key to organization details for unified lookup.)
CREATE OR REPLACE FUNCTION public.resolve_identifier(identifier text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  clean_id text := trim(identifier);
  resolved_email text;
  org_row record;
BEGIN
  IF clean_id IS NULL OR clean_id = '' THEN
    RETURN NULL;
  END IF;

  -- Try a profile identifier first
  SELECT u.email INTO resolved_email
  FROM public.profiles p
  JOIN auth.users u ON p.user_id = u.id
  WHERE lower(trim(p.username)) = lower(clean_id)
     OR trim(p.phone) = clean_id
  LIMIT 1;

  IF resolved_email IS NOT NULL THEN
    RETURN jsonb_build_object('type', 'email', 'email', resolved_email);
  END IF;

  -- Then try a school key lookup
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

  -- If it looks like an email already, return it directly
  IF clean_id LIKE '%@%' THEN
    RETURN jsonb_build_object('type', 'email', 'email', clean_id);
  END IF;

  RETURN NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION public.resolve_identifier(text) TO anon, authenticated;

-- 4. Token-based marking RPC for public marking station
CREATE OR REPLACE FUNCTION public.get_submission_by_token(_token uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.project_submissions;
BEGIN
  IF _token IS NULL THEN RAISE EXCEPTION 'Invalid token'; END IF;
  SELECT * INTO v_row FROM public.project_submissions
  WHERE teacher_token = _token OR marking_token = _token
  LIMIT 1;
  IF v_row.id IS NULL THEN RAISE EXCEPTION 'Submission not found'; END IF;

  RETURN jsonb_build_object(
    'id', v_row.id,
    'project_id', v_row.project_id,
    'student_user_id', v_row.student_user_id,
    'project_data', v_row.project_data,
    'project_payload', v_row.project_payload,
    'status', v_row.status,
    'is_verified', v_row.is_verified,
    'phase1_score', v_row.phase1_score,
    'phase2_score', v_row.phase2_score,
    'phase3_score', v_row.phase3_score,
    'phase4_score', v_row.phase4_score,
    'awarded_score', v_row.awarded_score,
    'awarded_grade', v_row.awarded_grade,
    'remarks', v_row.remarks,
    'teacher_name', v_row.teacher_name,
    'teacher_title', v_row.teacher_title,
    'teacher_license', v_row.teacher_license,
    'submitted_at', v_row.submitted_at
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_submission_by_token(uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.submit_evaluation_by_token(
  _token uuid,
  _phase1 numeric,
  _phase2 numeric,
  _phase3 numeric,
  _phase4 numeric,
  _remarks text,
  _teacher_name text,
  _teacher_title text DEFAULT NULL,
  _teacher_license text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.project_submissions;
  v_total numeric;
  v_caller uuid := auth.uid();
BEGIN
  IF _token IS NULL THEN RAISE EXCEPTION 'Invalid token'; END IF;
  IF _teacher_name IS NULL OR length(trim(_teacher_name)) < 2 THEN RAISE EXCEPTION 'Teacher name required'; END IF;

  SELECT * INTO v_row FROM public.project_submissions
  WHERE teacher_token = _token OR marking_token = _token
  LIMIT 1;
  IF v_row.id IS NULL THEN RAISE EXCEPTION 'Submission not found'; END IF;

  -- Reject self-grading
  IF v_caller IS NOT NULL AND v_caller = v_row.student_user_id THEN
    RAISE EXCEPTION 'Students cannot grade their own submissions';
  END IF;

  -- Validate scores
  IF _phase1 < 0 OR _phase1 > 10 OR _phase2 < 0 OR _phase2 > 10
     OR _phase3 < 0 OR _phase3 > 10 OR _phase4 < 0 OR _phase4 > 10 THEN
    RAISE EXCEPTION 'Phase scores must be between 0 and 10';
  END IF;

  v_total := round(((_phase1 + _phase2 + _phase3 + _phase4) / 4.0)::numeric, 2);

  UPDATE public.project_submissions
  SET phase1_score = _phase1,
      phase2_score = _phase2,
      phase3_score = _phase3,
      phase4_score = _phase4,
      total_competency_score = v_total,
      awarded_score = round(v_total * 10)::int,
      remarks = nullif(trim(coalesce(_remarks, '')), ''),
      teacher_name = trim(_teacher_name),
      teacher_title = nullif(trim(coalesce(_teacher_title, '')), ''),
      teacher_license = nullif(trim(coalesce(_teacher_license, '')), ''),
      marked_by = trim(_teacher_name),
      is_verified = true,
      status = 'verified',
      verified_at = now(),
      updated_at = now()
  WHERE id = v_row.id;

  RETURN jsonb_build_object('id', v_row.id, 'total_competency_score', v_total, 'verified', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_evaluation_by_token(uuid, numeric, numeric, numeric, numeric, text, text, text, text) TO anon, authenticated;

-- Privacy guardrails: credential-like content is never persisted by the tutor.
-- Detection happens before model invocation and the raw message must never enter logs,
-- analytics, memory, safety summaries, or exports.

ALTER TABLE public.tutor_notifications
 ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'general'
   CHECK(category IN('general','instructional_flag','safety_alert','submission','system')),
 ADD COLUMN IF NOT EXISTS explanation text,
 ADD COLUMN IF NOT EXISTS persistent boolean NOT NULL DEFAULT false,
 ADD COLUMN IF NOT EXISTS acknowledged_at timestamptz;

CREATE INDEX IF NOT EXISTS tutor_notifications_open_flags_idx
 ON public.tutor_notifications(recipient_user_id,category,acknowledged_at,created_at DESC);

CREATE TABLE IF NOT EXISTS public.tutor_export_verifications (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 summary_id uuid REFERENCES public.tutor_study_summaries(id) ON DELETE CASCADE,
 export_id uuid REFERENCES public.tutor_summary_exports(id) ON DELETE SET NULL,
 verification_code text NOT NULL UNIQUE,
 artifact_hash text NOT NULL,
 issuer text NOT NULL DEFAULT 'Cymatic Study',
 status text NOT NULL DEFAULT 'valid' CHECK(status IN('valid','revoked','expired')),
 issued_at timestamptz NOT NULL DEFAULT now(),
 expires_at timestamptz,
 revoked_at timestamptz,
 created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);
ALTER TABLE public.tutor_export_verifications ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS tutor_export_verification_code_idx ON public.tutor_export_verifications(verification_code);
DROP POLICY IF EXISTS tutor_export_verification_owner_read ON public.tutor_export_verifications;
CREATE POLICY tutor_export_verification_owner_read ON public.tutor_export_verifications
 FOR SELECT TO authenticated USING(created_by=auth.uid());
DROP POLICY IF EXISTS tutor_export_verification_public_valid_read ON public.tutor_export_verifications;
CREATE POLICY tutor_export_verification_public_valid_read ON public.tutor_export_verifications
 FOR SELECT TO anon USING(status='valid' AND (expires_at IS NULL OR expires_at>now()));

CREATE OR REPLACE FUNCTION public.get_tutor_verification(target_code text)
RETURNS TABLE(issuer text,status text,artifact_hash text,issued_at timestamptz,expires_at timestamptz)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path=public AS $$
 SELECT issuer,
 CASE WHEN status='valid' AND expires_at IS NOT NULL AND expires_at<=now() THEN 'expired' ELSE status END,
 artifact_hash,issued_at,expires_at
 FROM public.tutor_export_verifications
 WHERE verification_code=target_code
 LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.get_tutor_verification(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_tutor_verification(text) TO anon,authenticated;

-- Never allow arbitrary external destinations to be treated as trusted by the database.
ALTER TABLE public.tutor_summary_exports
 ADD COLUMN IF NOT EXISTS destination_verified boolean NOT NULL DEFAULT false,
 ADD COLUMN IF NOT EXISTS verification_id uuid REFERENCES public.tutor_export_verifications(id) ON DELETE SET NULL;

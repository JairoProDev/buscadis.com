-- Identity KYC: DNI photos + selfie for anti-fraud (beyond padrón lookup)

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS identity_kyc_status text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS identity_kyc_submitted_at timestamptz,
  ADD COLUMN IF NOT EXISTS identity_kyc_reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS identity_kyc_rejection_reason text,
  ADD COLUMN IF NOT EXISTS name_match_score numeric;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_identity_kyc_status_check'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_identity_kyc_status_check
      CHECK (identity_kyc_status IN ('none', 'pending', 'approved', 'rejected'));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.identity_docs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('dni_frente', 'dni_reverso', 'selfie')),
  storage_path text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, tipo)
);

CREATE INDEX IF NOT EXISTS identity_docs_user_idx ON public.identity_docs (user_id);

ALTER TABLE public.identity_docs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS identity_docs_select_own ON public.identity_docs;
CREATE POLICY identity_docs_select_own ON public.identity_docs
  FOR SELECT USING (auth.uid() = user_id);

-- Writes via service role API only
DROP POLICY IF EXISTS identity_docs_deny_write ON public.identity_docs;
CREATE POLICY identity_docs_deny_write ON public.identity_docs
  FOR INSERT WITH CHECK (false);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'identity-kyc',
  'identity-kyc',
  false,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO NOTHING;

COMMENT ON COLUMN public.profiles.identity_kyc_status IS 'none|pending|approved|rejected — photo KYC beyond DNI lookup';
COMMENT ON TABLE public.identity_docs IS 'DNI frente/reverso + selfie for manual review';

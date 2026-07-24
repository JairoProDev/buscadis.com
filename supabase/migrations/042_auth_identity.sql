-- Auth identity: DNI (persona), RUC opcional (negocio vinculado a persona), WhatsApp, intención
-- OTP challenges para verificación WhatsApp

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS dni text,
  ADD COLUMN IF NOT EXISTS dni_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS ruc text,
  ADD COLUMN IF NOT EXISTS ruc_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS whatsapp text,
  ADD COLUMN IF NOT EXISTS whatsapp_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS intencion text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_intencion_check'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_intencion_check
      CHECK (intencion IS NULL OR intencion IN ('explorador', 'anunciante', 'negocio'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_dni_format'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_dni_format
      CHECK (dni IS NULL OR dni ~ '^[0-9]{8}$');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_ruc_format'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_ruc_format
      CHECK (ruc IS NULL OR ruc ~ '^(10|20)[0-9]{9}$');
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_dni_unique
  ON public.profiles (dni)
  WHERE dni IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_whatsapp_unique
  ON public.profiles (whatsapp)
  WHERE whatsapp IS NOT NULL;

COMMENT ON COLUMN public.profiles.dni IS 'DNI peruano (8 dígitos); identidad personal obligatoria';
COMMENT ON COLUMN public.profiles.ruc IS 'RUC 10/20 vinculado a la persona (negocio), no entidad independiente';
COMMENT ON COLUMN public.profiles.intencion IS 'explorador | anunciante | negocio';
COMMENT ON COLUMN public.profiles.whatsapp IS 'Celular WhatsApp E.164 sin + (ej. 51987654321)';

CREATE TABLE IF NOT EXISTS public.whatsapp_otp_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  phone text NOT NULL,
  code_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  attempts int NOT NULL DEFAULT 0,
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS whatsapp_otp_challenges_user_idx
  ON public.whatsapp_otp_challenges (user_id, created_at DESC);

ALTER TABLE public.whatsapp_otp_challenges ENABLE ROW LEVEL SECURITY;

-- Solo service role gestiona OTP (APIs con admin client)
DROP POLICY IF EXISTS whatsapp_otp_deny_all ON public.whatsapp_otp_challenges;
CREATE POLICY whatsapp_otp_deny_all ON public.whatsapp_otp_challenges
  FOR ALL USING (false) WITH CHECK (false);

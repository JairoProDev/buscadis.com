-- Profile capabilities + Google sync fields + influencer referral

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS can_publish boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS locale text,
  ADD COLUMN IF NOT EXISTS google_profile jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS referred_by_code text;

-- Backfill can_publish from existing anunciante/admin
UPDATE public.profiles
SET can_publish = true
WHERE rol IN ('anunciante', 'admin') AND can_publish = false;

CREATE TABLE IF NOT EXISTS public.user_capabilities (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  capability text NOT NULL
    CHECK (capability IN ('publish', 'business', 'rider', 'influencer')),
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('inactive', 'pending', 'active', 'suspended')),
  activated_at timestamptz,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, capability)
);

CREATE INDEX IF NOT EXISTS user_capabilities_capability_idx
  ON public.user_capabilities (capability, status);

ALTER TABLE public.user_capabilities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_capabilities_select_own ON public.user_capabilities;
CREATE POLICY user_capabilities_select_own ON public.user_capabilities
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS user_capabilities_insert_own ON public.user_capabilities;
CREATE POLICY user_capabilities_insert_own ON public.user_capabilities
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS user_capabilities_update_own ON public.user_capabilities;
CREATE POLICY user_capabilities_update_own ON public.user_capabilities
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Influencer referral on creator_profiles
ALTER TABLE public.creator_profiles
  ADD COLUMN IF NOT EXISTS referral_code text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('inactive', 'pending', 'active', 'suspended'));

CREATE UNIQUE INDEX IF NOT EXISTS creator_profiles_referral_code_unique
  ON public.creator_profiles (referral_code)
  WHERE referral_code IS NOT NULL;

COMMENT ON COLUMN public.profiles.can_publish IS 'Bridge: true when capability publish is active';
COMMENT ON COLUMN public.profiles.google_profile IS 'Snapshot from Google ID token for personalization';
COMMENT ON TABLE public.user_capabilities IS 'Independent activations: publish, business, rider, influencer';

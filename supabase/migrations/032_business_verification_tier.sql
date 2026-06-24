ALTER TABLE public.business_profiles
  ADD COLUMN IF NOT EXISTS verification_tier TEXT NOT NULL DEFAULT 'none'
  CHECK (verification_tier IN ('none', 'basic', 'identity', 'business', 'premium'));

COMMENT ON COLUMN public.business_profiles.verification_tier IS 'Trust tier: none, basic, identity, business, premium (gold)';

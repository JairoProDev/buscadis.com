-- Business Profile 10x: SEO fields, profile_blocks, reviews
-- Compatible with legacy business_reviews from create_ecommerce_system.sql

-- SEO + marketing columns
ALTER TABLE public.business_profiles
  ADD COLUMN IF NOT EXISTS meta_title TEXT,
  ADD COLUMN IF NOT EXISTS meta_description TEXT,
  ADD COLUMN IF NOT EXISTS og_image_url TEXT,
  ADD COLUMN IF NOT EXISTS announcement_text TEXT,
  ADD COLUMN IF NOT EXISTS announcement_active BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS pixel_facebook TEXT,
  ADD COLUMN IF NOT EXISTS pixel_tiktok TEXT,
  ADD COLUMN IF NOT EXISTS is_vacation_mode BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS custom_domain TEXT,
  ADD COLUMN IF NOT EXISTS show_contact_form BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS favicon_url TEXT,
  ADD COLUMN IF NOT EXISTS font_family TEXT,
  ADD COLUMN IF NOT EXISTS tagline TEXT,
  ADD COLUMN IF NOT EXISTS profile_blocks JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.business_profiles.profile_blocks IS 'Ordered visual blocks for Fase 2 builder (hero, catalog, deals, etc.)';
COMMENT ON COLUMN public.business_profiles.meta_title IS 'Custom SEO title override';
COMMENT ON COLUMN public.business_profiles.meta_description IS 'Custom SEO description override';

-- business_reviews: create minimal table if missing, then align legacy + new columns
CREATE TABLE IF NOT EXISTS public.business_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_profile_id UUID NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Legacy ecommerce columns (no-op if already present)
ALTER TABLE public.business_reviews ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE public.business_reviews ADD COLUMN IF NOT EXISTS customer_phone TEXT;
ALTER TABLE public.business_reviews ADD COLUMN IF NOT EXISTS comment TEXT;
ALTER TABLE public.business_reviews ADD COLUMN IF NOT EXISTS order_id UUID;
ALTER TABLE public.business_reviews ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;
ALTER TABLE public.business_reviews ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT true;
ALTER TABLE public.business_reviews ADD COLUMN IF NOT EXISTS response_text TEXT;
ALTER TABLE public.business_reviews ADD COLUMN IF NOT EXISTS responded_at TIMESTAMPTZ;

-- Profile hub columns
ALTER TABLE public.business_reviews ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.business_reviews ADD COLUMN IF NOT EXISTS text TEXT;
ALTER TABLE public.business_reviews ADD COLUMN IF NOT EXISTS verified_purchase BOOLEAN DEFAULT false;
ALTER TABLE public.business_reviews ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Backfill text from legacy comment
UPDATE public.business_reviews
SET text = comment
WHERE text IS NULL AND comment IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_business_reviews_profile ON public.business_reviews(business_profile_id);

CREATE INDEX IF NOT EXISTS idx_business_reviews_user
  ON public.business_reviews(user_id)
  WHERE user_id IS NOT NULL;

-- One review per authenticated user per business (legacy guest reviews may lack user_id)
CREATE UNIQUE INDEX IF NOT EXISTS idx_business_reviews_unique_user
  ON public.business_reviews(business_profile_id, user_id)
  WHERE user_id IS NOT NULL;

-- Aggregates (materialized via trigger)
CREATE TABLE IF NOT EXISTS public.business_review_aggregates (
  business_profile_id UUID PRIMARY KEY REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  avg_rating NUMERIC(3,2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.refresh_business_review_aggregate(p_business_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.business_review_aggregates (business_profile_id, avg_rating, review_count, updated_at)
  SELECT
    p_business_id,
    COALESCE(ROUND(AVG(rating)::numeric, 2), 0),
    COUNT(*)::int,
    NOW()
  FROM public.business_reviews
  WHERE business_profile_id = p_business_id
    AND (is_visible IS NULL OR is_visible = true)
  ON CONFLICT (business_profile_id) DO UPDATE SET
    avg_rating = EXCLUDED.avg_rating,
    review_count = EXCLUDED.review_count,
    updated_at = NOW();
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_business_reviews_aggregate()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.refresh_business_review_aggregate(OLD.business_profile_id);
    RETURN OLD;
  END IF;
  PERFORM public.refresh_business_review_aggregate(NEW.business_profile_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_business_reviews_aggregate ON public.business_reviews;
CREATE TRIGGER trg_business_reviews_aggregate
  AFTER INSERT OR UPDATE OR DELETE ON public.business_reviews
  FOR EACH ROW EXECUTE FUNCTION public.trg_business_reviews_aggregate();

ALTER TABLE public.business_reviews ENABLE ROW LEVEL SECURITY;

-- Drop legacy + new policy names before recreating
DROP POLICY IF EXISTS "Everyone can view visible reviews" ON public.business_reviews;
DROP POLICY IF EXISTS "Anyone can create reviews" ON public.business_reviews;
DROP POLICY IF EXISTS "Business owners can manage reviews" ON public.business_reviews;
DROP POLICY IF EXISTS "Anyone can read business reviews" ON public.business_reviews;
DROP POLICY IF EXISTS "Users can insert own review" ON public.business_reviews;
DROP POLICY IF EXISTS "Users can update own review" ON public.business_reviews;
DROP POLICY IF EXISTS "Users can delete own review" ON public.business_reviews;

CREATE POLICY "Anyone can read business reviews"
  ON public.business_reviews FOR SELECT
  USING (is_visible IS NULL OR is_visible = true);

CREATE POLICY "Users can insert own review"
  ON public.business_reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own review"
  ON public.business_reviews FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own review"
  ON public.business_reviews FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Business owners can manage reviews"
  ON public.business_reviews FOR UPDATE
  USING (
    business_profile_id IN (
      SELECT id FROM public.business_profiles WHERE user_id = auth.uid()
    )
  );

ALTER TABLE public.business_review_aggregates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read review aggregates" ON public.business_review_aggregates;
CREATE POLICY "Anyone can read review aggregates"
  ON public.business_review_aggregates FOR SELECT
  USING (true);

-- Seed aggregates for businesses that already have reviews
INSERT INTO public.business_review_aggregates (business_profile_id, avg_rating, review_count, updated_at)
SELECT
  business_profile_id,
  COALESCE(ROUND(AVG(rating)::numeric, 2), 0),
  COUNT(*)::int,
  NOW()
FROM public.business_reviews
WHERE is_visible IS NULL OR is_visible = true
GROUP BY business_profile_id
ON CONFLICT (business_profile_id) DO UPDATE SET
  avg_rating = EXCLUDED.avg_rating,
  review_count = EXCLUDED.review_count,
  updated_at = NOW();

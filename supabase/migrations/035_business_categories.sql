-- Per-business catalog categories with custom name, photo and ordering.
-- Categories link to catalog_products by matching name (products keep their free-text `category`).

CREATE TABLE IF NOT EXISTS public.business_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_profile_id UUID NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  image_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT business_categories_unique_slug UNIQUE (business_profile_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_business_categories_profile_order
  ON public.business_categories(business_profile_id, sort_order);

ALTER TABLE public.business_categories ENABLE ROW LEVEL SECURITY;

-- Public read (categories are shown on the public storefront)
DROP POLICY IF EXISTS "business_categories_select_public" ON public.business_categories;
CREATE POLICY "business_categories_select_public" ON public.business_categories
  FOR SELECT USING (true);

-- Owner / active team member can write
DROP POLICY IF EXISTS "business_categories_write_owner" ON public.business_categories;
CREATE POLICY "business_categories_write_owner" ON public.business_categories
  FOR ALL
  USING (
    business_profile_id IN (
      SELECT bp.id FROM public.business_profiles bp WHERE bp.user_id = auth.uid()
    )
    OR business_profile_id IN (
      SELECT bm.business_profile_id FROM public.business_members bm
      WHERE bm.user_id = auth.uid()
        AND bm.status = 'active'
        AND bm.role IN ('owner', 'admin', 'editor')
    )
  )
  WITH CHECK (
    business_profile_id IN (
      SELECT bp.id FROM public.business_profiles bp WHERE bp.user_id = auth.uid()
    )
    OR business_profile_id IN (
      SELECT bm.business_profile_id FROM public.business_members bm
      WHERE bm.user_id = auth.uid()
        AND bm.status = 'active'
        AND bm.role IN ('owner', 'admin', 'editor')
    )
  );

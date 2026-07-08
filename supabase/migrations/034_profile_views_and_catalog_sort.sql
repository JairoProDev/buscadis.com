-- Profile view tracking + catalog sort_order index

-- page_analytics (may not exist in prod migrations yet)
CREATE TABLE IF NOT EXISTS public.page_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_profile_id UUID REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  product_id UUID REFERENCES public.catalog_products(id) ON DELETE SET NULL,
  order_id UUID,
  session_id TEXT,
  user_agent TEXT,
  referrer TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_business ON public.page_analytics(business_profile_id);
CREATE INDEX IF NOT EXISTS idx_analytics_event ON public.page_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_created ON public.page_analytics(created_at DESC);

ALTER TABLE public.page_analytics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "page_analytics_insert_public" ON public.page_analytics;
CREATE POLICY "page_analytics_insert_public" ON public.page_analytics
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "page_analytics_select_owner" ON public.page_analytics;
CREATE POLICY "page_analytics_select_owner" ON public.page_analytics
  FOR SELECT USING (
    business_profile_id IN (
      SELECT bm.business_profile_id FROM public.business_members bm
      WHERE bm.user_id = auth.uid() AND bm.status = 'active'
    )
    OR business_profile_id IN (
      SELECT bp.id FROM public.business_profiles bp WHERE bp.user_id = auth.uid()
    )
  );

-- Dedup profile views per session (24h window)
CREATE TABLE IF NOT EXISTS public.profile_view_sessions (
  business_profile_id UUID NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (business_profile_id, session_id)
);

CREATE INDEX IF NOT EXISTS idx_profile_view_sessions_viewed_at ON public.profile_view_sessions(viewed_at);

-- Increment view_count atomically with dedup
CREATE OR REPLACE FUNCTION public.increment_business_profile_view(
  p_business_id UUID,
  p_session_id TEXT,
  p_user_agent TEXT DEFAULT NULL,
  p_referrer TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_dedup_id UUID;
BEGIN
  IF p_business_id IS NULL OR p_session_id IS NULL OR length(trim(p_session_id)) = 0 THEN
    RETURN false;
  END IF;

  DELETE FROM public.profile_view_sessions
  WHERE business_profile_id = p_business_id
    AND viewed_at < NOW() - INTERVAL '24 hours';

  INSERT INTO public.profile_view_sessions (business_profile_id, session_id, viewed_at)
  VALUES (p_business_id, p_session_id, NOW())
  ON CONFLICT (business_profile_id, session_id) DO NOTHING
  RETURNING business_profile_id INTO v_dedup_id;

  IF v_dedup_id IS NULL THEN
    RETURN false;
  END IF;

  INSERT INTO public.page_analytics (
    business_profile_id,
    event_type,
    session_id,
    user_agent,
    referrer
  ) VALUES (
    p_business_id,
    'profile_view',
    p_session_id,
    p_user_agent,
    p_referrer
  );

  UPDATE public.business_profiles
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = p_business_id;

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_business_profile_view(UUID, TEXT, TEXT, TEXT) TO anon, authenticated, service_role;

-- Catalog sort_order index + backfill
CREATE INDEX IF NOT EXISTS idx_catalog_products_sort_order
  ON public.catalog_products(business_profile_id, sort_order);

-- Backfill sort_order for existing products (newest first gets lowest index = shown first when asc)
WITH ranked AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY business_profile_id
           ORDER BY COALESCE(sort_order, 0) ASC, created_at DESC
         ) - 1 AS new_order
  FROM public.catalog_products
)
UPDATE public.catalog_products cp
SET sort_order = ranked.new_order
FROM ranked
WHERE cp.id = ranked.id
  AND (cp.sort_order IS NULL OR cp.sort_order = 0);

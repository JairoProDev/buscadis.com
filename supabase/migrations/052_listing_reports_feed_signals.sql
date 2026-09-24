-- Reportes de anuncios/productos + eventos de personalización (ver más / menos / compartir / descargar)

CREATE TABLE IF NOT EXISTS public.listing_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  listing_id text NOT NULL,
  listing_kind text NOT NULL DEFAULT 'adiso'
    CHECK (listing_kind IN ('adiso', 'catalog_product')),
  reason text NOT NULL
    CHECK (reason IN ('spam', 'scam', 'offensive', 'duplicate', 'wrong_category', 'other')),
  details text,
  status text NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'reviewing', 'resolved', 'dismissed')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  resolved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_listing_reports_status_created
  ON public.listing_reports (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_listing_reports_listing
  ON public.listing_reports (listing_id, listing_kind);

ALTER TABLE public.listing_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert own listing reports" ON public.listing_reports;
CREATE POLICY "Users can insert own listing reports"
  ON public.listing_reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "Users can view own listing reports" ON public.listing_reports;
CREATE POLICY "Users can view own listing reports"
  ON public.listing_reports FOR SELECT
  USING (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "Platform admins view all listing reports" ON public.listing_reports;
CREATE POLICY "Platform admins view all listing reports"
  ON public.listing_reports FOR SELECT
  USING (public.is_platform_admin());

DROP POLICY IF EXISTS "Platform admins update listing reports" ON public.listing_reports;
CREATE POLICY "Platform admins update listing reports"
  ON public.listing_reports FOR UPDATE
  USING (public.is_platform_admin());

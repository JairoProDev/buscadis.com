-- Publicadis: sitios web profesionales vinculados a business_profiles
-- Fase 1 — Villa Chaco piloto

ALTER TABLE business_profiles
  ADD COLUMN IF NOT EXISTS site_tier TEXT DEFAULT 'buscadis_profile'
    CHECK (site_tier IN ('buscadis_profile', 'publicadis_site', 'both'));

ALTER TABLE business_profiles
  ADD COLUMN IF NOT EXISTS publicadis_template_id TEXT;

ALTER TABLE business_profiles
  ADD COLUMN IF NOT EXISTS publicadis_published BOOLEAN DEFAULT false;

ALTER TABLE business_profiles
  ADD COLUMN IF NOT EXISTS publicadis_config JSONB DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS publicadis_sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_profile_id UUID NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  template_id TEXT NOT NULL DEFAULT 'artisan-brand',
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  custom_css TEXT,
  static_path TEXT,
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (business_profile_id),
  UNIQUE (slug)
);

CREATE INDEX IF NOT EXISTS idx_publicadis_sites_slug ON publicadis_sites (slug);
CREATE INDEX IF NOT EXISTS idx_publicadis_sites_published ON publicadis_sites (is_published) WHERE is_published = true;

ALTER TABLE publicadis_sites ENABLE ROW LEVEL SECURITY;

-- Lectura pública de sitios publicados
DROP POLICY IF EXISTS "publicadis_sites_public_read" ON publicadis_sites;
CREATE POLICY "publicadis_sites_public_read" ON publicadis_sites
  FOR SELECT USING (is_published = true);

-- Miembros del negocio pueden leer/editar su sitio
DROP POLICY IF EXISTS "publicadis_sites_member_read" ON publicadis_sites;
CREATE POLICY "publicadis_sites_member_read" ON publicadis_sites
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM business_members bm
      WHERE bm.business_profile_id = publicadis_sites.business_profile_id
        AND bm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "publicadis_sites_member_write" ON publicadis_sites;
CREATE POLICY "publicadis_sites_member_write" ON publicadis_sites
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM business_members bm
      WHERE bm.business_profile_id = publicadis_sites.business_profile_id
        AND bm.user_id = auth.uid()
        AND bm.role IN ('owner', 'admin', 'editor')
    )
  );

COMMENT ON TABLE publicadis_sites IS 'Sitios web profesionales Publicadis (publicadis.com/p/{slug})';
COMMENT ON COLUMN publicadis_sites.static_path IS 'Ruta estática en CDN/repo, ej. /villachaco/index.html';

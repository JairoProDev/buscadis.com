-- Search infrastructure: pg_trgm suggest fallback + title indexes

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_adisos_titulo_trgm
  ON adisos USING gin (titulo gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_adisos_descripcion_trgm
  ON adisos USING gin (descripcion gin_trgm_ops);

-- Fast prefix + fuzzy title suggestions (Postgres fallback when Typesense unavailable)
CREATE OR REPLACE FUNCTION suggest_adiso_titles_trgm(
  prefix text,
  result_limit int DEFAULT 8
)
RETURNS TABLE (
  id text,
  titulo text,
  categoria text,
  score float
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    a.id,
    a.titulo,
    a.categoria::text,
    GREATEST(
      similarity(a.titulo, prefix),
      CASE WHEN a.titulo ILIKE prefix || '%' THEN 1.0 ELSE 0 END
    ) AS score
  FROM adisos a
  WHERE
    a.titulo IS NOT NULL
    AND length(trim(prefix)) >= 2
    AND (
      a.titulo ILIKE prefix || '%'
      OR a.titulo % prefix
    )
    AND (a.esta_activo IS NULL OR a.esta_activo = true)
  ORDER BY score DESC, a.fecha_publicacion DESC NULLS LAST
  LIMIT result_limit;
$$;

-- Trgm keyword fallback for full search
CREATE OR REPLACE FUNCTION search_adisos_trgm(
  search_text text,
  result_limit int DEFAULT 30
)
RETURNS TABLE (
  id text,
  titulo text,
  descripcion text,
  categoria text,
  contacto text,
  ubicacion text,
  fecha_publicacion text,
  hora_publicacion text,
  imagenes_urls jsonb,
  trgm_score float
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    a.id,
    a.titulo,
    a.descripcion,
    a.categoria::text,
    a.contacto,
    a.ubicacion,
    a.fecha_publicacion,
    a.hora_publicacion,
    a.imagenes_urls,
    GREATEST(
      similarity(a.titulo, search_text),
      similarity(coalesce(a.descripcion, ''), search_text) * 0.6
    ) AS trgm_score
  FROM adisos a
  WHERE
    length(trim(search_text)) >= 2
    AND (
      a.titulo ILIKE '%' || search_text || '%'
      OR a.descripcion ILIKE '%' || search_text || '%'
      OR a.titulo % search_text
      OR a.descripcion % search_text
    )
    AND (a.esta_activo IS NULL OR a.esta_activo = true)
  ORDER BY trgm_score DESC
  LIMIT result_limit;
$$;

-- Popular search queries cache (fed from ai_search_logs)
CREATE TABLE IF NOT EXISTS search_query_popularity (
  query text PRIMARY KEY,
  count bigint NOT NULL DEFAULT 1,
  last_used timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_search_query_popularity_count
  ON search_query_popularity (count DESC);

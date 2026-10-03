-- Analytics rollups: adiso metrics for owners + platform search gaps

CREATE TABLE IF NOT EXISTS public.adiso_metrics_daily (
  adiso_id text NOT NULL REFERENCES public.adisos(id) ON DELETE CASCADE,
  day date NOT NULL,
  impressions int NOT NULL DEFAULT 0,
  clicks int NOT NULL DEFAULT 0,
  favorites int NOT NULL DEFAULT 0,
  contacts int NOT NULL DEFAULT 0,
  shares int NOT NULL DEFAULT 0,
  view_starts int NOT NULL DEFAULT 0,
  view_ends int NOT NULL DEFAULT 0,
  dismisses int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (adiso_id, day)
);

CREATE INDEX IF NOT EXISTS idx_adiso_metrics_daily_day ON public.adiso_metrics_daily (day DESC);

ALTER TABLE public.adiso_metrics_daily ENABLE ROW LEVEL SECURITY;

-- Owners read metrics only for their listings (via adisos.user_id)
DROP POLICY IF EXISTS "Owners read own adiso metrics" ON public.adiso_metrics_daily;
CREATE POLICY "Owners read own adiso metrics"
  ON public.adiso_metrics_daily FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.adisos a
      WHERE a.id = adiso_metrics_daily.adiso_id
        AND a.user_id = auth.uid()
    )
  );

-- Service role / cron writes (no insert policy for anon)

CREATE OR REPLACE VIEW public.v_adiso_metrics_rolling AS
SELECT
  entity_id AS adiso_id,
  count(*) FILTER (WHERE event_type = 'ad.impression')::int AS impressions,
  count(*) FILTER (WHERE event_type = 'ad.click')::int AS clicks,
  count(*) FILTER (WHERE event_type = 'ad.favorite')::int AS favorites,
  count(*) FILTER (WHERE event_type IN ('ad.contact_whatsapp', 'ad.contact_chat', 'ad.contact_copy'))::int AS contacts,
  count(*) FILTER (WHERE event_type = 'ad.share')::int AS shares,
  count(*) FILTER (WHERE event_type = 'ad.view_start')::int AS view_starts,
  count(*) FILTER (WHERE event_type = 'ad.view_end')::int AS view_ends,
  count(*) FILTER (WHERE event_type IN ('ad.dismiss', 'ad.dismiss_reason'))::int AS dismisses
FROM public.behavioral_events
WHERE entity_type = 'adiso'
  AND entity_id IS NOT NULL
  AND created_at >= now() - interval '30 days'
GROUP BY entity_id;

COMMENT ON VIEW public.v_adiso_metrics_rolling IS 'Last 30d adiso engagement from behavioral_events (admin/service queries).';

CREATE OR REPLACE VIEW public.v_search_zero_results_7d AS
SELECT
  COALESCE(payload->>'query', entity_id, 'unknown') AS query_text,
  count(*)::int AS zero_count,
  max(created_at) AS last_seen
FROM public.behavioral_events
WHERE event_type = 'search.performed'
  AND (payload->>'searchEvent') = 'search.zero_results'
  AND created_at >= now() - interval '7 days'
GROUP BY 1
ORDER BY zero_count DESC
LIMIT 200;

-- Roll up yesterday into adiso_metrics_daily (idempotent upsert)
CREATE OR REPLACE FUNCTION public.refresh_adiso_metrics_daily(p_day date DEFAULT (current_date - 1))
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inserted int;
BEGIN
  INSERT INTO public.adiso_metrics_daily (
    adiso_id, day, impressions, clicks, favorites, contacts, shares, view_starts, view_ends, dismisses, updated_at
  )
  SELECT
    entity_id,
    p_day,
    count(*) FILTER (WHERE event_type = 'ad.impression'),
    count(*) FILTER (WHERE event_type = 'ad.click'),
    count(*) FILTER (WHERE event_type = 'ad.favorite'),
    count(*) FILTER (WHERE event_type IN ('ad.contact_whatsapp', 'ad.contact_chat', 'ad.contact_copy')),
    count(*) FILTER (WHERE event_type = 'ad.share'),
    count(*) FILTER (WHERE event_type = 'ad.view_start'),
    count(*) FILTER (WHERE event_type = 'ad.view_end'),
    count(*) FILTER (WHERE event_type IN ('ad.dismiss', 'ad.dismiss_reason')),
    now()
  FROM public.behavioral_events be
  INNER JOIN public.adisos a ON a.id = be.entity_id
  WHERE be.entity_type = 'adiso'
    AND be.entity_id IS NOT NULL
    AND be.created_at >= p_day::timestamptz
    AND be.created_at < (p_day + 1)::timestamptz
  GROUP BY be.entity_id
  ON CONFLICT (adiso_id, day) DO UPDATE SET
    impressions = EXCLUDED.impressions,
    clicks = EXCLUDED.clicks,
    favorites = EXCLUDED.favorites,
    contacts = EXCLUDED.contacts,
    shares = EXCLUDED.shares,
    view_starts = EXCLUDED.view_starts,
    view_ends = EXCLUDED.view_ends,
    dismisses = EXCLUDED.dismisses,
    updated_at = now();

  GET DIAGNOSTICS inserted = ROW_COUNT;
  RETURN inserted;
END;
$$;

REVOKE ALL ON FUNCTION public.refresh_adiso_metrics_daily(date) FROM PUBLIC;

-- Index for anonymous → user merge on login
CREATE INDEX IF NOT EXISTS idx_behavioral_events_anonymous_pending
  ON public.behavioral_events (anonymous_id)
  WHERE anonymous_id IS NOT NULL AND user_id IS NULL;

-- Soft metrics helper view (CTR / contact funnel, last 7d)
CREATE OR REPLACE VIEW public.v_personalization_funnel_7d AS
SELECT
  date_trunc('day', created_at) AS day,
  count(*) FILTER (WHERE event_type = 'ad.impression') AS impressions,
  count(*) FILTER (WHERE event_type = 'ad.click') AS clicks,
  count(*) FILTER (WHERE event_type IN ('ad.favorite')) AS favorites,
  count(*) FILTER (WHERE event_type IN ('ad.contact_whatsapp', 'ad.contact_chat', 'ad.contact_copy')) AS contacts,
  count(*) FILTER (WHERE event_type IN ('ad.dismiss', 'ad.dismiss_reason')) AS dismisses,
  count(*) FILTER (WHERE event_type = 'search.performed') AS searches,
  count(DISTINCT COALESCE(user_id::text, anonymous_id)) AS unique_actors
FROM public.behavioral_events
WHERE created_at >= now() - interval '7 days'
GROUP BY 1
ORDER BY 1 DESC;

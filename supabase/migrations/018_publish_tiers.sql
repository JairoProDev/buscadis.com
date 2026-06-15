-- Publish tiers, interaction sessions, message kinds, WhatsApp delivery channel

ALTER TABLE public.adisos
  ADD COLUMN IF NOT EXISTS publish_tier text NOT NULL DEFAULT 'paid'
    CHECK (publish_tier IN ('free', 'paid'));

ALTER TABLE public.adisos
  ADD COLUMN IF NOT EXISTS expires_at timestamptz;

ALTER TABLE public.adisos
  ADD COLUMN IF NOT EXISTS features jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.adisos
  ADD COLUMN IF NOT EXISTS private_data jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_adisos_publish_tier_expires
  ON public.adisos (publish_tier, expires_at)
  WHERE publish_tier = 'free' AND esta_activo = true;

-- Interaction sessions per viewer + ad
CREATE TABLE IF NOT EXISTS public.ad_interaction_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  adiso_id text NOT NULL,
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE SET NULL,
  revealed_fields text[] NOT NULL DEFAULT '{}',
  photo_index_seen int NOT NULL DEFAULT 0,
  auto_opened_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, adiso_id)
);

CREATE INDEX IF NOT EXISTS idx_ad_interaction_sessions_adiso
  ON public.ad_interaction_sessions (adiso_id);

ALTER TABLE public.ad_interaction_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own interaction sessions" ON public.ad_interaction_sessions;
CREATE POLICY "Users view own interaction sessions"
  ON public.ad_interaction_sessions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own interaction sessions" ON public.ad_interaction_sessions;
CREATE POLICY "Users insert own interaction sessions"
  ON public.ad_interaction_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own interaction sessions" ON public.ad_interaction_sessions;
CREATE POLICY "Users update own interaction sessions"
  ON public.ad_interaction_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- Message kinds for semi-automated chat
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS message_kind text NOT NULL DEFAULT 'user'
    CHECK (message_kind IN ('user', 'system_buyer', 'system_seller', 'reveal'));

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

-- WhatsApp notification preference
ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS notificaciones_whatsapp boolean NOT NULL DEFAULT true;

-- Extend campaign delivery channel
ALTER TABLE public.campaign_deliveries
  DROP CONSTRAINT IF EXISTS campaign_deliveries_channel_check;

ALTER TABLE public.campaign_deliveries
  ADD CONSTRAINT campaign_deliveries_channel_check
  CHECK (channel IN ('in_app', 'push', 'email', 'whatsapp'));

COMMENT ON COLUMN public.adisos.publish_tier IS 'free = limited 24h ad; paid = full features';
COMMENT ON COLUMN public.adisos.private_data IS 'Full price/location/extras for auto-reply reveal flow';
COMMENT ON TABLE public.ad_interaction_sessions IS 'Per-user ad view state for reveal-on-ask UX';

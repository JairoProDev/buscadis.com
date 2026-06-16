-- Deals: vertical commerce social feed (deal_clips)

CREATE TABLE IF NOT EXISTS public.deal_clips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_profile_id uuid REFERENCES public.business_profiles(id) ON DELETE SET NULL,
  adiso_id text REFERENCES public.adisos(id) ON DELETE SET NULL,
  media_url text NOT NULL,
  media_type text NOT NULL CHECK (media_type IN ('image', 'video')),
  poster_url text,
  duration_sec numeric(8, 2),
  aspect_ratio text DEFAULT '9:16',
  title text NOT NULL,
  caption text,
  categoria text,
  hashtags text[] DEFAULT '{}',
  price_display numeric(12, 2),
  price_original numeric(12, 2),
  currency text NOT NULL DEFAULT 'PEN',
  discount_pct int,
  deal_expires_at timestamptz,
  stock_hint text,
  cta_type text NOT NULL DEFAULT 'adiso'
    CHECK (cta_type IN ('adiso', 'whatsapp', 'url', 'chat')),
  cta_url text,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'archived', 'draft', 'hidden')),
  promotion_tier text NOT NULL DEFAULT 'gratis'
    CHECK (promotion_tier IN ('gratis', 'destacada', 'premium')),
  visible_until timestamptz,
  source text NOT NULL DEFAULT 'manual'
    CHECK (source IN ('manual', 'adiso_auto', 'ugc_challenge', 'seed')),
  view_count int NOT NULL DEFAULT 0,
  like_count int NOT NULL DEFAULT 0,
  save_count int NOT NULL DEFAULT 0,
  share_count int NOT NULL DEFAULT 0,
  cta_click_count int NOT NULL DEFAULT 0,
  report_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_deal_clips_active_feed
  ON public.deal_clips (status, promotion_tier, created_at DESC)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_deal_clips_author
  ON public.deal_clips (author_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_deal_clips_adiso
  ON public.deal_clips (adiso_id)
  WHERE adiso_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_deal_clips_categoria
  ON public.deal_clips (categoria, created_at DESC)
  WHERE status = 'active';

ALTER TABLE public.deal_clips ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active deal clips" ON public.deal_clips;
CREATE POLICY "Anyone can view active deal clips"
  ON public.deal_clips FOR SELECT
  USING (status = 'active' OR auth.uid() = author_user_id);

DROP POLICY IF EXISTS "Users insert own deal clips" ON public.deal_clips;
CREATE POLICY "Users insert own deal clips"
  ON public.deal_clips FOR INSERT
  WITH CHECK (auth.uid() = author_user_id);

DROP POLICY IF EXISTS "Users update own deal clips" ON public.deal_clips;
CREATE POLICY "Users update own deal clips"
  ON public.deal_clips FOR UPDATE
  USING (auth.uid() = author_user_id);

DROP POLICY IF EXISTS "Users delete own deal clips" ON public.deal_clips;
CREATE POLICY "Users delete own deal clips"
  ON public.deal_clips FOR DELETE
  USING (auth.uid() = author_user_id);

-- Views (deduplicated per user or session)
CREATE TABLE IF NOT EXISTS public.deal_clip_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clip_id uuid NOT NULL REFERENCES public.deal_clips(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id text,
  watch_time_ms int DEFAULT 0,
  viewed_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_deal_clip_views_user
  ON public.deal_clip_views (clip_id, user_id)
  WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_deal_clip_views_session
  ON public.deal_clip_views (clip_id, session_id)
  WHERE session_id IS NOT NULL AND user_id IS NULL;

ALTER TABLE public.deal_clip_views ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone insert deal clip views" ON public.deal_clip_views;
CREATE POLICY "Anyone insert deal clip views"
  ON public.deal_clip_views FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users view own deal clip views" ON public.deal_clip_views;
CREATE POLICY "Users view own deal clip views"
  ON public.deal_clip_views FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Likes
CREATE TABLE IF NOT EXISTS public.deal_clip_likes (
  clip_id uuid NOT NULL REFERENCES public.deal_clips(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (clip_id, user_id)
);

ALTER TABLE public.deal_clip_likes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own deal likes" ON public.deal_clip_likes;
CREATE POLICY "Users manage own deal likes"
  ON public.deal_clip_likes FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Saves
CREATE TABLE IF NOT EXISTS public.deal_clip_saves (
  clip_id uuid NOT NULL REFERENCES public.deal_clips(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (clip_id, user_id)
);

ALTER TABLE public.deal_clip_saves ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own deal saves" ON public.deal_clip_saves;
CREATE POLICY "Users manage own deal saves"
  ON public.deal_clip_saves FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Interactions log
CREATE TABLE IF NOT EXISTS public.deal_clip_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clip_id uuid NOT NULL REFERENCES public.deal_clips(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id text,
  interaction_type text NOT NULL
    CHECK (interaction_type IN (
      'view', 'like', 'unlike', 'save', 'unsave', 'share',
      'cta_click', 'whatsapp_click', 'chat_open', 'not_interested', 'report'
    )),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_deal_clip_interactions_clip
  ON public.deal_clip_interactions (clip_id, interaction_type, created_at DESC);

ALTER TABLE public.deal_clip_interactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone insert deal interactions" ON public.deal_clip_interactions;
CREATE POLICY "Anyone insert deal interactions"
  ON public.deal_clip_interactions FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Clip owners view interactions" ON public.deal_clip_interactions;
CREATE POLICY "Clip owners view interactions"
  ON public.deal_clip_interactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.deal_clips c
      WHERE c.id = clip_id AND c.author_user_id = auth.uid()
    )
  );

-- Comments (Fase 1)
CREATE TABLE IF NOT EXISTS public.deal_clip_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clip_id uuid NOT NULL REFERENCES public.deal_clips(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES public.deal_clip_comments(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (char_length(trim(body)) >= 1 AND char_length(body) <= 500),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_deal_clip_comments_clip
  ON public.deal_clip_comments (clip_id, created_at ASC);

ALTER TABLE public.deal_clip_comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone read deal comments" ON public.deal_clip_comments;
CREATE POLICY "Anyone read deal comments"
  ON public.deal_clip_comments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users insert own deal comments" ON public.deal_clip_comments;
CREATE POLICY "Users insert own deal comments"
  ON public.deal_clip_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete own deal comments" ON public.deal_clip_comments;
CREATE POLICY "Users delete own deal comments"
  ON public.deal_clip_comments FOR DELETE
  USING (auth.uid() = user_id);

-- Creator follows (Fase 1)
CREATE TABLE IF NOT EXISTS public.creator_follows (
  follower_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  creator_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, creator_id),
  CHECK (follower_id <> creator_id)
);

CREATE INDEX IF NOT EXISTS idx_creator_follows_creator
  ON public.creator_follows (creator_id, created_at DESC);

ALTER TABLE public.creator_follows ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own follows" ON public.creator_follows;
CREATE POLICY "Users manage own follows"
  ON public.creator_follows FOR ALL
  USING (auth.uid() = follower_id)
  WITH CHECK (auth.uid() = follower_id);

DROP POLICY IF EXISTS "Anyone read follows" ON public.creator_follows;
CREATE POLICY "Anyone read follows"
  ON public.creator_follows FOR SELECT USING (true);

-- Promotion orders
CREATE TABLE IF NOT EXISTS public.deal_promotion_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  clip_id uuid NOT NULL REFERENCES public.deal_clips(id) ON DELETE CASCADE,
  tier text NOT NULL CHECK (tier IN ('gratis', 'destacada', 'premium')),
  amount_pen numeric(10, 2) NOT NULL DEFAULT 0 CHECK (amount_pen >= 0),
  currency text NOT NULL DEFAULT 'PEN',
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'failed', 'cancelled', 'dev_bypass')),
  mp_preference_id text,
  mp_payment_id text,
  paid_at timestamptz,
  fulfilled_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_deal_orders_clip ON public.deal_promotion_orders (clip_id, created_at DESC);
ALTER TABLE public.deal_promotion_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own deal orders" ON public.deal_promotion_orders;
CREATE POLICY "Users view own deal orders"
  ON public.deal_promotion_orders FOR SELECT
  USING (auth.uid() = user_id);

-- Reports
CREATE TABLE IF NOT EXISTS public.deal_clip_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clip_id uuid NOT NULL REFERENCES public.deal_clips(id) ON DELETE CASCADE,
  reporter_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reason text NOT NULL,
  details text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.deal_clip_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users insert deal reports" ON public.deal_clip_reports;
CREATE POLICY "Users insert deal reports"
  ON public.deal_clip_reports FOR INSERT WITH CHECK (true);

-- Challenges (Fase 2)
CREATE TABLE IF NOT EXISTS public.deal_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  hashtag text NOT NULL,
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.deal_challenges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone read active challenges" ON public.deal_challenges;
CREATE POLICY "Anyone read active challenges"
  ON public.deal_challenges FOR SELECT USING (is_active = true);

ALTER TABLE public.deal_clips
  ADD COLUMN IF NOT EXISTS challenge_id uuid REFERENCES public.deal_challenges(id) ON DELETE SET NULL;

-- Live sessions (Fase 3)
CREATE TABLE IF NOT EXISTS public.deal_live_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_profile_id uuid REFERENCES public.business_profiles(id) ON DELETE SET NULL,
  title text NOT NULL,
  stream_url text,
  embed_url text,
  status text NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'live', 'ended')),
  started_at timestamptz,
  ended_at timestamptz,
  viewer_count int NOT NULL DEFAULT 0,
  pinned_adiso_ids text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_deal_live_active
  ON public.deal_live_sessions (status, started_at DESC)
  WHERE status = 'live';

ALTER TABLE public.deal_live_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone read live sessions" ON public.deal_live_sessions;
CREATE POLICY "Anyone read live sessions"
  ON public.deal_live_sessions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Hosts manage own live sessions" ON public.deal_live_sessions;
CREATE POLICY "Hosts manage own live sessions"
  ON public.deal_live_sessions FOR ALL
  USING (auth.uid() = host_user_id)
  WITH CHECK (auth.uid() = host_user_id);

-- Creator handles (Fase 2)
CREATE TABLE IF NOT EXISTS public.creator_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  handle text NOT NULL UNIQUE,
  bio text,
  is_verified boolean NOT NULL DEFAULT false,
  total_clips int NOT NULL DEFAULT 0,
  total_likes int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.creator_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone read creator profiles" ON public.creator_profiles;
CREATE POLICY "Anyone read creator profiles"
  ON public.creator_profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users manage own creator profile" ON public.creator_profiles;
CREATE POLICY "Users manage own creator profile"
  ON public.creator_profiles FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RPC: register view
CREATE OR REPLACE FUNCTION public.fn_register_deal_clip_view(
  p_clip_id uuid,
  p_user_id uuid DEFAULT NULL,
  p_session_id text DEFAULT NULL,
  p_watch_time_ms int DEFAULT 0
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_view boolean := false;
BEGIN
  IF p_user_id IS NOT NULL THEN
    BEGIN
      INSERT INTO public.deal_clip_views (clip_id, user_id, watch_time_ms)
      VALUES (p_clip_id, p_user_id, p_watch_time_ms);
      v_new_view := true;
    EXCEPTION WHEN unique_violation THEN
      v_new_view := false;
    END;
  ELSIF p_session_id IS NOT NULL THEN
    BEGIN
      INSERT INTO public.deal_clip_views (clip_id, session_id, watch_time_ms)
      VALUES (p_clip_id, p_session_id, p_watch_time_ms);
      v_new_view := true;
    EXCEPTION WHEN unique_violation THEN
      v_new_view := false;
    END;
  END IF;

  IF v_new_view THEN
    UPDATE public.deal_clips SET view_count = view_count + 1 WHERE id = p_clip_id;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.fn_register_deal_clip_view(uuid, uuid, text, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fn_register_deal_clip_view(uuid, uuid, text, int) TO authenticated, anon;

-- RPC: toggle like
CREATE OR REPLACE FUNCTION public.fn_toggle_deal_clip_like(p_clip_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_liked boolean;
BEGIN
  IF EXISTS (SELECT 1 FROM public.deal_clip_likes WHERE clip_id = p_clip_id AND user_id = p_user_id) THEN
    DELETE FROM public.deal_clip_likes WHERE clip_id = p_clip_id AND user_id = p_user_id;
    UPDATE public.deal_clips SET like_count = GREATEST(0, like_count - 1) WHERE id = p_clip_id;
    v_liked := false;
  ELSE
    INSERT INTO public.deal_clip_likes (clip_id, user_id) VALUES (p_clip_id, p_user_id);
    UPDATE public.deal_clips SET like_count = like_count + 1 WHERE id = p_clip_id;
    v_liked := true;
  END IF;
  RETURN v_liked;
END;
$$;

REVOKE ALL ON FUNCTION public.fn_toggle_deal_clip_like(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fn_toggle_deal_clip_like(uuid, uuid) TO authenticated;

-- RPC: toggle save
CREATE OR REPLACE FUNCTION public.fn_toggle_deal_clip_save(p_clip_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_saved boolean;
BEGIN
  IF EXISTS (SELECT 1 FROM public.deal_clip_saves WHERE clip_id = p_clip_id AND user_id = p_user_id) THEN
    DELETE FROM public.deal_clip_saves WHERE clip_id = p_clip_id AND user_id = p_user_id;
    UPDATE public.deal_clips SET save_count = GREATEST(0, save_count - 1) WHERE id = p_clip_id;
    v_saved := false;
  ELSE
    INSERT INTO public.deal_clip_saves (clip_id, user_id) VALUES (p_clip_id, p_user_id);
    UPDATE public.deal_clips SET save_count = save_count + 1 WHERE id = p_clip_id;
    v_saved := true;
  END IF;
  RETURN v_saved;
END;
$$;

REVOKE ALL ON FUNCTION public.fn_toggle_deal_clip_save(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fn_toggle_deal_clip_save(uuid, uuid) TO authenticated;

-- RPC: fulfill deal promotion order
CREATE OR REPLACE FUNCTION public.fn_fulfill_deal_order(p_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.deal_promotion_orders%ROWTYPE;
  v_hours int;
BEGIN
  SELECT * INTO v_order FROM public.deal_promotion_orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Orden Deals no encontrada'; END IF;

  v_hours := CASE v_order.tier
    WHEN 'premium' THEN 168
    WHEN 'destacada' THEN 72
    ELSE 24
  END;

  UPDATE public.deal_clips
  SET
    promotion_tier = v_order.tier,
    status = 'active',
    visible_until = now() + (v_hours || ' hours')::interval,
    updated_at = now()
  WHERE id = v_order.clip_id;

  UPDATE public.deal_promotion_orders
  SET fulfilled_at = now(), updated_at = now()
  WHERE id = p_order_id;
END;
$$;

REVOKE ALL ON FUNCTION public.fn_fulfill_deal_order(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fn_fulfill_deal_order(uuid) TO service_role;

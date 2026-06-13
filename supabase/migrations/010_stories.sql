-- Stories: ephemeral (24h) media posts shown in a horizontal bar above the
-- search bar (Facebook/WhatsApp style). Paid promotion tiers boost ordering
-- and visual prominence (highlighted ring, longer duration).

CREATE TABLE IF NOT EXISTS public.stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  media_url text NOT NULL,
  media_type text NOT NULL CHECK (media_type IN ('image', 'video')),
  caption text,
  categoria text,
  adiso_id uuid REFERENCES public.adisos(id) ON DELETE SET NULL,
  promotion_tier text NOT NULL DEFAULT 'gratis' CHECK (promotion_tier IN ('gratis', 'destacada', 'premium')),
  view_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours')
);

CREATE INDEX IF NOT EXISTS idx_stories_user ON public.stories (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stories_expires ON public.stories (expires_at);

ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active stories" ON public.stories;
CREATE POLICY "Anyone can view active stories"
  ON public.stories FOR SELECT
  USING (expires_at > now());

DROP POLICY IF EXISTS "Users can insert own stories" ON public.stories;
CREATE POLICY "Users can insert own stories"
  ON public.stories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own stories" ON public.stories;
CREATE POLICY "Users can update own stories"
  ON public.stories FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own stories" ON public.stories;
CREATE POLICY "Users can delete own stories"
  ON public.stories FOR DELETE
  USING (auth.uid() = user_id);


CREATE TABLE IF NOT EXISTS public.story_views (
  story_id uuid NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  viewed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (story_id, user_id)
);

ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own story views" ON public.story_views;
CREATE POLICY "Users can view own story views"
  ON public.story_views FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can record own story views" ON public.story_views;
CREATE POLICY "Users can record own story views"
  ON public.story_views FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Atomically records a view (once per user) and bumps the story's counter.
CREATE OR REPLACE FUNCTION public.fn_register_story_view(p_story_id uuid, p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.story_views (story_id, user_id)
  VALUES (p_story_id, p_user_id)
  ON CONFLICT (story_id, user_id) DO NOTHING;

  IF FOUND THEN
    UPDATE public.stories SET view_count = view_count + 1 WHERE id = p_story_id;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.fn_register_story_view(uuid, uuid) TO authenticated;

COMMENT ON TABLE public.stories IS 'Ephemeral (24h) media posts shown above the search bar; promotion_tier controls ordering and visual prominence for paid placements.';

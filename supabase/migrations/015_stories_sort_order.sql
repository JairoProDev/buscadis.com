ALTER TABLE public.stories
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_stories_user_sort
  ON public.stories (user_id, status, sort_order ASC, created_at ASC);

-- Progressive profiling: one soft prompt at a time (never blocks first Google session)

CREATE TABLE IF NOT EXISTS public.user_profile_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt_id text NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'dismissed', 'completed')),
  dismissed_at timestamptz,
  dismissed_until timestamptz,
  completed_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, prompt_id)
);

CREATE INDEX IF NOT EXISTS idx_user_profile_prompts_user_status
  ON public.user_profile_prompts (user_id, status);

CREATE INDEX IF NOT EXISTS idx_user_profile_prompts_dismissed_until
  ON public.user_profile_prompts (user_id, dismissed_until)
  WHERE status = 'dismissed';

ALTER TABLE public.user_profile_prompts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own profile prompts" ON public.user_profile_prompts;
CREATE POLICY "Users read own profile prompts"
  ON public.user_profile_prompts FOR SELECT
  USING (auth.uid() = user_id);

-- Writes via service role (API routes); no client insert/update policies

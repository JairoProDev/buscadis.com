-- Link Expo push tokens to users for targeted opportunity notifications.

ALTER TABLE IF EXISTS public.expo_push_tokens
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_expo_push_tokens_user
  ON public.expo_push_tokens (user_id)
  WHERE user_id IS NOT NULL;

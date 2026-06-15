-- Profile Hub: notifications/messages (versioned), view history, message notifications, auto-anunciante

-- ============================================
-- NOTIFICATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('system', 'like', 'message', 'ad_approved', 'ad_rejected')),
  title text NOT NULL,
  message text NOT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_created
  ON public.notifications (user_id, created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can only view their own notifications" ON public.notifications;
CREATE POLICY "Users can only view their own notifications"
  ON public.notifications FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications (mark as read)" ON public.notifications;
CREATE POLICY "Users can update their own notifications (mark as read)"
  ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- CONVERSATIONS & MESSAGES
-- ============================================
CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participants uuid[] NOT NULL,
  last_message text,
  last_message_at timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS story_id uuid REFERENCES public.stories(id) ON DELETE SET NULL;

ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS adiso_id text;

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view conversations they are part of" ON public.conversations;
CREATE POLICY "Users can view conversations they are part of"
  ON public.conversations FOR SELECT USING (auth.uid() = ANY(participants));

DROP POLICY IF EXISTS "Users can insert conversations they are part of" ON public.conversations;
CREATE POLICY "Users can insert conversations they are part of"
  ON public.conversations FOR INSERT WITH CHECK (auth.uid() = ANY(participants));

DROP POLICY IF EXISTS "Users can update conversations they are part of" ON public.conversations;
CREATE POLICY "Users can update conversations they are part of"
  ON public.conversations FOR UPDATE USING (auth.uid() = ANY(participants));

CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_created
  ON public.messages (conversation_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_messages_unread
  ON public.messages (conversation_id, read) WHERE read = false;

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
CREATE POLICY "Users can view messages in their conversations"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id AND auth.uid() = ANY(c.participants)
    )
  );

DROP POLICY IF EXISTS "Users can send messages to their conversations" ON public.messages;
CREATE POLICY "Users can send messages to their conversations"
  ON public.messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id AND auth.uid() = ANY(c.participants)
    )
  );

DROP POLICY IF EXISTS "Users can update messages in their conversations" ON public.messages;
CREATE POLICY "Users can update messages in their conversations"
  ON public.messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id AND auth.uid() = ANY(c.participants)
    )
  );

-- ============================================
-- VIEW HISTORY
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_view_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  adiso_id text,
  story_id uuid REFERENCES public.stories(id) ON DELETE SET NULL,
  business_profile_id uuid,
  source text NOT NULL DEFAULT 'feed'
    CHECK (source IN ('feed', 'story', 'search', 'direct')),
  viewed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_view_history_user_time
  ON public.user_view_history (user_id, viewed_at DESC);

ALTER TABLE public.user_view_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own view history" ON public.user_view_history;
CREATE POLICY "Users manage own view history"
  ON public.user_view_history FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- MESSAGE HANDLERS
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_participant uuid;
  v_sender_name text;
BEGIN
  UPDATE public.conversations
  SET last_message = NEW.content,
      last_message_at = NEW.created_at,
      updated_at = now()
  WHERE id = NEW.conversation_id;

  SELECT COALESCE(p.nombre, 'Alguien') INTO v_sender_name
  FROM public.profiles p
  WHERE p.id = NEW.sender_id;

  FOR v_participant IN
    SELECT unnest(c.participants)
    FROM public.conversations c
    WHERE c.id = NEW.conversation_id
  LOOP
    IF v_participant IS NOT NULL AND v_participant <> NEW.sender_id THEN
      INSERT INTO public.notifications (user_id, type, title, message, data)
      VALUES (
        v_participant,
        'message',
        'Nuevo mensaje',
        left(NEW.content, 120),
        jsonb_build_object(
          'conversation_id', NEW.conversation_id,
          'sender_id', NEW.sender_id,
          'sender_name', v_sender_name
        )
      );
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_new_message ON public.messages;
CREATE TRIGGER on_new_message
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_message();

-- ============================================
-- AUTO PROMOTE TO ANUNCIANTE ON FIRST AD
-- ============================================
CREATE OR REPLACE FUNCTION public.trg_adiso_promote_anunciante()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.user_id IS NOT NULL THEN
    UPDATE public.profiles
    SET rol = 'anunciante'
    WHERE id = NEW.user_id
      AND (rol IS NULL OR rol = 'usuario');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_adiso_promote_anunciante ON public.adisos;
CREATE TRIGGER trg_adiso_promote_anunciante
  AFTER INSERT ON public.adisos
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_adiso_promote_anunciante();

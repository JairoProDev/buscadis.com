-- Bump de recencia al pagar destacado/premium, sin tocar fecha_publicacion (creación).

ALTER TABLE adisos
  ADD COLUMN IF NOT EXISTS promoted_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_adisos_feed_recency
  ON adisos (
    promotion_rank DESC,
    promoted_at DESC NULLS LAST,
    fecha_publicacion DESC,
    hora_publicacion DESC
  );

CREATE OR REPLACE FUNCTION fn_clear_expired_promotions()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE adisos
  SET promotion_tier = 'gratis',
      promotion_rank = 0,
      promotion_expires_at = NULL,
      promoted_at = NULL
  WHERE promotion_expires_at IS NOT NULL
    AND promotion_expires_at < now()
    AND promotion_tier <> 'gratis';
$$;

CREATE OR REPLACE FUNCTION fn_promote_adiso(
  p_adiso_id text,
  p_user_id uuid,
  p_tier text,
  p_days int
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rank smallint;
BEGIN
  IF p_tier NOT IN ('gratis', 'destacada', 'premium') THEN
    RAISE EXCEPTION 'Tier de promoción inválido: %', p_tier;
  END IF;

  v_rank := CASE p_tier
    WHEN 'premium' THEN 2
    WHEN 'destacada' THEN 1
    ELSE 0
  END;

  UPDATE adisos
  SET promotion_tier = p_tier,
      promotion_rank = v_rank,
      promotion_expires_at = CASE
        WHEN p_tier = 'gratis' THEN NULL
        ELSE now() + (p_days || ' days')::interval
      END,
      promoted_at = CASE
        WHEN p_tier = 'gratis' THEN NULL
        ELSE now()
      END
  WHERE id = p_adiso_id AND user_id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No autorizado o anuncio no encontrado';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_fulfill_promotion_order(p_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.adiso_promotion_orders%ROWTYPE;
  v_rank smallint;
BEGIN
  SELECT * INTO v_order
  FROM public.adiso_promotion_orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Orden de promoción no encontrada';
  END IF;

  IF v_order.fulfilled_at IS NOT NULL THEN
    RETURN;
  END IF;

  IF v_order.status NOT IN ('paid', 'dev_bypass') THEN
    RAISE EXCEPTION 'La orden no está pagada (estado: %)', v_order.status;
  END IF;

  v_rank := CASE v_order.tier
    WHEN 'premium' THEN 2
    WHEN 'destacada' THEN 1
    ELSE 0
  END;

  UPDATE public.adisos
  SET promotion_tier = v_order.tier,
      promotion_rank = v_rank,
      promotion_expires_at = CASE
        WHEN v_order.tier = 'gratis' THEN NULL
        ELSE now() + (v_order.days || ' days')::interval
      END,
      promoted_at = CASE
        WHEN v_order.tier = 'gratis' THEN NULL
        ELSE now()
      END
  WHERE id = v_order.adiso_id AND user_id = v_order.user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No autorizado o anuncio no encontrado';
  END IF;

  UPDATE public.adiso_promotion_orders
  SET fulfilled_at = now()
  WHERE id = p_order_id;
END;
$$;

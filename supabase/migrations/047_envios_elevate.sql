-- Buscadis Envíos elevate: accept service RPC, presence, favorites, claims, evidence, scheduling

-- Atomic claim usable from Next.js service role (no auth.uid required)
CREATE OR REPLACE FUNCTION public.accept_moto_request_service(
  p_request_id uuid,
  p_rider_id uuid
)
RETURNS public.moto_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rider public.moto_riders%ROWTYPE;
  v_row public.moto_requests%ROWTYPE;
BEGIN
  SELECT * INTO v_rider
  FROM public.moto_riders
  WHERE id = p_rider_id AND estado = 'aprobado'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'rider_not_eligible';
  END IF;

  UPDATE public.moto_requests
  SET
    status = 'aceptado',
    rider_id = p_rider_id,
    accepted_at = now(),
    updated_at = now()
  WHERE id = p_request_id
    AND status = 'pendiente'
  RETURNING * INTO v_row;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'request_not_available';
  END IF;

  UPDATE public.moto_riders
  SET last_seen_at = now()
  WHERE id = p_rider_id;

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_moto_request_service(uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.accept_moto_request_service(uuid, uuid) TO authenticated;

-- Rider presence on pending requests ("N viendo tu pedido")
CREATE TABLE IF NOT EXISTS public.moto_request_views (
  request_id uuid NOT NULL REFERENCES public.moto_requests(id) ON DELETE CASCADE,
  rider_id uuid NOT NULL REFERENCES public.moto_riders(id) ON DELETE CASCADE,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (request_id, rider_id)
);

CREATE INDEX IF NOT EXISTS moto_request_views_seen_idx
  ON public.moto_request_views (request_id, last_seen_at DESC);

ALTER TABLE public.moto_request_views ENABLE ROW LEVEL SECURITY;

-- Favorite routes for one-tap repeat
CREATE TABLE IF NOT EXISTS public.moto_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  label text,
  pickup_lat double precision NOT NULL,
  pickup_lng double precision NOT NULL,
  pickup_text text NOT NULL,
  pickup_zona text,
  dropoff_lat double precision NOT NULL,
  dropoff_lng double precision NOT NULL,
  dropoff_text text NOT NULL,
  dropoff_zona text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS moto_favorites_user_idx
  ON public.moto_favorites (user_id, created_at DESC);

ALTER TABLE public.moto_favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS moto_favorites_own ON public.moto_favorites;
CREATE POLICY moto_favorites_own ON public.moto_favorites
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Claims / disputes
CREATE TABLE IF NOT EXISTS public.moto_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.moto_requests(id) ON DELETE CASCADE,
  opened_by uuid NOT NULL REFERENCES public.profiles(id),
  reason text NOT NULL,
  details text,
  status text NOT NULL DEFAULT 'abierto'
    CHECK (status IN ('abierto', 'en_revision', 'resuelto', 'cerrado')),
  admin_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS moto_claims_request_idx ON public.moto_claims (request_id);
ALTER TABLE public.moto_claims ENABLE ROW LEVEL SECURITY;

-- Extra request columns
ALTER TABLE public.moto_requests
  ADD COLUMN IF NOT EXISTS fare_agreed numeric(10,2),
  ADD COLUMN IF NOT EXISTS evidence_pickup_url text,
  ADD COLUMN IF NOT EXISTS evidence_delivery_url text,
  ADD COLUMN IF NOT EXISTS scheduled_notified_at timestamptz,
  ADD COLUMN IF NOT EXISTS share_token text,
  ADD COLUMN IF NOT EXISTS phone_shared_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS moto_requests_share_token_uidx
  ON public.moto_requests (share_token)
  WHERE share_token IS NOT NULL;

-- Soft-rename analytics values: posible_viaje → asistencia (product analytics)
ALTER TABLE public.moto_requests
  DROP CONSTRAINT IF EXISTS moto_requests_uso_detectado_check;

UPDATE public.moto_requests
SET uso_detectado = 'asistencia'
WHERE uso_detectado = 'posible_viaje';

ALTER TABLE public.moto_requests
  ADD CONSTRAINT moto_requests_uso_detectado_check
  CHECK (uso_detectado IN ('envio', 'asistencia', 'desconocido', 'posible_viaje'));

COMMENT ON COLUMN public.moto_requests.uso_detectado IS
  'Product analytics: envio | asistencia | desconocido';

COMMENT ON TABLE public.moto_request_views IS
  'Heartbeat of approved riders viewing a pending request';
COMMENT ON TABLE public.moto_favorites IS
  'Saved pickup/dropoff pairs for one-tap repeat';
COMMENT ON TABLE public.moto_claims IS
  'Bilateral dispute / SOS backlog for completed or active deliveries';

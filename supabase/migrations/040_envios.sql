-- Buscadis Envíos: motorizados verificados + solicitudes de envío/matching en vivo

CREATE TABLE IF NOT EXISTS public.moto_riders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  estado text NOT NULL DEFAULT 'borrador'
    CHECK (estado IN ('borrador', 'pendiente', 'aprobado', 'rechazado', 'suspendido')),
  display_name text,
  telefono_whatsapp text,
  placa text,
  foto_moto_url text,
  foto_perfil_url text,
  rating_avg numeric(3,2) NOT NULL DEFAULT 0,
  rating_count integer NOT NULL DEFAULT 0,
  zonas text[] NOT NULL DEFAULT '{}',
  online boolean NOT NULL DEFAULT false,
  last_seen_at timestamptz,
  acepta_mandados_compra boolean NOT NULL DEFAULT true,
  admin_note text,
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_moto_riders_estado ON public.moto_riders (estado);
CREATE INDEX IF NOT EXISTS idx_moto_riders_online
  ON public.moto_riders (online, last_seen_at DESC)
  WHERE estado = 'aprobado';
CREATE INDEX IF NOT EXISTS idx_moto_riders_zonas ON public.moto_riders USING GIN (zonas);

CREATE TABLE IF NOT EXISTS public.moto_rider_docs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rider_id uuid NOT NULL REFERENCES public.moto_riders(id) ON DELETE CASCADE,
  tipo text NOT NULL
    CHECK (tipo IN (
      'dni_frente',
      'dni_reverso',
      'selfie',
      'antecedentes_penales',
      'antecedentes_policiales',
      'foto_moto',
      'placa',
      'licencia',
      'soat'
    )),
  url text NOT NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (rider_id, tipo)
);

CREATE INDEX IF NOT EXISTS idx_moto_rider_docs_rider ON public.moto_rider_docs (rider_id);

CREATE TABLE IF NOT EXISTS public.moto_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rider_id uuid REFERENCES public.moto_riders(id) ON DELETE SET NULL,
  category text NOT NULL
    CHECK (category IN ('paquete', 'documentos', 'mandado', 'olvidado', 'otro')),
  description text NOT NULL,
  photo_url text,
  pickup_lat double precision NOT NULL,
  pickup_lng double precision NOT NULL,
  pickup_text text NOT NULL,
  pickup_zona text,
  dropoff_lat double precision NOT NULL,
  dropoff_lng double precision NOT NULL,
  dropoff_text text NOT NULL,
  dropoff_zona text,
  when_type text NOT NULL DEFAULT 'ahora'
    CHECK (when_type IN ('ahora', 'programado')),
  scheduled_at timestamptz,
  budget_estimate numeric(10,2),
  distance_km numeric(8,2) NOT NULL DEFAULT 0,
  fare_estimate numeric(10,2) NOT NULL DEFAULT 0,
  tip_amount numeric(10,2),
  status text NOT NULL DEFAULT 'pendiente'
    CHECK (status IN ('pendiente', 'aceptado', 'recogido', 'entregado', 'cancelado')),
  uso_detectado text NOT NULL DEFAULT 'desconocido'
    CHECK (uso_detectado IN ('envio', 'posible_viaje', 'desconocido')),
  source_adiso_id text,
  cancel_reason text,
  cancelled_by uuid REFERENCES auth.users(id),
  accepted_at timestamptz,
  picked_up_at timestamptz,
  delivered_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_moto_requests_status_zona
  ON public.moto_requests (status, pickup_zona, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_moto_requests_requester
  ON public.moto_requests (requester_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_moto_requests_rider
  ON public.moto_requests (rider_id, created_at DESC)
  WHERE rider_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_moto_requests_pendiente
  ON public.moto_requests (created_at DESC)
  WHERE status = 'pendiente';

CREATE TABLE IF NOT EXISTS public.moto_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.moto_requests(id) ON DELETE CASCADE,
  from_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_rider_id uuid NOT NULL REFERENCES public.moto_riders(id) ON DELETE CASCADE,
  stars integer NOT NULL CHECK (stars BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (request_id, from_user_id)
);

CREATE INDEX IF NOT EXISTS idx_moto_ratings_rider ON public.moto_ratings (to_rider_id);

CREATE OR REPLACE FUNCTION public.trg_moto_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_moto_riders_updated ON public.moto_riders;
CREATE TRIGGER trg_moto_riders_updated
  BEFORE UPDATE ON public.moto_riders
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_moto_set_updated_at();

DROP TRIGGER IF EXISTS trg_moto_requests_updated ON public.moto_requests;
CREATE TRIGGER trg_moto_requests_updated
  BEFORE UPDATE ON public.moto_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_moto_set_updated_at();

-- Claim atómico: solo un rider gana
CREATE OR REPLACE FUNCTION public.accept_moto_request(p_request_id uuid, p_rider_id uuid)
RETURNS public.moto_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_rider public.moto_riders%ROWTYPE;
  v_row public.moto_requests%ROWTYPE;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  SELECT * INTO v_rider
  FROM public.moto_riders
  WHERE id = p_rider_id AND user_id = v_user_id AND estado = 'aprobado'
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

GRANT EXECUTE ON FUNCTION public.accept_moto_request(uuid, uuid) TO authenticated;

-- Actualiza rating promedio del rider al insertar calificación
CREATE OR REPLACE FUNCTION public.trg_moto_rating_update_avg()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.moto_riders r
  SET
    rating_avg = sub.avg_stars,
    rating_count = sub.cnt
  FROM (
    SELECT
      COALESCE(AVG(stars)::numeric(3,2), 0) AS avg_stars,
      COUNT(*)::integer AS cnt
    FROM public.moto_ratings
    WHERE to_rider_id = NEW.to_rider_id
  ) sub
  WHERE r.id = NEW.to_rider_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_moto_ratings_avg ON public.moto_ratings;
CREATE TRIGGER trg_moto_ratings_avg
  AFTER INSERT ON public.moto_ratings
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_moto_rating_update_avg();

-- Helpers RLS
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.rol = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.current_moto_rider_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.moto_riders WHERE user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_approved_moto_rider()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.moto_riders
    WHERE user_id = auth.uid() AND estado = 'aprobado'
  );
$$;

ALTER TABLE public.moto_riders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moto_rider_docs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moto_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moto_ratings ENABLE ROW LEVEL SECURITY;

-- moto_riders policies
CREATE POLICY "Riders read own profile"
  ON public.moto_riders FOR SELECT
  USING (user_id = auth.uid() OR public.is_platform_admin());

CREATE POLICY "Approved riders public card"
  ON public.moto_riders FOR SELECT
  USING (estado = 'aprobado');

CREATE POLICY "Users insert own rider profile"
  ON public.moto_riders FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Riders update own profile"
  ON public.moto_riders FOR UPDATE
  USING (user_id = auth.uid() OR public.is_platform_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_platform_admin());

-- moto_rider_docs
CREATE POLICY "Rider docs select own"
  ON public.moto_rider_docs FOR SELECT
  USING (
    rider_id = public.current_moto_rider_id()
    OR public.is_platform_admin()
  );

CREATE POLICY "Rider docs insert own"
  ON public.moto_rider_docs FOR INSERT
  WITH CHECK (rider_id = public.current_moto_rider_id());

CREATE POLICY "Rider docs update own"
  ON public.moto_rider_docs FOR UPDATE
  USING (
    rider_id = public.current_moto_rider_id()
    OR public.is_platform_admin()
  );

CREATE POLICY "Rider docs delete own"
  ON public.moto_rider_docs FOR DELETE
  USING (
    rider_id = public.current_moto_rider_id()
    OR public.is_platform_admin()
  );

-- moto_requests
CREATE POLICY "Requesters manage own requests"
  ON public.moto_requests FOR SELECT
  USING (
    requester_id = auth.uid()
    OR rider_id = public.current_moto_rider_id()
    OR public.is_platform_admin()
    OR (
      status = 'pendiente'
      AND public.is_approved_moto_rider()
    )
  );

CREATE POLICY "Users create own requests"
  ON public.moto_requests FOR INSERT
  WITH CHECK (requester_id = auth.uid());

CREATE POLICY "Participants update requests"
  ON public.moto_requests FOR UPDATE
  USING (
    requester_id = auth.uid()
    OR rider_id = public.current_moto_rider_id()
    OR public.is_platform_admin()
  );

-- moto_ratings
CREATE POLICY "Ratings readable by parties"
  ON public.moto_ratings FOR SELECT
  USING (
    from_user_id = auth.uid()
    OR to_rider_id = public.current_moto_rider_id()
    OR public.is_platform_admin()
  );

CREATE POLICY "Users rate completed trips"
  ON public.moto_ratings FOR INSERT
  WITH CHECK (from_user_id = auth.uid());

-- Storage bucket privado KYC
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'moto-kyc',
  'moto-kyc',
  false,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- Package photos (public read for active requests)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'moto-packages',
  'moto-packages',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO NOTHING;

COMMENT ON TABLE public.moto_riders IS 'Motorizados verificados para Buscadis Envíos';
COMMENT ON TABLE public.moto_requests IS 'Solicitudes de envío / matching en vivo';
COMMENT ON COLUMN public.moto_requests.uso_detectado IS 'Inferencia silenciosa server-side; no se muestra en UI';

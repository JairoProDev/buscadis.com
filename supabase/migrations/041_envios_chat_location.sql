-- Ampliar categorías + chat + ubicación en vivo + cancelación

ALTER TABLE public.moto_requests
  DROP CONSTRAINT IF EXISTS moto_requests_category_check;

ALTER TABLE public.moto_requests
  ADD CONSTRAINT moto_requests_category_check
  CHECK (category IN (
    'paquete',
    'documentos',
    'mandado',
    'olvidado',
    'acompanamiento',
    'otro'
  ));

ALTER TABLE public.moto_requests
  ADD COLUMN IF NOT EXISTS conversation_id uuid,
  ADD COLUMN IF NOT EXISTS rider_lat double precision,
  ADD COLUMN IF NOT EXISTS rider_lng double precision,
  ADD COLUMN IF NOT EXISTS rider_location_at timestamptz,
  ADD COLUMN IF NOT EXISTS requester_lat double precision,
  ADD COLUMN IF NOT EXISTS requester_lng double precision,
  ADD COLUMN IF NOT EXISTS requester_location_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_moto_requests_conversation
  ON public.moto_requests (conversation_id)
  WHERE conversation_id IS NOT NULL;

COMMENT ON COLUMN public.moto_requests.conversation_id IS 'Chat in-app entre remitente y motorizado';
COMMENT ON COLUMN public.moto_requests.category IS 'acompanamiento = hueco de traslado personal (UI no dice taxi/pasajero)';

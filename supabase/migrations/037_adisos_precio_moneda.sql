-- Price fields for marketplace ads (used by Publish Studio + filters)

ALTER TABLE public.adisos
  ADD COLUMN IF NOT EXISTS precio numeric(12, 2);

ALTER TABLE public.adisos
  ADD COLUMN IF NOT EXISTS moneda text
    CHECK (moneda IS NULL OR moneda IN ('PEN', 'USD'));

ALTER TABLE public.adisos
  ADD COLUMN IF NOT EXISTS tipo_precio text
    CHECK (tipo_precio IS NULL OR tipo_precio IN ('fijo', 'a_convenir', 'gratis', 'consultar'));

CREATE INDEX IF NOT EXISTS idx_adisos_precio
  ON public.adisos (precio)
  WHERE precio IS NOT NULL AND esta_activo = true;

COMMENT ON COLUMN public.adisos.precio IS 'Listed price amount';
COMMENT ON COLUMN public.adisos.moneda IS 'Currency code PEN or USD';
COMMENT ON COLUMN public.adisos.tipo_precio IS 'How price is presented (fixed, negotiable, free, ask)';

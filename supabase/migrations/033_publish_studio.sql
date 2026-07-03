-- Publish Studio: subcategories, attributes, contact gating, daily pricing orders

ALTER TABLE public.adisos
  ADD COLUMN IF NOT EXISTS subcategoria text;

ALTER TABLE public.adisos
  ADD COLUMN IF NOT EXISTS subsubcategoria text;

ALTER TABLE public.adisos
  ADD COLUMN IF NOT EXISTS atributos jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.adisos
  ADD COLUMN IF NOT EXISTS contact_locked boolean NOT NULL DEFAULT false;

ALTER TABLE public.adisos
  ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'free'
    CHECK (payment_status IN ('free', 'pending', 'verified', 'underpaid'));

CREATE INDEX IF NOT EXISTS idx_adisos_subcategoria
  ON public.adisos (categoria, subcategoria);

CREATE INDEX IF NOT EXISTS idx_adisos_payment_status
  ON public.adisos (payment_status)
  WHERE payment_status IN ('pending', 'underpaid');

CREATE TABLE IF NOT EXISTS public.adiso_publish_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  adiso_id text NOT NULL REFERENCES public.adisos(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan text NOT NULL CHECK (plan IN ('free', 'paid')),
  days int,
  daily_rate numeric(10, 2),
  total_amount numeric(10, 2),
  payment_status text NOT NULL DEFAULT 'pending'
    CHECK (payment_status IN ('pending', 'verified', 'underpaid', 'free')),
  payment_method text NOT NULL DEFAULT 'yape',
  yape_reference text,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_adiso_publish_orders_adiso
  ON public.adiso_publish_orders (adiso_id);

CREATE INDEX IF NOT EXISTS idx_adiso_publish_orders_user
  ON public.adiso_publish_orders (user_id);

CREATE INDEX IF NOT EXISTS idx_adiso_publish_orders_status
  ON public.adiso_publish_orders (payment_status)
  WHERE payment_status = 'pending';

ALTER TABLE public.adiso_publish_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own publish orders" ON public.adiso_publish_orders;
CREATE POLICY "Users view own publish orders"
  ON public.adiso_publish_orders FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own publish orders" ON public.adiso_publish_orders;
CREATE POLICY "Users insert own publish orders"
  ON public.adiso_publish_orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

COMMENT ON COLUMN public.adisos.subcategoria IS 'Subcategory slug from category-tree.ts';
COMMENT ON COLUMN public.adisos.atributos IS 'Dynamic publish fields keyed by field id';
COMMENT ON COLUMN public.adisos.contact_locked IS 'When true, hide contact until payment verified';
COMMENT ON TABLE public.adiso_publish_orders IS 'Daily pricing publish orders (Yape)';

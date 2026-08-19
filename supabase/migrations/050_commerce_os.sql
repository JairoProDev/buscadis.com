-- Commerce OS: pedidos, reservas, cotizaciones (centro comercial digital)
-- 2026-08-08

CREATE TABLE IF NOT EXISTS commerce_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  business_profile_id UUID NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  source TEXT NOT NULL DEFAULT 'perfil_vivo',
  customer_name TEXT,
  customer_phone TEXT,
  customer_note TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total NUMERIC(12, 2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'PEN',
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN (
      'draft', 'sent_wa', 'confirmed', 'preparing',
      'paid', 'delivered', 'cancelled'
    )),
  payment_method TEXT DEFAULT 'whatsapp'
    CHECK (payment_method IN (
      'whatsapp', 'yape', 'plin', 'efectivo', 'mercadopago', 'transferencia'
    )),
  payment_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  mp_preference_id TEXT,
  mp_payment_id TEXT,
  visitor_key TEXT,
  wa_message_sent BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_commerce_orders_business
  ON commerce_orders (business_profile_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_commerce_orders_status
  ON commerce_orders (business_profile_id, status);

CREATE SEQUENCE IF NOT EXISTS commerce_order_number_seq;

CREATE OR REPLACE FUNCTION set_commerce_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number :=
      'PV-' || to_char(now(), 'YYYYMMDD') || '-' ||
      lpad(nextval('commerce_order_number_seq')::text, 4, '0');
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_commerce_order_number ON commerce_orders;
CREATE TRIGGER trg_commerce_order_number
BEFORE INSERT OR UPDATE ON commerce_orders
FOR EACH ROW EXECUTE FUNCTION set_commerce_order_number();

CREATE TABLE IF NOT EXISTS commerce_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_profile_id UUID NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  service_product_id TEXT,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_note TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'requested'
    CHECK (status IN ('requested', 'confirmed', 'cancelled', 'completed', 'no_show')),
  source TEXT NOT NULL DEFAULT 'perfil_vivo',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_commerce_reservations_business
  ON commerce_reservations (business_profile_id, starts_at DESC);

CREATE TABLE IF NOT EXISTS commerce_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_profile_id UUID NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  summary TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'sent_wa', 'in_progress', 'won', 'lost')),
  source TEXT NOT NULL DEFAULT 'perfil_vivo',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_commerce_quotes_business
  ON commerce_quotes (business_profile_id, created_at DESC);

CREATE TABLE IF NOT EXISTS business_faq_trained (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_profile_id UUID NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  pregunta TEXT NOT NULL,
  respuesta TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'owner'
    CHECK (source IN ('owner', 'ia_unanswered', 'seed')),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_business_faq_trained_business
  ON business_faq_trained (business_profile_id, active);

ALTER TABLE commerce_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE commerce_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE commerce_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_faq_trained ENABLE ROW LEVEL SECURITY;

-- Public insert for visitor orders (anon) scoped loosely; owners manage via service role / member policies.
CREATE POLICY commerce_orders_public_insert ON commerce_orders
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY commerce_orders_owner_select ON commerce_orders
  FOR SELECT TO authenticated
  USING (
    business_profile_id IN (
      SELECT id FROM business_profiles WHERE owner_id = auth.uid()
      UNION
      SELECT business_profile_id FROM business_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY commerce_orders_owner_update ON commerce_orders
  FOR UPDATE TO authenticated
  USING (
    business_profile_id IN (
      SELECT id FROM business_profiles WHERE owner_id = auth.uid()
      UNION
      SELECT business_profile_id FROM business_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY commerce_reservations_public_insert ON commerce_reservations
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY commerce_reservations_owner_all ON commerce_reservations
  FOR ALL TO authenticated
  USING (
    business_profile_id IN (
      SELECT id FROM business_profiles WHERE owner_id = auth.uid()
      UNION
      SELECT business_profile_id FROM business_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY commerce_quotes_public_insert ON commerce_quotes
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY commerce_quotes_owner_all ON commerce_quotes
  FOR ALL TO authenticated
  USING (
    business_profile_id IN (
      SELECT id FROM business_profiles WHERE owner_id = auth.uid()
      UNION
      SELECT business_profile_id FROM business_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY business_faq_trained_public_select ON business_faq_trained
  FOR SELECT TO anon, authenticated
  USING (active = true);

CREATE POLICY business_faq_trained_owner_all ON business_faq_trained
  FOR ALL TO authenticated
  USING (
    business_profile_id IN (
      SELECT id FROM business_profiles WHERE owner_id = auth.uid()
      UNION
      SELECT business_profile_id FROM business_members WHERE user_id = auth.uid()
    )
  );

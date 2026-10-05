-- Pipeline comercial Buscadis (ops / futuro Vectorify CRM module)

CREATE TABLE IF NOT EXISTS public.sales_stages (
  id text PRIMARY KEY,
  label text NOT NULL,
  sort_order smallint NOT NULL,
  is_closed_won boolean NOT NULL DEFAULT false,
  is_closed_lost boolean NOT NULL DEFAULT false
);

INSERT INTO public.sales_stages (id, label, sort_order, is_closed_won, is_closed_lost) VALUES
  ('nuevo', 'Nuevo', 0, false, false),
  ('contactado', 'Contactado', 10, false, false),
  ('interesado', 'Interesado', 20, false, false),
  ('propuesta', 'Propuesta enviada', 30, false, false),
  ('negociacion', 'Negociación', 40, false, false),
  ('ganado', 'Ganado', 90, true, false),
  ('perdido', 'Perdido', 91, false, true)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.sales_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name text NOT NULL,
  contact_phone text,
  contact_whatsapp text,
  contact_email text,
  adiso_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  business_profile_id uuid REFERENCES public.business_profiles(id) ON DELETE SET NULL,
  docs_path text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sales_opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  stage_id text NOT NULL DEFAULT 'nuevo' REFERENCES public.sales_stages(id),
  source text NOT NULL DEFAULT 'manual',
  adiso_id text REFERENCES public.adisos(id) ON DELETE SET NULL,
  contact_name text,
  contact_phone text,
  contact_whatsapp text,
  contact_email text,
  business_name text,
  plan_tier text,
  amount_pen numeric(10, 2),
  currency text NOT NULL DEFAULT 'PEN',
  owner_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  account_id uuid REFERENCES public.sales_accounts(id) ON DELETE SET NULL,
  lost_reason text,
  notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  stage_changed_at timestamptz NOT NULL DEFAULT now(),
  won_at timestamptz,
  lost_at timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_sales_opportunities_adiso_unique
  ON public.sales_opportunities (adiso_id)
  WHERE adiso_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_sales_opportunities_stage
  ON public.sales_opportunities (stage_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_sales_opportunities_source
  ON public.sales_opportunities (source, created_at DESC);

CREATE TABLE IF NOT EXISTS public.sales_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id uuid NOT NULL REFERENCES public.sales_opportunities(id) ON DELETE CASCADE,
  activity_type text NOT NULL,
  body text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sales_activities_opportunity
  ON public.sales_activities (opportunity_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.sales_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id uuid REFERENCES public.sales_opportunities(id) ON DELETE CASCADE,
  account_id uuid REFERENCES public.sales_accounts(id) ON DELETE CASCADE,
  title text NOT NULL,
  due_at timestamptz,
  completed_at timestamptz,
  assigned_to uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT sales_tasks_target_chk CHECK (
    opportunity_id IS NOT NULL OR account_id IS NOT NULL
  )
);

CREATE INDEX IF NOT EXISTS idx_sales_tasks_due
  ON public.sales_tasks (due_at)
  WHERE completed_at IS NULL;

ALTER TABLE public.sales_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_stages ENABLE ROW LEVEL SECURITY;

-- Solo backend (service role / API ops); sin políticas para anon/authenticated.

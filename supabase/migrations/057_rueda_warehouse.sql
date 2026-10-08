-- Warehouse analítico Rueda de Negocios (editions + listings + advertisers)

create table if not exists public.rueda_editions (
  edicion text primary key,
  fecha_inicio date,
  fecha_fin date,
  archivo text,
  sha256 text,
  page_count int,
  source text,
  batch_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.rueda_advertisers (
  advertiser_key text primary key,
  phone_primary text not null,
  display_name text,
  first_seen_edicion text references public.rueda_editions (edicion),
  last_seen_edicion text references public.rueda_editions (edicion),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.rueda_listings (
  id uuid primary key default gen_random_uuid(),
  import_key text not null unique,
  edicion text not null references public.rueda_editions (edicion),
  pagina int not null,
  advertiser_key text references public.rueda_advertisers (advertiser_key),
  titulo text not null,
  categoria text not null,
  subcategoria text,
  ubicacion text,
  descripcion text,
  texto_raw text,
  telefonos jsonb not null default '[]'::jsonb,
  email text,
  es_empresa boolean default false,
  score int,
  requiere_revision boolean default false,
  recurrente boolean default false,
  size_tier text,
  precio_estimado_soles numeric(10, 2),
  tiene_logo boolean,
  adiso_id text,
  extracted_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists rueda_listings_edicion_idx on public.rueda_listings (edicion);
create index if not exists rueda_listings_advertiser_idx on public.rueda_listings (advertiser_key);
create index if not exists rueda_listings_adiso_idx on public.rueda_listings (adiso_id);

alter table public.rueda_editions enable row level security;
alter table public.rueda_advertisers enable row level security;
alter table public.rueda_listings enable row level security;

create policy "rueda_editions_service"
  on public.rueda_editions for all
  using (auth.role() = 'service_role');

create policy "rueda_advertisers_service"
  on public.rueda_advertisers for all
  using (auth.role() = 'service_role');

create policy "rueda_listings_service"
  on public.rueda_listings for all
  using (auth.role() = 'service_role');

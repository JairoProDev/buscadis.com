-- 048_soft_delete_trash.sql
-- Papelera de 30 días para productos de catálogo y avisos.
--
-- Contexto del bug: el catálogo de un negocio mezcla `catalog_products` (id uuid)
-- con los clasificados del dueño en `adisos` (id text). El botón de eliminar
-- llamaba siempre a catalog_products, así que borrar un clasificado fallaba en
-- silencio (cast uuid inválido) y el aviso reaparecía en el catálogo y el PDF.

alter table public.catalog_products
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by uuid;

alter table public.adisos
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by uuid;

create index if not exists idx_catalog_products_trash
  on public.catalog_products (deleted_at)
  where deleted_at is not null;

create index if not exists idx_catalog_products_business_live
  on public.catalog_products (business_profile_id, status)
  where deleted_at is null;

create index if not exists idx_adisos_trash
  on public.adisos (deleted_at)
  where deleted_at is not null;

create index if not exists idx_adisos_user_live
  on public.adisos (user_id)
  where deleted_at is null;

-- Las políticas SELECT se combinan con OR, así que TODAS deben exigir
-- deleted_at is null para que una fila en papelera sea invisible vía RLS.
-- Se conserva la semántica de visibilidad previa; solo se ocultan las borradas.

drop policy if exists "Public can view catalog products" on public.catalog_products;
create policy "Public can view catalog products"
  on public.catalog_products for select
  using (deleted_at is null);

drop policy if exists "Los productos publicados son visibles para todos" on public.catalog_products;
create policy "Los productos publicados son visibles para todos"
  on public.catalog_products for select
  using (status = 'published' and deleted_at is null);

drop policy if exists "Propietarios pueden ver todos sus productos" on public.catalog_products;
create policy "Propietarios pueden ver todos sus productos"
  on public.catalog_products for select
  using (
    deleted_at is null
    and business_profile_id in (
      select business_profiles.id
      from public.business_profiles
      where business_profiles.user_id = auth.uid()
    )
  );

drop policy if exists "Todos pueden ver adisos" on public.adisos;
create policy "Todos pueden ver adisos"
  on public.adisos for select
  using (deleted_at is null);

-- Purga definitiva pasada la retención. La ejecuta el cron con service role.
create or replace function public.purge_expired_trash(retention_days integer default 30)
returns table (catalog_products_purged integer, adisos_purged integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  cutoff timestamptz := now() - make_interval(days => greatest(retention_days, 1));
  purged_products integer := 0;
  purged_adisos integer := 0;
begin
  with removed as (
    delete from public.catalog_products
    where deleted_at is not null and deleted_at < cutoff
    returning 1
  )
  select count(*) into purged_products from removed;

  with removed as (
    delete from public.adisos
    where deleted_at is not null and deleted_at < cutoff
    returning 1
  )
  select count(*) into purged_adisos from removed;

  return query select purged_products, purged_adisos;
end;
$$;

revoke all on function public.purge_expired_trash(integer) from public, anon, authenticated;

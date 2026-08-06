/**
 * Papelera del catálogo de negocio.
 *
 * El catálogo mostrado al dueño mezcla dos orígenes:
 *   - `catalog_product`  → fila en `catalog_products` (id uuid)
 *   - `classified_ad`    → fila en `adisos` (id text, ej. "lNhoY-7HDw")
 *
 * Antes se borraba siempre contra `catalog_products`, así que eliminar un
 * clasificado fallaba con un cast uuid inválido y el aviso reaparecía en el
 * catálogo y en el PDF. Aquí el borrado se enruta a la tabla correcta y se
 * verifica que la fila realmente cambió antes de dar el borrado por bueno.
 *
 * El borrado es lógico: la fila sale al instante de todas las vistas (RLS filtra
 * `deleted_at is null`) y queda recuperable durante TRASH_RETENTION_DAYS días.
 */

import { supabase } from '@/lib/supabase';
import type { Adiso } from '@/types';
import { CacheKeys, cacheRemove } from '@/lib/offline-cache';
import { idbClearCatalog, idbClearCatalogPdf } from '@/lib/offline-catalog-store';

export const TRASH_RETENTION_DAYS = 30;

export type TrashItemKind = 'catalog_product' | 'classified_ad';

export type TrashResult =
  | { ok: true; kind: TrashItemKind }
  | { ok: false; kind: TrashItemKind; error: string };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Un clasificado del marketplace se distingue por `privateData.source`. Como
 * respaldo, los ids de `catalog_products` son uuid y los de `adisos` no.
 */
export function getTrashItemKind(adiso: Pick<Adiso, 'id' | 'privateData'>): TrashItemKind {
  const source = (adiso.privateData as { source?: string } | undefined)?.source;
  if (source === 'classified_ad') return 'classified_ad';
  if (source === 'catalog_product') return 'catalog_product';
  return UUID_RE.test(adiso.id) ? 'catalog_product' : 'classified_ad';
}

/** Borra las cachés locales que podrían resucitar el ítem (catálogo y PDF). */
export async function invalidateCatalogCaches(businessId?: string | null): Promise<void> {
  if (!businessId) return;
  cacheRemove(CacheKeys.businessCatalog(businessId));
  await Promise.all([idbClearCatalog(businessId), idbClearCatalogPdf(businessId)]);
}

/**
 * Manda un ítem del catálogo a la papelera. Desaparece de inmediato de catálogo,
 * PDF, buscador y feed; se puede restaurar durante 30 días.
 */
export async function moveCatalogItemToTrash(
  adiso: Pick<Adiso, 'id' | 'privateData'>,
  opts?: { businessId?: string | null }
): Promise<TrashResult> {
  const kind = getTrashItemKind(adiso);
  if (!supabase) return { ok: false, kind, error: 'Sin conexión con la base de datos' };

  const { data: auth } = await supabase.auth.getUser();
  const table = kind === 'classified_ad' ? 'adisos' : 'catalog_products';
  const patch: Record<string, unknown> = {
    deleted_at: new Date().toISOString(),
    deleted_by: auth?.user?.id ?? null,
  };
  // Los clasificados se leen en muchos sitios por `esta_activo`; bajarlo evita
  // que un lector que aún no filtre `deleted_at` lo siga mostrando.
  if (kind === 'classified_ad') patch.esta_activo = false;

  const { data, error } = await supabase
    .from(table)
    .update(patch)
    .eq('id', adiso.id)
    .select('id');

  if (error) {
    console.error(`[trash] No se pudo eliminar ${kind} ${adiso.id}:`, error);
    return { ok: false, kind, error: error.message };
  }
  if (!data?.length) {
    return {
      ok: false,
      kind,
      error: 'No se encontró el elemento o no tienes permiso para eliminarlo',
    };
  }

  await invalidateCatalogCaches(opts?.businessId);
  return { ok: true, kind };
}

/** Restaura un ítem de la papelera. Requiere sesión con permiso de edición. */
export async function restoreCatalogItemFromTrash(
  id: string,
  kind: TrashItemKind,
  opts?: { businessId?: string | null }
): Promise<TrashResult> {
  if (!supabase) return { ok: false, kind, error: 'Sin conexión con la base de datos' };

  const res = await fetch('/api/catalog/trash', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, kind }),
  });
  const json = await res.json().catch(() => ({}));

  if (!res.ok || !json?.success) {
    return { ok: false, kind, error: json?.error || 'No se pudo restaurar' };
  }

  await invalidateCatalogCaches(opts?.businessId);
  return { ok: true, kind };
}

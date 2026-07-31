import type { ConversationListingPreview } from '@/types';
import type { SupabaseClient } from '@supabase/supabase-js';

function parseImageUrls(value: unknown): string | undefined {
  try {
    const urls = typeof value === 'string' ? JSON.parse(value) : value;
    if (Array.isArray(urls) && urls.length > 0) {
      const first = urls[0];
      return typeof first === 'string' ? first : (first as { url?: string })?.url;
    }
  } catch {
    /* ignore */
  }
  return undefined;
}

function formatPrice(precio: unknown, moneda: unknown): string | undefined {
  const n = typeof precio === 'number' ? precio : Number(precio);
  if (!Number.isFinite(n) || n <= 0) return undefined;
  const prefix = moneda === 'USD' ? '$' : 'S/';
  return `${prefix} ${n.toLocaleString('es-PE', { maximumFractionDigits: 0 })}`;
}

/**
 * Batch-resolve listing previews for conversation adiso_ids (adisos + catalog_products).
 */
export async function fetchListingPreviews(
  db: SupabaseClient,
  adisoIds: string[]
): Promise<Map<string, ConversationListingPreview>> {
  const map = new Map<string, ConversationListingPreview>();
  const ids = [...new Set(adisoIds.filter(Boolean))];
  if (ids.length === 0) return map;

  const [adisosRes, productsRes] = await Promise.all([
    db
      .from('adisos')
      .select('id, titulo, precio, moneda, imagenes_urls, private_data')
      .in('id', ids),
    db.from('catalog_products').select('id, title, price, currency, images').in('id', ids),
  ]);

  for (const row of adisosRes.data || []) {
    const priv =
      row.private_data && typeof row.private_data === 'object'
        ? (row.private_data as Record<string, unknown>)
        : {};
    const img =
      (Array.isArray(priv.imagenesUrls) ? (priv.imagenesUrls[0] as string) : undefined) ||
      parseImageUrls(row.imagenes_urls);
    map.set(String(row.id), {
      title: (row.titulo as string) || 'Aviso',
      imageUrl: img,
      priceLabel: formatPrice(priv.precio ?? row.precio, priv.moneda ?? row.moneda),
    });
  }

  for (const row of productsRes.data || []) {
    if (map.has(String(row.id))) continue;
    const images = Array.isArray(row.images) ? row.images : [];
    const first = images[0];
    const imageUrl =
      typeof first === 'string' ? first : (first as { url?: string } | undefined)?.url;
    map.set(String(row.id), {
      title: (row.title as string) || 'Producto',
      imageUrl,
      priceLabel: formatPrice(row.price, row.currency),
    });
  }

  return map;
}

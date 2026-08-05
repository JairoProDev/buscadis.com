import {
  idbGetCatalogPdf,
  idbSetCatalogPdf,
  idbClearCatalogPdf,
} from '@/lib/offline-catalog-store';

export { idbGetCatalogPdf, idbSetCatalogPdf, idbClearCatalogPdf };

function firstImageToken(images: unknown): string {
  if (!images) return '';
  let arr: unknown[] = [];
  if (typeof images === 'string') {
    try {
      const p = JSON.parse(images);
      arr = Array.isArray(p) ? p : [];
    } catch {
      return '';
    }
  } else if (Array.isArray(images)) {
    arr = images;
  }
  const first = arr[0];
  if (typeof first === 'string') return first;
  if (first && typeof first === 'object' && 'url' in first) {
    return String((first as { url?: string }).url || '');
  }
  return '';
}

/** Subir al cambiar el diseño del PDF: invalida los PDF ya cacheados. */
export const CATALOG_PDF_LAYOUT_VERSION = 'v2-cover';

/** Firma estable: cambia solo si se añade/edita producto o imagen. */
export function buildCatalogPdfFingerprint(
  businessId: string,
  profileUpdatedAt: string | undefined,
  products: { id: string; updated_at?: string; images?: unknown }[]
): string {
  const parts = products
    .map((p) => `${p.id}:${p.updated_at || ''}:${firstImageToken(p.images)}`)
    .sort();
  return `${CATALOG_PDF_LAYOUT_VERSION}|${businessId}|${profileUpdatedAt || ''}|${products.length}|${parts.join(';')}`;
}

import { newAdisoId } from '@/lib/url';

/** Mismo formato que adisos (`nanoid(10)`): URLs cortas en `/a/{id}/…` y `?adiso=`. */
export const newCatalogProductId = (): string => newAdisoId();

export function withNewCatalogProductId<T extends Record<string, unknown>>(
  row: T
): T & { id: string } {
  const id = typeof row.id === 'string' && row.id.trim() ? row.id : newCatalogProductId();
  return { ...row, id };
}

export function withNewCatalogProductIds<T extends Record<string, unknown>>(
  rows: T[]
): Array<T & { id: string }> {
  return rows.map(withNewCatalogProductId);
}

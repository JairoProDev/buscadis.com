import type { ProductSortBy, SortOrder } from '@/types/catalog';

export const CATALOG_DEFAULT_ORDER: { column: 'sort_order' | 'created_at'; ascending: boolean }[] = [
  { column: 'sort_order', ascending: true },
  { column: 'created_at', ascending: false },
];

export type VisitorSortOption =
  | 'owner'
  | 'title_asc'
  | 'title_desc'
  | 'price_asc'
  | 'price_desc'
  | 'newest';

export const VISITOR_SORT_OPTIONS: { id: VisitorSortOption; label: string }[] = [
  { id: 'owner', label: 'Destacados' },
  { id: 'title_asc', label: 'Nombre A→Z' },
  { id: 'title_desc', label: 'Nombre Z→A' },
  { id: 'price_asc', label: 'Precio: menor a mayor' },
  { id: 'price_desc', label: 'Precio: mayor a menor' },
  { id: 'newest', label: 'Más recientes' },
];

const VISITOR_SORT_STORAGE_KEY = 'buscadis.catalogSort';

export function getStoredVisitorSort(): VisitorSortOption {
  if (typeof sessionStorage === 'undefined') return 'owner';
  const stored = sessionStorage.getItem(VISITOR_SORT_STORAGE_KEY);
  if (stored && VISITOR_SORT_OPTIONS.some((o) => o.id === stored)) {
    return stored as VisitorSortOption;
  }
  return 'owner';
}

export function setStoredVisitorSort(sort: VisitorSortOption): void {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.setItem(VISITOR_SORT_STORAGE_KEY, sort);
}

function getTitle(p: { title?: string; titulo?: string }): string {
  return (p.title || p.titulo || '').toLowerCase();
}

function getPrice(p: { price?: number | null; precio?: number | null }): number | null {
  const v = p.price ?? p.precio;
  return typeof v === 'number' && !Number.isNaN(v) ? v : null;
}

/** Client-side sort for visitor catalog (Adiso or CatalogProduct shapes). */
export function sortCatalogItems<T extends { title?: string; titulo?: string; price?: number | null; precio?: number | null; sort_order?: number; is_featured?: boolean; created_at?: string }>(
  items: T[],
  sort: VisitorSortOption
): T[] {
  const copy = [...items];

  if (sort === 'owner') {
    return copy.sort((a, b) => {
      const feat = Number(Boolean(b.is_featured)) - Number(Boolean(a.is_featured));
      if (feat !== 0) return feat;
      const ao = a.sort_order ?? 0;
      const bo = b.sort_order ?? 0;
      if (ao !== bo) return ao - bo;
      return (b.created_at || '').localeCompare(a.created_at || '');
    });
  }

  if (sort === 'title_asc') {
    return copy.sort((a, b) => getTitle(a).localeCompare(getTitle(b), 'es'));
  }
  if (sort === 'title_desc') {
    return copy.sort((a, b) => getTitle(b).localeCompare(getTitle(a), 'es'));
  }
  if (sort === 'price_asc') {
    return copy.sort((a, b) => {
      const pa = getPrice(a);
      const pb = getPrice(b);
      if (pa === null && pb === null) return 0;
      if (pa === null) return 1;
      if (pb === null) return -1;
      return pa - pb;
    });
  }
  if (sort === 'price_desc') {
    return copy.sort((a, b) => {
      const pa = getPrice(a);
      const pb = getPrice(b);
      if (pa === null && pb === null) return 0;
      if (pa === null) return 1;
      if (pb === null) return -1;
      return pb - pa;
    });
  }
  if (sort === 'newest') {
    return copy.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
  }

  return copy;
}

export function toProductSortBy(option: VisitorSortOption): { sortBy: ProductSortBy; order: SortOrder } | null {
  switch (option) {
    case 'title_asc':
      return { sortBy: 'title', order: 'asc' };
    case 'title_desc':
      return { sortBy: 'title', order: 'desc' };
    case 'price_asc':
      return { sortBy: 'price', order: 'asc' };
    case 'price_desc':
      return { sortBy: 'price', order: 'desc' };
    case 'newest':
      return { sortBy: 'created_at', order: 'desc' };
    default:
      return null;
  }
}

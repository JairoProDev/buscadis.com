/** URLs legibles para búsqueda: /buscar/empleo-cusco (canónica) vs /buscar?q= (alias → redirect). */

export function searchQueryToSlug(query: string): string {
  const raw = query.trim().toLowerCase();
  if (!raw) return '';
  const normalized = raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return normalized || 'busqueda';
}

export function searchSlugToQuery(slug: string): string {
  const decoded = decodeURIComponent(slug || '').trim();
  if (!decoded) return '';
  if (/\s/.test(decoded)) {
    return decoded.replace(/\s+/g, ' ').trim();
  }
  return decoded.replace(/-/g, ' ').replace(/\s+/g, ' ').trim();
}

export function getSearchPathFromQuery(query: string): string {
  const slug = searchQueryToSlug(query);
  return slug ? `/buscar/${slug}` : '/buscar';
}

export function getSearchCanonicalPath(query: string): string {
  return getSearchPathFromQuery(query);
}

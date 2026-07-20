import { Adiso } from '@/types';
import { getSiteUrl } from '@/lib/seo/og-image';
import { nanoid } from 'nanoid';

/** Normaliza texto para segmentos de URL (sin acentos). */
export const normalizeString = (str: string): string => {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

/** Slug legible del título (sin el id). */
export const createAdisoTitleSlug = (titulo: string): string => {
  const slug = normalizeString(titulo || 'aviso').slice(0, 72);
  return slug || 'aviso';
};

/**
 * @deprecated Prefer createAdisoTitleSlug + getAdisoUrl.
 * Legacy: `{title}-{id}` used by old /city/cat/... routes.
 */
export const createAdisoSlug = (adiso: Adiso): string => {
  return `${createAdisoTitleSlug(adiso.titulo)}-${adiso.id}`;
};

const UUID_REGEX =
  /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
/** IDs Publish Studio legacy: adiso-{timestamp}-{rand} */
const ADISO_TIMESTAMP_ID_REGEX = /adiso[-_]\d{10,}[-_][a-z0-9]+/i;
/** NanoID 10 (URL-safe alphabet from nanoid default) */
const NANO_ID_REGEX = /^[A-Za-z0-9_-]{10}$/;

/**
 * Extrae el id real desde un segmento SEO o path.
 * Soporta: UUID, adiso-{ts}-{rand}, nanoid(10), y legacy title-id.
 */
export const getIdFromSlug = (slug: string): string => {
  const raw = decodeURIComponent(slug || '').trim();
  if (!raw) return '';

  // Path style already split: just the id
  if (NANO_ID_REGEX.test(raw)) return raw;

  const adisoTs = raw.match(ADISO_TIMESTAMP_ID_REGEX);
  if (adisoTs) return adisoTs[0];

  const uuidMatch = raw.match(UUID_REGEX);
  if (uuidMatch) return uuidMatch[0];

  // Legacy `{title}-{nanoid}` — último segmento de 10 chars
  const parts = raw.split('-').filter(Boolean);
  const last = parts[parts.length - 1];
  if (last && NANO_ID_REGEX.test(last)) return last;

  // Último recurso: todo desde "adiso-" / "adiso_"
  const adisoIdx = raw.toLowerCase().search(/adiso[-_]/);
  if (adisoIdx >= 0) return raw.slice(adisoIdx);

  return last || raw;
};

/** Ruta corta solo con id (feed / panel). */
export const getAdisoShortPath = (id: string): string => `/a/${id}`;

/**
 * URL canónica de página dedicada: `/a/{id}/{titulo-slug}`
 * El slug es cosmético/SEO; la resolución usa solo el id.
 */
export const getAdisoUrl = (adiso: Adiso): string => {
  const id = adiso.id;
  const titleSlug = createAdisoTitleSlug(adiso.titulo);
  return `/a/${id}/${titleSlug}`;
};

/** URL absoluta para compartir. */
export const getAdisoAbsoluteUrl = (adiso: Adiso): string => {
  return `${getSiteUrl()}${getAdisoUrl(adiso)}`;
};

/** Genera id corto para nuevos avisos (nanoid 10). */
export const newAdisoId = (): string => nanoid(10);

/**
 * Legacy SEO path (sigue resolviéndose en [...slug] con getIdFromSlug arreglado).
 * Preferir getAdisoUrl (/a/...).
 */
export const getAdisoLegacySeoUrl = (adiso: Adiso): string => {
  const ubicacionStr =
    typeof adiso.ubicacion === 'string'
      ? adiso.ubicacion
      : adiso.ubicacion?.distrito || adiso.ubicacion?.provincia || 'peru';

  const locationSlug = normalizeString(ubicacionStr);
  const categorySlug = normalizeString(adiso.categoria);
  return `/${locationSlug}/${categorySlug}/${createAdisoSlug(adiso)}`;
};

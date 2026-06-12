import { Adiso, Categoria } from '@/types';

export type PublisherAvatarKind = 'buscadis' | 'photo' | 'initials';

export interface PublisherAvatar {
  kind: PublisherAvatarKind;
  imageUrl?: string;
  initials: string;
  backgroundColor: string;
  textColor: string;
  label: string;
  isCompany: boolean;
}

const COMPANY_HINTS =
  /\b(s\.?a\.?c\.?|s\.?a\.?|e\.?i\.?r\.?l\.?|s\.?r\.?l\.?|cia\.?|empresa|agencia|corporaci[oó]n|grupo|hotel|hostal|inmobiliaria|constructora|cl[ií]nica|farmacia|supermercado|banco)\b/i;

const GENERIC_SELLER_NAMES = new Set(['anunciante', 'vendedor', 'usuario', 'sin nombre']);

/** Paleta determinística: cada anuncio obtiene un tono distinto según su id */
const AVATAR_PALETTES: Array<{ bg: string; fg: string }> = [
  { bg: '#ecfdf5', fg: '#047857' },
  { bg: '#eff6ff', fg: '#1d4ed8' },
  { bg: '#fdf4ff', fg: '#7e22ce' },
  { bg: '#fff7ed', fg: '#c2410c' },
  { bg: '#fef2f2', fg: '#b91c1c' },
  { bg: '#ecfeff', fg: '#0e7490' },
  { bg: '#f0fdf4', fg: '#15803d' },
  { bg: '#faf5ff', fg: '#6d28d9' },
  { bg: '#fffbeb', fg: '#b45309' },
  { bg: '#f8fafc', fg: '#475569' },
  { bg: '#f0f9ff', fg: '#0369a1' },
  { bg: '#fdf2f8', fg: '#be185d' },
];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function isPlatformPublished(adiso: Adiso): boolean {
  if (adiso.esHistorico) return true;
  const fuente = adiso.fuenteOriginal?.toLowerCase() ?? '';
  if (fuente.includes('rueda') || fuente.includes('import') || fuente.includes('pdf')) {
    return true;
  }
  return !adiso.usuario_id && !adiso.user_id;
}

function looksLikeCompany(adiso: Adiso, sellerName: string | null): boolean {
  if (adiso.categoria === 'negocios' || adiso.categoria === 'empleos') return true;
  const probe = `${sellerName ?? ''} ${adiso.titulo}`;
  return COMPANY_HINTS.test(probe);
}

function cleanSellerName(adiso: Adiso): string | null {
  const raw = adiso.vendedor?.nombre?.trim();
  if (!raw) return null;
  if (GENERIC_SELLER_NAMES.has(raw.toLowerCase())) return null;
  return raw;
}

function initialsFromText(text: string, isCompany: boolean): string {
  const words = text
    .replace(/[^\wáéíóúñÁÉÍÓÚÑ\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1);

  if (words.length === 0) return 'AD';

  if (isCompany) {
    const significant = words.filter((w) => !/^(de|la|el|los|las|del|y)$/i.test(w));
    const pool = significant.length > 0 ? significant : words;
    if (pool.length >= 2) {
      return `${pool[0][0]}${pool[1][0]}`.toUpperCase();
    }
    return pool[0].slice(0, 2).toUpperCase();
  }

  const first = words[0];
  if (words.length >= 2) {
    return `${first[0]}${words[1][0]}`.toUpperCase();
  }
  return first.slice(0, 2).toUpperCase();
}

function paletteForAdiso(adiso: Adiso): { bg: string; fg: string } {
  const idx = hashString(`${adiso.id}-${adiso.categoria}`) % AVATAR_PALETTES.length;
  return AVATAR_PALETTES[idx];
}

/**
 * Avatar del anunciante para la esquina de la imagen del card.
 * Prioridad: logo Buscadis (plataforma) → foto real → iniciales únicas por anuncio.
 */
export function getPublisherAvatar(adiso: Adiso): PublisherAvatar {
  const sellerName = cleanSellerName(adiso);
  const isCompany = looksLikeCompany(adiso, sellerName);
  const palette = paletteForAdiso(adiso);

  if (isPlatformPublished(adiso)) {
    return {
      kind: 'buscadis',
      imageUrl: '/logo.png',
      initials: 'B',
      backgroundColor: '#ffffff',
      textColor: '#53acc5',
      label: 'Publicado por Buscadis',
      isCompany: true,
    };
  }

  if (adiso.vendedor?.avatarUrl?.trim()) {
    return {
      kind: 'photo',
      imageUrl: adiso.vendedor.avatarUrl,
      initials: initialsFromText(sellerName ?? adiso.titulo, isCompany),
      backgroundColor: palette.bg,
      textColor: palette.fg,
      label: sellerName ?? 'Anunciante',
      isCompany,
    };
  }

  const seed = sellerName ?? adiso.titulo;
  return {
    kind: 'initials',
    initials: initialsFromText(seed, isCompany),
    backgroundColor: palette.bg,
    textColor: palette.fg,
    label: sellerName ?? (isCompany ? 'Empresa' : 'Particular'),
    isCompany,
  };
}

export function getPublisherAvatarSize(tamaño: string, vista: string): number {
  if (vista === 'list') return 28;
  if (tamaño === 'miniatura') return 24;
  if (tamaño === 'grande' || tamaño === 'gigante') return 36;
  return 32;
}

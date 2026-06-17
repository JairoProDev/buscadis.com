import { Adiso } from '@/types';

type SignalTone = 'neutral' | 'positive' | 'highlight' | 'warm' | 'archive' | 'trust';

interface SocialSignal {
  label: string;
  tone: SignalTone;
}

export type CardSignalType =
  | 'destacado'
  | 'verificado'
  | 'respuesta_rapida'
  | 'vendedor_top'
  | 'interes'
  | 'popular'
  | 'nuevo'
  | 'con_fotos'
  | 'empleo_destacado'
  | 'inmueble_buscado';

export interface CardSignal {
  type: CardSignalType;
  label: string;
  tone: SignalTone;
}

function getPublishedDate(adiso: Pick<Adiso, 'fechaPublicacion' | 'horaPublicacion'>): Date | null {
  if (!adiso.fechaPublicacion) return null;
  const iso = adiso.horaPublicacion
    ? `${adiso.fechaPublicacion}T${adiso.horaPublicacion}`
    : adiso.fechaPublicacion;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getAgeInHours(adiso: Pick<Adiso, 'fechaPublicacion' | 'horaPublicacion'>): number | null {
  const date = getPublishedDate(adiso);
  if (!date) return null;
  return (Date.now() - date.getTime()) / (1000 * 60 * 60);
}

export function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat('es-PE', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
}

type ViewSignalInput = Pick<Adiso, 'vistas' | 'fechaPublicacion' | 'horaPublicacion' | 'esHistorico' | 'fuenteOriginal'>;

export function isImportedHistoricAdiso(adiso: ViewSignalInput): boolean {
  if (adiso.esHistorico) return true;
  const fuente = adiso.fuenteOriginal?.toLowerCase() ?? '';
  return fuente.includes('rueda') || fuente.includes('import') || fuente.includes('pdf');
}

export function getViewSignal(adiso: ViewSignalInput): SocialSignal | null {
  if (isImportedHistoricAdiso(adiso)) return null;

  const views = Math.max(0, adiso.vistas || 0);
  const ageHours = getAgeInHours(adiso);
  if (views < 20 && ageHours !== null && ageHours <= 12) return null;
  if (views < 20) return null;

  if (views < 50) return { label: '20+ vistas', tone: 'neutral' };
  if (views < 100) return { label: '50+ vistas', tone: 'neutral' };
  if (views < 500) return { label: '100+ vistas', tone: 'positive' };
  if (views < 1000) return { label: '500+ vistas', tone: 'positive' };
  return { label: `${formatCompactNumber(views)} vistas`, tone: 'positive' };
}

export function getInterestSignal(contacts?: number): SocialSignal | null {
  const total = Math.max(0, contacts || 0);
  if (total <= 0) return null;
  if (total < 3) return { label: 'Interesados recientes', tone: 'neutral' };
  if (total < 10) return { label: 'Alta demanda', tone: 'positive' };
  return { label: `+${Math.floor(total / 10) * 10} interesados`, tone: 'positive' };
}

function getPopularSignal(adiso: Adiso): CardSignal | null {
  if (isImportedHistoricAdiso(adiso)) return null;
  const views = Math.max(0, adiso.vistas || 0);
  if (views >= 500) {
    return { type: 'popular', label: 'Muy popular', tone: 'highlight' };
  }
  if (views >= 100) {
    return { type: 'popular', label: 'Popular', tone: 'positive' };
  }
  const viewSignal = getViewSignal(adiso);
  if (viewSignal) {
    return { type: 'popular', label: 'Muy consultado', tone: 'neutral' };
  }
  return null;
}

function getNuevoSignal(adiso: Adiso): CardSignal | null {
  if (isImportedHistoricAdiso(adiso)) return null;
  const ageHours = getAgeInHours(adiso);
  if (ageHours === null) return null;
  if (ageHours <= 24) {
    return { type: 'nuevo', label: 'Recién publicado', tone: 'warm' };
  }
  if (ageHours <= 72) {
    return { type: 'nuevo', label: 'Nuevo en Buscadis', tone: 'neutral' };
  }
  return null;
}

function getCategorySignal(adiso: Adiso): CardSignal | null {
  const ageHours = getAgeInHours(adiso);
  const isFresh = ageHours !== null && ageHours <= 168;

  if (adiso.categoria === 'empleos' && isFresh && !isImportedHistoricAdiso(adiso)) {
    return { type: 'empleo_destacado', label: 'Oportunidad activa', tone: 'positive' };
  }

  if (adiso.categoria === 'inmuebles') {
    const hasPrice = Boolean(adiso.precio && adiso.precio > 0);
    if (hasPrice && (adiso.vistas ?? 0) >= 30) {
      return { type: 'inmueble_buscado', label: 'Muy buscado', tone: 'positive' };
    }
  }

  return null;
}

function getTrustSignals(adiso: Adiso): CardSignal | null {
  const v = adiso.vendedor;
  if (!v) return null;

  if (v.badges?.includes('respuesta_rapida')) {
    return { type: 'respuesta_rapida', label: 'Responde rápido', tone: 'trust' };
  }
  if (v.badges?.includes('vendedor_destacado')) {
    return { type: 'vendedor_top', label: 'Anunciante destacado', tone: 'highlight' };
  }
  if (v.esVerificado) {
    return { type: 'verificado', label: 'Verificado', tone: 'trust' };
  }
  return null;
}

function hasPhotos(adiso: Adiso): boolean {
  if (adiso.imagenUrl?.trim()) return true;
  return (adiso.imagenesUrls?.filter((u) => u?.trim()).length ?? 0) > 0;
}

/**
 * Una sola señal por card, priorizada (estilo Airbnb).
 * Se muestra junto al avatar del anunciante.
 */
export function pickCardSignal(adiso: Adiso): CardSignal | null {
  if (adiso.esDestacado) {
    return { type: 'destacado', label: 'Destacado', tone: 'highlight' };
  }

  const trust = getTrustSignals(adiso);
  if (trust) return trust;

  const interest = getInterestSignal(adiso.contactos);
  if (interest) {
    return { type: 'interes', label: interest.label, tone: interest.tone === 'positive' ? 'positive' : 'neutral' };
  }

  const popular = getPopularSignal(adiso);
  if (popular) return popular;

  const nuevo = getNuevoSignal(adiso);
  if (nuevo) return nuevo;

  const categoria = getCategorySignal(adiso);
  if (categoria) return categoria;

  // Importados antiguos: señales neutras de confianza/categoría, nunca edición ni fuente interna.
  if (isImportedHistoricAdiso(adiso)) {
    if (adiso.categoria === 'empleos') {
      return { type: 'empleo_destacado', label: 'Oportunidad disponible', tone: 'neutral' };
    }
    if (hasPhotos(adiso)) {
      return { type: 'con_fotos', label: 'Con fotos', tone: 'neutral' };
    }
    return null;
  }

  if (hasPhotos(adiso) && !isImportedHistoricAdiso(adiso)) {
    return { type: 'con_fotos', label: 'Con fotos', tone: 'neutral' };
  }

  return null;
}

export function getMarketplacePulse(adisos: Adiso[]): string | null {
  if (adisos.length === 0) return null;

  const activos = adisos.filter((a) => !isImportedHistoricAdiso(a));
  if (activos.length === 0) return null;

  const viewsTotal = activos.reduce((acc, adiso) => acc + (adiso.vistas || 0), 0);
  const withActivity = activos.filter((adiso) => getViewSignal(adiso) !== null).length;

  if (withActivity < 2) {
    return null;
  }

  const label =
    withActivity === 1
      ? '1 anuncio con actividad'
      : `${withActivity} anuncios con actividad`;

  return `${label} · ${formatCompactNumber(viewsTotal)} vistas`;
}

export function cardSignalClassName(tone: CardSignal['tone']): string {
  switch (tone) {
    case 'highlight':
      return 'bg-[var(--brand-yellow)] text-slate-900 border-[var(--brand-yellow)]/70';
    case 'positive':
      return 'bg-emerald-500/90 text-white border-emerald-400/40';
    case 'warm':
      return 'bg-orange-500/90 text-white border-orange-400/40';
    case 'trust':
      return 'bg-sky-500/90 text-white border-sky-400/40';
    case 'archive':
      return 'bg-slate-600/85 text-white border-slate-500/40';
    default:
      return 'bg-black/55 text-white border-white/20';
  }
}

import { Adiso } from '@/types';

type SignalTone = 'neutral' | 'positive' | 'highlight';

interface SocialSignal {
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

function isImportedHistoricAdiso(adiso: ViewSignalInput): boolean {
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
  if (total < 10) return { label: '+5 interesados', tone: 'positive' };
  return { label: `+${Math.floor(total / 10) * 10} interesados`, tone: 'positive' };
}

export function getMarketplacePulse(adisos: Adiso[]): string | null {
  if (adisos.length === 0) return null;

  const activos = adisos.filter((a) => !isImportedHistoricAdiso(a));
  if (activos.length === 0) return null;

  const viewsTotal = activos.reduce((acc, adiso) => acc + (adiso.vistas || 0), 0);
  const withActivity = activos.filter((adiso) => getViewSignal(adiso) !== null).length;

  if (withActivity === 0) {
    return null;
  }

  return `${withActivity} anuncios con actividad · ${formatCompactNumber(viewsTotal)} vistas en total`;
}

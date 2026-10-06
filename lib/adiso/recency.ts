import type { Adiso } from '@/types';

export function getPromotedBumpTimestamp(adiso: Adiso): number {
  if (!adiso.promotedAt) return 0;
  try {
    const t = new Date(adiso.promotedAt).getTime();
    return Number.isNaN(t) ? 0 : t;
  } catch {
    return 0;
  }
}

export function getPublishedTimestamp(adiso: Adiso): number {
  if (!adiso.fechaPublicacion) return 0;
  try {
    const raw = String(adiso.fechaPublicacion).trim();
    if (raw.includes('T') || raw.endsWith('Z')) {
      const iso = new Date(raw);
      if (!Number.isNaN(iso.getTime())) return iso.getTime();
    }

    let hora = (adiso.horaPublicacion || '00:00').trim();
    if (hora.length === 4) hora = `${hora.substring(0, 2)}:${hora.substring(2)}`;
    else if (hora.length >= 8) hora = hora.slice(0, 5);
    else if (hora.length !== 5) hora = '00:00';

    const date = new Date(`${raw}T${hora}:00`);
    return Number.isNaN(date.getTime()) ? 0 : date.getTime();
  } catch {
    return 0;
  }
}

/** Recencia “oficial”: publicación o último bump/promo pagado. */
export function getFeedRecencyAnchorMs(adiso: Adiso): number {
  return Math.max(getPublishedTimestamp(adiso), getPromotedBumpTimestamp(adiso));
}

import type { Adiso } from '@/types';

const ORGANIC_MAX_AGE_MS = 200 * 24 * 60 * 60 * 1000; // ~6.5 meses en feed orgánico

function publishedMs(adiso: Adiso): number {
  const raw = String(adiso.fechaPublicacion || '').trim();
  if (!raw) return 0;
  if (raw.includes('T') || raw.endsWith('Z')) {
    const t = new Date(raw).getTime();
    return Number.isNaN(t) ? 0 : t;
  }
  let hora = (adiso.horaPublicacion || '00:00').trim();
  if (hora.length === 4) hora = `${hora.slice(0, 2)}:${hora.slice(2)}`;
  else if (hora.length >= 8) hora = hora.slice(0, 5);
  const t = new Date(`${raw}T${hora}:00`).getTime();
  return Number.isNaN(t) ? 0 : t;
}

/** Destacado / premium vigente (pago). */
export function isActivePaidPromotion(adiso: Adiso): boolean {
  const tier = adiso.promotionTier;
  if (!tier || tier === 'gratis') return false;
  if ((adiso.promotionRank ?? 0) <= 0) return false;

  const expRaw = adiso.promotionExpiresAt;
  if (expRaw) {
    const exp = new Date(expRaw).getTime();
    if (!Number.isNaN(exp) && exp < Date.now()) return false;
  }

  return true;
}

/** ¿Debe aparecer en el feed principal del marketplace? */
export function isEligibleForMarketplaceFeed(adiso: Adiso): boolean {
  if (adiso.estaActivo === false) return false;
  if (isActivePaidPromotion(adiso)) return true;
  if (adiso.esHistorico) return false;

  const ts = publishedMs(adiso);
  if (ts <= 0) return true;
  return Date.now() - ts <= ORGANIC_MAX_AGE_MS;
}

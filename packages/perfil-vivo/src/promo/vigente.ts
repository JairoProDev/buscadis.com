import type { PromocionVigente } from '../types';

/** True si la promo aún puede mostrarse (sin venceEn = vigente hasta que el dueño la quite). */
export function esPromocionVigente(
  promo: PromocionVigente | null | undefined,
  nowMs: number = Date.now()
): promo is PromocionVigente {
  if (!promo) return false;
  if (!promo.venceEn) return true;
  const t = Date.parse(promo.venceEn);
  if (!Number.isFinite(t)) return true;
  return t > nowMs;
}

/** Null si venció — usar en bridge/demos antes de emitir PerfilPayload. */
export function promocionSiVigente(
  promo: PromocionVigente | null | undefined,
  nowMs: number = Date.now()
): PromocionVigente | null {
  return esPromocionVigente(promo, nowMs) ? promo : null;
}

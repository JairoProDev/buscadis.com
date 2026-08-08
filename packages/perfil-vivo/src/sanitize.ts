import type { PerfilPayload } from './types';
import { promocionSiVigente } from './promo/vigente';

/** Normaliza payload antes de render (promo vencida → ocultar módulo). */
export function sanitizePerfilPayload(
  payload: PerfilPayload,
  nowMs: number = Date.now()
): PerfilPayload {
  const promocion = promocionSiVigente(payload.promocion, nowMs);
  if (promocion === payload.promocion) return payload;
  return {
    ...payload,
    promocion,
    negocio: {
      ...payload.negocio,
      conteos: {
        ...payload.negocio.conteos,
        promociones: promocion ? 1 : 0,
      },
    },
  };
}

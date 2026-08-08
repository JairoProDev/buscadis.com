import type { PerfilPayload } from './types';
import { promocionSiVigente } from './promo/vigente';

/** Normaliza payload antes de render (promo vencida → ocultar módulo). */
export function sanitizePerfilPayload(
  payload: PerfilPayload,
  nowMs: number = Date.now()
): PerfilPayload {
  const promocion = promocionSiVigente(payload.promocion, nowMs);
  const productos = payload.productos.slice(0, 12);
  const resenas = payload.resenas.slice(0, 8);
  const faqs = payload.faqs.slice(0, 8);

const unchanged =
    promocion === payload.promocion &&
    productos.length === payload.productos.length &&
    resenas.length === payload.resenas.length &&
    faqs.length === payload.faqs.length;
  if (unchanged) return payload;

  return {
    ...payload,
    productos,
    resenas,
    faqs,
    promocion,
    totalProductos: Math.max(payload.totalProductos, productos.length),
    negocio: {
      ...payload.negocio,
      conteos: {
        ...payload.negocio.conteos,
        promociones: promocion ? 1 : 0,
        productos: payload.negocio.conteos?.productos ?? productos.length,
        resenas: payload.negocio.conteos?.resenas ?? resenas.length,
        faqs: payload.negocio.conteos?.faqs ?? faqs.length,
      },
    },
  };
}

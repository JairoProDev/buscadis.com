import { AudienceFunnel } from './audience-estimates';

/** One-line reach insight — no letter labels */
export function pickReachInsight(
  funnel: AudienceFunnel,
  ctx: { categoria?: string; subcategoria?: string; titulo?: string }
): string {
  if (funnel.E > 0 && ctx.titulo?.trim()) {
    return `${funnel.E.toLocaleString()} personas podrían estar interesadas en tu aviso ahora mismo.`;
  }
  if (funnel.D > 0 && ctx.subcategoria) {
    return `${funnel.D.toLocaleString()} personas buscan en esta subcategoría en nuestra red.`;
  }
  if (funnel.C > 0 && ctx.categoria) {
    return `${funnel.C.toLocaleString()} personas activas en esta categoría en todos nuestros canales.`;
  }
  if (funnel.B > 0) {
    return `${funnel.B.toLocaleString()} búsquedas registradas podrían coincidir con lo que publicas.`;
  }
  if (funnel.A > 0) {
    return `Tu aviso puede llegar a ${funnel.A.toLocaleString()} personas en marketplace, ADIS AI, redes y más.`;
  }
  return 'Completa tu aviso para ver el potencial de alcance.';
}

import { AudienceFunnel } from './audience-estimates';

/** One-line reach insight — no letter labels */
export function pickReachInsight(
  funnel: AudienceFunnel,
  ctx: { categoria?: string; subcategoria?: string; titulo?: string }
): string {
  const lines = getReachInsightLines(funnel, ctx);
  return lines[lines.length - 1] ?? 'Completa tu aviso para ver el potencial de alcance.';
}

/** Progressive reach lines for review step — no A/B/C labels */
export function getReachInsightLines(
  funnel: AudienceFunnel,
  ctx: { categoria?: string; subcategoria?: string; titulo?: string }
): string[] {
  const lines: string[] = [];

  if (funnel.A > 0) {
    lines.push(`${funnel.A.toLocaleString()} personas ven anuncios en todos nuestros canales.`);
  }
  if (funnel.B > 0) {
    lines.push(`${funnel.B.toLocaleString()} búsquedas registradas en marketplace y ADIS AI.`);
  }
  if (funnel.C > 0 && ctx.categoria) {
    lines.push(`${funnel.C.toLocaleString()} personas activas en esta categoría.`);
  }
  if (funnel.D > 0 && ctx.subcategoria) {
    lines.push(`${funnel.D.toLocaleString()} interesados en esta subcategoría.`);
  }
  if (funnel.E > 0 && ctx.titulo?.trim()) {
    lines.push(`${funnel.E.toLocaleString()} podrían estar interesados en tu aviso ahora mismo.`);
  }

  return lines;
}

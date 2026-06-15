/** Contexto de oportunidad/match para pre-rellenar chat y mostrar badge. */

export interface OpportunityContext {
  adisoId: string;
  adisoTitle?: string;
  matchScore?: number;
  initialMessage?: string;
}

const KEY = 'buscadis_opportunity_context';

export function saveOpportunityContext(ctx: OpportunityContext): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(KEY, JSON.stringify(ctx));
}

export function consumeOpportunityContext(adisoId?: string): OpportunityContext | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const ctx = JSON.parse(raw) as OpportunityContext;
    if (adisoId && ctx.adisoId !== adisoId) return null;
    sessionStorage.removeItem(KEY);
    return ctx;
  } catch {
    return null;
  }
}

export function peekOpportunityContext(adisoId?: string): OpportunityContext | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const ctx = JSON.parse(raw) as OpportunityContext;
    if (adisoId && ctx.adisoId !== adisoId) return null;
    return ctx;
  } catch {
    return null;
  }
}

export function buildMatchInitialMessage(title: string, matchScore?: number): string {
  const pct = matchScore != null ? Math.round(matchScore * 100) : null;
  if (pct && pct >= 50) {
    return `Hola, vi tu anuncio "${title}" y coincide ${pct}% con lo que busco. ¿Sigue disponible?`;
  }
  return `Hola, me interesa tu anuncio: ${title}. ¿Sigue disponible?`;
}

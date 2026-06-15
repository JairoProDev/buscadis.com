/** Intención de publicar lo que el usuario busca (demanda) */
export interface SeekPublishIntent {
  titulo: string;
  descripcion?: string;
  categoria?: string;
  ubicacion?: string;
  countryCode?: string;
}

const KEY = 'buscadis_seek_intent';

export function saveSeekIntent(intent: SeekPublishIntent): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(KEY, JSON.stringify(intent));
}

export function consumeSeekIntent(): SeekPublishIntent | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    sessionStorage.removeItem(KEY);
    return JSON.parse(raw) as SeekPublishIntent;
  } catch {
    return null;
  }
}

export function buildSeekTitle(query: string): string {
  const q = query.trim();
  if (!q) return 'Busco: [describe lo que necesitas]';
  const lower = q.toLowerCase();
  if (lower.startsWith('busco ') || lower.startsWith('necesito ')) return q;
  return `Busco: ${q}`;
}

export function buildSeekDescription(query: string, context?: string): string {
  const lines = [
    'Publico esto porque estoy buscando y aún no encuentro ofertas en Buscadis.',
    query.trim() ? `Detalle: ${query.trim()}` : '',
    context ? `Contexto: ${context}` : '',
    'Si tienes lo que busco, contáctame por este anuncio.',
  ].filter(Boolean);
  return lines.join('\n\n');
}

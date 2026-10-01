import type { Adiso } from '@/types';
import { adisoSearchableText } from './adiso-searchable-text';

/** Puntuación de relevancia textual (mayor = mejor). */
export function searchQueryRelevanceScore(adiso: Adiso, query: string): number {
  const q = query.trim().toLowerCase();
  if (!q) return 0;

  const text = adisoSearchableText(adiso);
  const title = (adiso.titulo || '').toLowerCase();

  if (title.includes(q)) return 1;
  if (text.includes(q)) return 0.85;

  const terms = q.split(/\s+/).filter((t) => t.length >= 2);
  if (terms.length === 0) return 0;

  const allInText = terms.every((t) => text.includes(t));
  if (allInText) return 0.7;

  const titleHits = terms.filter((t) => title.includes(t)).length;
  if (titleHits > 0) return 0.35 + (titleHits / terms.length) * 0.25;

  const textHits = terms.filter((t) => text.includes(t)).length;
  if (textHits > 0) return (textHits / terms.length) * 0.3;

  return 0;
}

export function adisoMatchesSearchQuery(adiso: Adiso, query: string): boolean {
  return searchQueryRelevanceScore(adiso, query) > 0;
}

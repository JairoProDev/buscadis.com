/**
 * IA suggestions for deal copy (Fase 2) — lightweight heuristics until full LLM wiring.
 */
export function suggestDealCopy(input: {
  title?: string;
  categoria?: string;
  priceDisplay?: number;
  discountPct?: number;
}): { title: string; caption: string; hashtags: string[] } {
  const cat = input.categoria || 'oferta';
  const discount = input.discountPct ? `-${input.discountPct}%` : '';
  const price = input.priceDisplay ? `S/ ${input.priceDisplay}` : '';

  const title =
    input.title ||
    [discount, cat, price].filter(Boolean).join(' · ') ||
    'Oferta imperdible';

  const caption = `No dejes pasar esta promo${price ? ` desde ${price}` : ''}. Escríbeme y te reservo el tuyo.`;

  const hashtags = [
    'deal',
    'oferta',
    cat.replace(/\s+/g, ''),
    'peru',
    'buscadis',
  ].filter(Boolean);

  return { title: title.slice(0, 120), caption: caption.slice(0, 500), hashtags };
}

import { Adiso } from '@/types';
import type { UserInterestProfile } from '@/lib/interactions';
import { personalizationFreshnessBoostMs } from '@/lib/ai/personalization';

export interface ScoredAdiso {
  adiso: Adiso;
  score: number;
  hybrid_score?: number;
  rerank_score?: number;
}

function parseDate(adiso: Adiso): number {
  if (!adiso.fechaPublicacion) return 0;
  try {
    const hora = adiso.horaPublicacion?.length === 5 ? adiso.horaPublicacion : '00:00';
    return new Date(`${adiso.fechaPublicacion}T${hora}:00`).getTime();
  } catch {
    return 0;
  }
}

function freshnessBoost(adiso: Adiso): number {
  const ts = parseDate(adiso);
  if (!ts) return 0;
  const days = (Date.now() - ts) / (1000 * 60 * 60 * 24);
  if (days <= 1) return 0.2;
  if (days <= 7) return 0.12;
  if (days <= 30) return 0.05;
  return 0;
}

function interestBoost(adiso: Adiso, profile: UserInterestProfile | null | undefined): number {
  if (!profile) return 0;
  let boost = 0;
  const catSignal = profile.categoriaSignals?.[adiso.categoria];
  if (catSignal) {
    boost += Math.min(0.15, catSignal * 0.05);
  }
  const keywords = Object.keys(profile.keywordSignals ?? {});
  const text = `${adiso.titulo} ${adiso.descripcion}`.toLowerCase();
  for (const kw of keywords) {
    if (kw && text.includes(kw.toLowerCase())) boost += 0.03;
  }
  return Math.min(boost, 0.25);
}

function promotionBoost(adiso: Adiso): number {
  const tier = adiso.promotionTier;
  if (tier === 'premium') return 0.15;
  if (tier === 'destacada') return 0.08;
  return 0;
}

export function rerankSearchResults(
  items: ScoredAdiso[],
  options?: {
    interestProfile?: UserInterestProfile | null;
    inferredCategory?: string;
  },
): ScoredAdiso[] {
  const { interestProfile, inferredCategory } = options ?? {};

  return [...items]
    .map((item) => {
      const base = item.rerank_score ?? item.hybrid_score ?? item.score ?? 0;
      const fresh = freshnessBoost(item.adiso);
      const interest = interestBoost(item.adiso, interestProfile);
      const promo = promotionBoost(item.adiso);
      const categoryMatch =
        inferredCategory && item.adiso.categoria === inferredCategory ? 0.1 : 0;
      const recencyPersonal = personalizationFreshnessBoostMs(item.adiso, interestProfile ?? null) / 1e12;

      const finalScore = base + fresh + interest + promo + categoryMatch + recencyPersonal;
      return { ...item, rerank_score: finalScore, score: finalScore };
    })
    .sort((a, b) => (b.rerank_score ?? 0) - (a.rerank_score ?? 0));
}

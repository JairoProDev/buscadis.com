/**
 * P6 — Prioridad Pro/Max en listados de negocios (search / discovery).
 */
import { subscriptionRankingBoost } from '@/lib/business/commerce';

export type RankableBusiness = {
  id: string;
  subscription_tier?: string | null;
  view_count?: number | null;
  name?: string;
  score?: number;
};

/** Ordena negocios: Pro/Max primero (boost), luego engagement. */
export function rankBusinessesForDiscovery<T extends RankableBusiness>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const sa =
      (a.score ?? 0) +
      subscriptionRankingBoost(a.subscription_tier) +
      Math.min(0.05, (a.view_count ?? 0) / 10000);
    const sb =
      (b.score ?? 0) +
      subscriptionRankingBoost(b.subscription_tier) +
      Math.min(0.05, (b.view_count ?? 0) / 10000);
    return sb - sa;
  });
}

export function applySubscriptionBoostToScore(
  baseScore: number,
  subscriptionTier?: string | null
): number {
  return baseScore + subscriptionRankingBoost(subscriptionTier);
}

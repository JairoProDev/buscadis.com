import { DealClip, Categoria } from '@/types';
import { UserInterestProfile } from '@/lib/interactions';
import { DEAL_TIER_ORDER } from '@/lib/deals/config';

export interface DealRankingContext {
  seenClipIds: Set<string>;
  likedClipIds?: Set<string>;
  interestProfile?: UserInterestProfile | null;
  hiddenSellerIds?: Set<string>;
  followingIds?: Set<string>;
  userLat?: number;
  userLng?: number;
  tab?: 'for_you' | 'nearby' | 'following';
}

function interestBoost(clip: DealClip, profile?: UserInterestProfile | null): number {
  if (!profile) return 0;
  let boost = 0;
  if (clip.categoria && profile.categoriaSignals[clip.categoria]) {
    boost += profile.categoriaSignals[clip.categoria] * 2;
  }
  const text = `${clip.title} ${clip.caption || ''}`.toLowerCase();
  for (const [kw, score] of Object.entries(profile.keywordSignals || {})) {
    if (text.includes(kw.toLowerCase())) boost += score;
  }
  return boost;
}

function conversionBoost(clip: DealClip): number {
  if (clip.view_count <= 0) return 0;
  const ctr = clip.cta_click_count / clip.view_count;
  return Math.min(200, ctr * 500);
}

export function scoreDealClip(clip: DealClip, ctx: DealRankingContext): number {
  let score = (3 - DEAL_TIER_ORDER[clip.promotion_tier]) * 1000;

  if (!ctx.seenClipIds.has(clip.id)) score += 400;

  score += interestBoost(clip, ctx.interestProfile);
  score += conversionBoost(clip);

  if (ctx.followingIds?.has(clip.author_user_id)) score += 600;

  if (ctx.hiddenSellerIds?.has(clip.author_user_id)) score -= 2000;

  if (clip.report_count >= 3) score -= 1500;

  const ageMs = Date.now() - new Date(clip.created_at).getTime();
  score += Math.max(0, 200 - ageMs / (60 * 60 * 1000));

  if (clip.deal_expires_at) {
    const expiresMs = new Date(clip.deal_expires_at).getTime() - Date.now();
    if (expiresMs > 0 && expiresMs < 24 * 60 * 60 * 1000) score += 100;
  }

  if (clip.discount_pct && clip.discount_pct >= 30) score += 80;

  return score;
}

export function rankDealClips(clips: DealClip[], ctx: DealRankingContext): DealClip[] {
  const scored = clips
    .map((c) => ({ ...c, relevanceScore: scoreDealClip(c, ctx) }))
    .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));

  return diversifyFeed(scored);
}

/** Max 2 consecutive clips from same author; inject fresh every 5 */
function diversifyFeed(clips: DealClip[]): DealClip[] {
  const result: DealClip[] = [];
  const rest = [...clips];
  let lastAuthor: string | null = null;
  let streak = 0;

  while (rest.length > 0) {
    let pickIdx = 0;
    if (lastAuthor && streak >= 2) {
      pickIdx = rest.findIndex((c) => c.author_user_id !== lastAuthor);
      if (pickIdx < 0) pickIdx = 0;
    }

    if (result.length > 0 && result.length % 5 === 0) {
      const freshIdx = rest.findIndex((c) => {
        const ageH = (Date.now() - new Date(c.created_at).getTime()) / 3600000;
        return ageH < 2;
      });
      if (freshIdx >= 0) pickIdx = freshIdx;
    }

    const [picked] = rest.splice(pickIdx, 1);
    if (!picked) break;

    if (picked.author_user_id === lastAuthor) streak++;
    else {
      lastAuthor = picked.author_user_id;
      streak = 1;
    }
    result.push(picked);
  }

  return result;
}

export function filterByTab(
  clips: DealClip[],
  tab: DealRankingContext['tab'],
  followingIds?: Set<string>
): DealClip[] {
  if (tab === 'following' && followingIds?.size) {
    return clips.filter((c) => followingIds.has(c.author_user_id));
  }
  return clips;
}

export function filterByCategoria(clips: DealClip[], categoria?: Categoria | 'todos'): DealClip[] {
  if (!categoria || categoria === 'todos') return clips;
  return clips.filter((c) => c.categoria === categoria);
}

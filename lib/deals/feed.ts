import { DealClip, DealFeedTab } from '@/types';
import { getUserInterestProfile } from '@/lib/interactions';
import { rankDealClips, filterByTab, DealRankingContext } from '@/lib/deals/ranking';
import {
  getActiveDealClipsServer,
  getFollowingIds,
  getUserDealEngagement,
} from '@/lib/deals/server';
import { DEAL_FEED_PAGE_SIZE } from '@/lib/deals/config';

export interface DealFeedParams {
  tab?: DealFeedTab;
  cursor?: string;
  userId?: string;
  sessionId?: string;
  categoria?: string;
  clipId?: string;
}

export async function buildDealFeed(params: DealFeedParams): Promise<{
  clips: DealClip[];
  nextCursor?: string;
  liveCount?: number;
}> {
  if (params.clipId) {
    const { getDealClipByIdServer } = await import('@/lib/deals/server');
    const clip = await getDealClipByIdServer(params.clipId);
    if (clip) {
      return { clips: [{ ...clip, relevanceScore: 9999 }] };
    }
  }

  const { clips: raw, nextCursor } = await getActiveDealClipsServer({
    limit: DEAL_FEED_PAGE_SIZE * 3,
    cursor: params.cursor,
    categoria: params.categoria,
  });

  const interestProfile = params.userId
    ? await getUserInterestProfile(params.userId)
    : null;

  const followingIds = params.userId ? await getFollowingIds(params.userId) : new Set<string>();

  const ctx: DealRankingContext = {
    seenClipIds: new Set(),
    interestProfile,
    followingIds,
    tab: params.tab || 'for_you',
  };

  let filtered = filterByTab(raw, ctx.tab, followingIds);
  if (filtered.length === 0 && ctx.tab === 'following') {
    filtered = raw;
  }

  let ranked = rankDealClips(filtered, ctx).slice(0, DEAL_FEED_PAGE_SIZE);

  if (params.userId && ranked.length) {
    const engagement = await getUserDealEngagement(
      params.userId,
      ranked.map((c) => c.id)
    );
    ranked = ranked.map((c) => ({
      ...c,
      liked: engagement.liked.has(c.id),
      saved: engagement.saved.has(c.id),
      following: followingIds.has(c.author_user_id),
    }));
  }

  return { clips: ranked, nextCursor };
}

import { supabaseAdmin } from '@/lib/supabase-admin';
import {
  DealClip,
  DealClipStatus,
  DealCtaType,
  DealMediaType,
  DealPromotionTier,
  DealClipSource,
  Categoria,
  DealLiveSession,
} from '@/types';
import { dealVisibleUntilIso } from '@/lib/deals/config';
import { defaultPosterUrl } from '@/lib/media/upload';

function dbToDealClip(row: Record<string, unknown>): DealClip {
  return {
    id: row.id as string,
    author_user_id: row.author_user_id as string,
    business_profile_id: (row.business_profile_id as string) || undefined,
    adiso_id: (row.adiso_id as string) || undefined,
    media_url: row.media_url as string,
    media_type: row.media_type as DealMediaType,
    poster_url: (row.poster_url as string) || undefined,
    duration_sec: row.duration_sec != null ? Number(row.duration_sec) : undefined,
    aspect_ratio: (row.aspect_ratio as string) || '9:16',
    title: row.title as string,
    caption: (row.caption as string) || undefined,
    categoria: (row.categoria as Categoria) || undefined,
    hashtags: (row.hashtags as string[]) || [],
    price_display: row.price_display != null ? Number(row.price_display) : undefined,
    price_original: row.price_original != null ? Number(row.price_original) : undefined,
    currency: (row.currency as string) || 'PEN',
    discount_pct: row.discount_pct != null ? Number(row.discount_pct) : undefined,
    deal_expires_at: (row.deal_expires_at as string) || undefined,
    stock_hint: (row.stock_hint as string) || undefined,
    cta_type: (row.cta_type as DealCtaType) || 'adiso',
    cta_url: (row.cta_url as string) || undefined,
    status: (row.status as DealClipStatus) || 'active',
    promotion_tier: (row.promotion_tier as DealPromotionTier) || 'gratis',
    visible_until: (row.visible_until as string) || undefined,
    source: (row.source as DealClipSource) || 'manual',
    view_count: (row.view_count as number) || 0,
    like_count: (row.like_count as number) || 0,
    save_count: (row.save_count as number) || 0,
    share_count: (row.share_count as number) || 0,
    cta_click_count: (row.cta_click_count as number) || 0,
    report_count: (row.report_count as number) || 0,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    challenge_id: (row.challenge_id as string) || undefined,
    author: row.author as DealClip['author'],
    business: row.business as DealClip['business'],
  };
}

export interface CreateDealClipParams {
  mediaUrl: string;
  mediaType: DealMediaType;
  posterUrl?: string;
  durationSec?: number;
  title: string;
  caption?: string;
  categoria?: string;
  hashtags?: string[];
  adisoId?: string;
  businessProfileId?: string;
  priceDisplay?: number;
  priceOriginal?: number;
  currency?: string;
  discountPct?: number;
  dealExpiresAt?: string;
  stockHint?: string;
  ctaType?: DealCtaType;
  ctaUrl?: string;
  promotionTier?: DealPromotionTier;
  source?: DealClipSource;
  status?: DealClipStatus;
  challengeId?: string;
}

export async function createDealClipServer(
  userId: string,
  params: CreateDealClipParams
): Promise<DealClip> {
  const tier = params.promotionTier || 'gratis';
  const visibleUntil = dealVisibleUntilIso(tier);

  const { data, error } = await supabaseAdmin
    .from('deal_clips')
    .insert({
      author_user_id: userId,
      business_profile_id: params.businessProfileId || null,
      adiso_id: params.adisoId || null,
      media_url: params.mediaUrl,
      media_type: params.mediaType,
      poster_url: params.posterUrl || defaultPosterUrl(params.mediaUrl, params.mediaType),
      duration_sec: params.durationSec || null,
      title: params.title.slice(0, 120),
      caption: params.caption?.slice(0, 500) || null,
      categoria: params.categoria || null,
      hashtags: params.hashtags || [],
      price_display: params.priceDisplay ?? null,
      price_original: params.priceOriginal ?? null,
      currency: params.currency || 'PEN',
      discount_pct: params.discountPct ?? null,
      deal_expires_at: params.dealExpiresAt || null,
      stock_hint: params.stockHint || null,
      cta_type: params.ctaType || 'adiso',
      cta_url: params.ctaUrl || null,
      promotion_tier: tier,
      visible_until: visibleUntil,
      source: params.source || 'manual',
      status: params.status || (tier === 'gratis' ? 'active' : 'draft'),
      challenge_id: params.challengeId || null,
    })
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(error?.message || 'No se pudo crear el deal clip');
  }

  return dbToDealClip(data as Record<string, unknown>);
}

async function enrichClips(rows: Record<string, unknown>[]): Promise<DealClip[]> {
  if (rows.length === 0) return [];

  const userIds = Array.from(new Set(rows.map((r) => r.author_user_id as string)));
  const businessIds = Array.from(
    new Set(rows.map((r) => r.business_profile_id as string).filter(Boolean))
  );

  const profiles = new Map<string, { nombre: string; avatarUrl?: string }>();
  const handles = new Map<string, string>();
  const businesses = new Map<string, { id: string; name: string; slug?: string; logoUrl?: string }>();

  if (userIds.length) {
    const { data: profs } = await supabaseAdmin
      .from('profiles')
      .select('id, nombre, avatar_url')
      .in('id', userIds);
    (profs || []).forEach((p: { id: string; nombre: string; avatar_url?: string }) => {
      profiles.set(p.id, { nombre: p.nombre || 'Usuario', avatarUrl: p.avatar_url || undefined });
    });

    const { data: creators } = await supabaseAdmin
      .from('creator_profiles')
      .select('user_id, handle, is_verified')
      .in('user_id', userIds);
    (creators || []).forEach((c: { user_id: string; handle: string; is_verified: boolean }) => {
      handles.set(c.user_id, c.handle);
    });
  }

  if (businessIds.length) {
    const { data: biz } = await supabaseAdmin
      .from('business_profiles')
      .select('id, name, slug, logo_url')
      .in('id', businessIds);
    (biz || []).forEach(
      (b: { id: string; name: string; slug?: string; logo_url?: string }) => {
        businesses.set(b.id, {
          id: b.id,
          name: b.name,
          slug: b.slug,
          logoUrl: b.logo_url,
        });
      }
    );
  }

  return rows.map((row) => {
    const authorId = row.author_user_id as string;
    const prof = profiles.get(authorId);
    const bizId = row.business_profile_id as string | undefined;
    return dbToDealClip({
      ...row,
      author: prof
        ? {
            id: authorId,
            nombre: prof.nombre,
            avatarUrl: prof.avatarUrl,
            handle: handles.get(authorId),
          }
        : undefined,
      business: bizId ? businesses.get(bizId) : undefined,
    });
  });
}

export async function getActiveDealClipsServer(params?: {
  limit?: number;
  cursor?: string;
  authorId?: string;
  categoria?: string;
}): Promise<{ clips: DealClip[]; nextCursor?: string }> {
  let query = supabaseAdmin
    .from('deal_clips')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (params?.categoria && params.categoria !== 'todos') {
    query = query.eq('categoria', params.categoria);
  }
  if (params?.authorId) {
    query = query.eq('author_user_id', params.authorId);
  }
  if (params?.cursor) {
    query = query.lt('created_at', params.cursor);
  }

  const limit = params?.limit || 20;
  query = query.limit(limit + 1);

  const { data, error } = await query;
  if (error || !data) return { clips: [] };

  const hasMore = data.length > limit;
  const slice = hasMore ? data.slice(0, limit) : data;
  const clips = await enrichClips(slice as Record<string, unknown>[]);
  const nextCursor = hasMore ? clips[clips.length - 1]?.created_at : undefined;

  return { clips, nextCursor };
}

export async function getDealClipByIdServer(id: string): Promise<DealClip | null> {
  const { data, error } = await supabaseAdmin
    .from('deal_clips')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error || !data) return null;
  const [clip] = await enrichClips([data as Record<string, unknown>]);
  return clip || null;
}

export async function registerDealViewServer(
  clipId: string,
  opts: { userId?: string; sessionId?: string; watchTimeMs?: number }
): Promise<void> {
  await supabaseAdmin.rpc('fn_register_deal_clip_view', {
    p_clip_id: clipId,
    p_user_id: opts.userId || null,
    p_session_id: opts.sessionId || null,
    p_watch_time_ms: opts.watchTimeMs || 0,
  });
}

export async function toggleDealLikeServer(userId: string, clipId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin.rpc('fn_toggle_deal_clip_like', {
    p_clip_id: clipId,
    p_user_id: userId,
  });
  if (error) throw new Error(error.message);
  return Boolean(data);
}

export async function toggleDealSaveServer(userId: string, clipId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin.rpc('fn_toggle_deal_clip_save', {
    p_clip_id: clipId,
    p_user_id: userId,
  });
  if (error) throw new Error(error.message);
  return Boolean(data);
}

export async function recordDealInteractionServer(
  clipId: string,
  interactionType: string,
  opts?: { userId?: string; sessionId?: string; metadata?: Record<string, unknown> }
): Promise<void> {
  await supabaseAdmin.from('deal_clip_interactions').insert({
    clip_id: clipId,
    user_id: opts?.userId || null,
    session_id: opts?.sessionId || null,
    interaction_type: interactionType,
    metadata: opts?.metadata || {},
  });
}

export async function incrementDealCounter(
  clipId: string,
  field: 'share_count' | 'cta_click_count' | 'report_count'
): Promise<void> {
  const { data: row } = await supabaseAdmin
    .from('deal_clips')
    .select(field)
    .eq('id', clipId)
    .single();

  if (!row) return;
  const current = (row as Record<string, number>)[field] || 0;
  await supabaseAdmin.from('deal_clips').update({ [field]: current + 1 }).eq('id', clipId);
}

export async function getUserDealEngagement(
  userId: string,
  clipIds: string[]
): Promise<{ liked: Set<string>; saved: Set<string> }> {
  if (!clipIds.length) return { liked: new Set(), saved: new Set() };

  const [{ data: likes }, { data: saves }] = await Promise.all([
    supabaseAdmin.from('deal_clip_likes').select('clip_id').eq('user_id', userId).in('clip_id', clipIds),
    supabaseAdmin.from('deal_clip_saves').select('clip_id').eq('user_id', userId).in('clip_id', clipIds),
  ]);

  return {
    liked: new Set((likes || []).map((r: { clip_id: string }) => r.clip_id)),
    saved: new Set((saves || []).map((r: { clip_id: string }) => r.clip_id)),
  };
}

export async function getFollowingIds(userId: string): Promise<Set<string>> {
  const { data } = await supabaseAdmin
    .from('creator_follows')
    .select('creator_id')
    .eq('follower_id', userId);

  return new Set((data || []).map((r: { creator_id: string }) => r.creator_id));
}

export async function toggleFollowCreator(
  followerId: string,
  creatorId: string
): Promise<boolean> {
  const { data: existing } = await supabaseAdmin
    .from('creator_follows')
    .select('creator_id')
    .eq('follower_id', followerId)
    .eq('creator_id', creatorId)
    .maybeSingle();

  if (existing) {
    await supabaseAdmin
      .from('creator_follows')
      .delete()
      .eq('follower_id', followerId)
      .eq('creator_id', creatorId);
    return false;
  }

  await supabaseAdmin.from('creator_follows').insert({
    follower_id: followerId,
    creator_id: creatorId,
  });
  return true;
}

export async function getDealCommentsServer(clipId: string) {
  const { data, error } = await supabaseAdmin
    .from('deal_clip_comments')
    .select('*')
    .eq('clip_id', clipId)
    .order('created_at', { ascending: true })
    .limit(100);

  if (error || !data) return [];

  const userIds = Array.from(new Set(data.map((c) => c.user_id)));
  const profiles = new Map<string, { nombre: string; avatarUrl?: string }>();

  if (userIds.length) {
    const { data: profs } = await supabaseAdmin
      .from('profiles')
      .select('id, nombre, avatar_url')
      .in('id', userIds);
    (profs || []).forEach((p: { id: string; nombre: string; avatar_url?: string }) => {
      profiles.set(p.id, { nombre: p.nombre, avatarUrl: p.avatar_url });
    });
  }

  return data.map((c) => ({
    ...c,
    author: profiles.get(c.user_id),
  }));
}

export async function addDealCommentServer(
  userId: string,
  clipId: string,
  body: string,
  parentId?: string
) {
  const { data, error } = await supabaseAdmin
    .from('deal_clip_comments')
    .insert({
      clip_id: clipId,
      user_id: userId,
      body: body.trim().slice(0, 500),
      parent_id: parentId || null,
    })
    .select('*')
    .single();

  if (error || !data) throw new Error(error?.message || 'No se pudo comentar');
  return data;
}

export async function getLiveSessionsServer(): Promise<DealLiveSession[]> {
  const { data } = await supabaseAdmin
    .from('deal_live_sessions')
    .select('*')
    .eq('status', 'live')
    .order('started_at', { ascending: false })
    .limit(10);

  return (data || []) as DealLiveSession[];
}

export { dbToDealClip };

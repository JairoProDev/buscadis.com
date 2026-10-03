import { supabase } from './supabase';
import { ADISO_IMAGES_BUCKET_FALLBACKS } from './storage-buckets';
import {
  Story,
  StoryGroup,
  StoryMediaType,
  StoryPromotionTier,
  StoryObjective,
  StoryStatus,
  StorySource,
  StoryInteractionType,
} from '@/types';
import { STORY_TIER_ORDER } from '@/lib/stories/config';
import { rankStoryGroups, StoryRankingContext } from '@/lib/stories/ranking';
import { UserInterestProfile } from '@/lib/interactions';

const SEEN_STORIES_KEY = 'seen_stories';

function dbToStory(row: Record<string, unknown>, vendedor?: { nombre: string; avatarUrl?: string }): Story {
  return {
    id: row.id as string,
    user_id: row.user_id as string,
    media_url: row.media_url as string,
    media_type: row.media_type as StoryMediaType,
    caption: (row.caption as string) || undefined,
    categoria: (row.categoria as Story['categoria']) || undefined,
    adiso_id: (row.adiso_id as string) || undefined,
    promotion_tier: (row.promotion_tier as StoryPromotionTier) || 'gratis',
    view_count: (row.view_count as number) || 0,
    created_at: row.created_at as string,
    expires_at: row.expires_at as string,
    visible_until: (row.visible_until as string) || (row.expires_at as string),
    status: (row.status as StoryStatus) || 'active',
    archived_at: (row.archived_at as string) || undefined,
    source: (row.source as StorySource) || 'manual',
    objective: (row.objective as StoryObjective) || 'contactos',
    cta_url: (row.cta_url as string) || undefined,
    sort_order: typeof row.sort_order === 'number' ? row.sort_order : 0,
    vendedor,
  };
}

export async function getActiveStories(params?: {
  categoria?: string;
  token?: string;
}): Promise<Story[]> {
  try {
    const qs = params?.categoria && params.categoria !== 'todos'
      ? `?categoria=${encodeURIComponent(params.categoria)}`
      : '';
    const headers: HeadersInit = {};
    if (params?.token) headers.Authorization = `Bearer ${params.token}`;

    const res = await fetch(`/api/stories${qs}`, { headers, cache: 'no-store' });
    if (res.ok) {
      const data = (await res.json()) as { stories?: Story[] };
      return data.stories || [];
    }
  } catch {
    // fallback client
  }

  if (!supabase) return [];

  let query = supabase
    .from('stories')
    .select('*')
    .eq('status', 'active')
    .gt('visible_until', new Date().toISOString())
    .order('created_at', { ascending: false });

  if (params?.categoria && params.categoria !== 'todos') {
    query = query.eq('categoria', params.categoria);
  }

  const { data, error } = await query;
  if (error || !data) return [];

  const userIds = Array.from(new Set(data.map((row) => row.user_id)));
  const perfiles = new Map<string, { nombre: string; avatarUrl?: string }>();

  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, nombre, avatar_url')
      .in('id', userIds);

    (profiles || []).forEach((p: { id: string; nombre: string; avatar_url?: string }) => {
      perfiles.set(p.id, { nombre: p.nombre || 'Usuario', avatarUrl: p.avatar_url || undefined });
    });
  }

  return data.map((row) => dbToStory(row, perfiles.get(row.user_id)));
}

export async function getServerSeenStoryIds(userId: string): Promise<Set<string>> {
  if (!supabase) return new Set();
  const { data } = await supabase
    .from('story_views')
    .select('story_id')
    .eq('user_id', userId);

  return new Set((data || []).map((r: { story_id: string }) => r.story_id));
}

export function groupStoriesByUser(
  stories: Story[],
  seenIds: Set<string>,
  rankingCtx?: Partial<StoryRankingContext>
): StoryGroup[] {
  const groups = new Map<string, StoryGroup>();

  for (const story of stories) {
    let group = groups.get(story.user_id);
    if (!group) {
      group = {
        userId: story.user_id,
        vendedor: story.vendedor,
        stories: [],
        hasUnseen: false,
        topTier: story.promotion_tier,
      };
      groups.set(story.user_id, group);
    }
    group.stories.push(story);
    if (!seenIds.has(story.id)) group.hasUnseen = true;
    if (STORY_TIER_ORDER[story.promotion_tier] < STORY_TIER_ORDER[group.topTier]) {
      group.topTier = story.promotion_tier;
    }
  }

  for (const group of groups.values()) {
    group.stories.sort((a, b) => {
      const orderA = a.sort_order ?? 0;
      const orderB = b.sort_order ?? 0;
      if (orderA !== orderB) return orderA - orderB;
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });
  }

  const baseGroups = Array.from(groups.values());
  if (!rankingCtx) {
    return baseGroups.sort((a, b) => {
      const tierDiff = STORY_TIER_ORDER[a.topTier] - STORY_TIER_ORDER[b.topTier];
      if (tierDiff !== 0) return tierDiff;
      if (a.hasUnseen !== b.hasUnseen) return a.hasUnseen ? -1 : 1;
      return new Date(b.stories[0].created_at).getTime() - new Date(a.stories[0].created_at).getTime();
    });
  }

  const ctx: StoryRankingContext = {
    seenStoryIds: seenIds,
    serverSeenStoryIds: rankingCtx.serverSeenStoryIds,
    interestProfile: rankingCtx.interestProfile,
    favoriteAdisoIds: rankingCtx.favoriteAdisoIds,
    hiddenSellerIds: rankingCtx.hiddenSellerIds,
  };

  return rankStoryGroups(baseGroups, ctx);
}

export function getSeenStoryIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    return new Set(JSON.parse(localStorage.getItem(SEEN_STORIES_KEY) || '[]'));
  } catch {
    return new Set();
  }
}

export function markStorySeen(storyId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const seen = getSeenStoryIds();
    seen.add(storyId);
    localStorage.setItem(SEEN_STORIES_KEY, JSON.stringify(Array.from(seen)));
  } catch (e) {
    console.error('Error guardando historias vistas:', e);
  }
}

export async function uploadStoryMedia(
  file: File,
  userId: string
): Promise<{ url: string; mediaType: StoryMediaType } | null> {
  if (!supabase) return null;

  const mediaType: StoryMediaType = file.type.startsWith('video/') ? 'video' : 'image';
  const fileExt = file.name.split('.').pop() || (mediaType === 'video' ? 'mp4' : 'jpg');
  const fileName = `${userId}/stories/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${fileExt}`;

  for (const bucketName of ADISO_IMAGES_BUCKET_FALLBACKS) {
    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(fileName, file, { cacheControl: '3600', upsert: false });

    if (!uploadError) {
      const { data } = supabase.storage.from(bucketName).getPublicUrl(fileName);
      return { url: data.publicUrl, mediaType };
    }
  }

  return null;
}

export async function registerStoryView(storyId: string, userId: string): Promise<void> {
  if (!supabase) return;

  const { error } = await supabase.rpc('fn_register_story_view', {
    p_story_id: storyId,
    p_user_id: userId,
  });

  if (error) console.error('Error al registrar vista de historia:', error);
}

export async function recordStoryInteraction(
  storyId: string,
  type: StoryInteractionType,
  token?: string,
  options?: { toggleFavorite?: boolean }
): Promise<{ favorited?: boolean } | void> {
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`/api/stories/${storyId}/interact`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ type, toggleFavorite: options?.toggleFavorite }),
  });

  if (res.ok) {
    return (await res.json()) as { favorited?: boolean };
  }
}

export async function deleteStory(storyId: string, userId: string, token?: string): Promise<void> {
  if (token) {
    await fetch(`/api/stories/${storyId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    return;
  }

  if (!supabase) return;
  await supabase.from('stories').delete().eq('id', storyId).eq('user_id', userId);
}

export type { UserInterestProfile };

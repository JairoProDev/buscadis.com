import { supabaseAdmin } from '@/lib/supabase-admin';
import { uploadMediaServer as uploadSharedMedia } from '@/lib/media/upload';
import {
  Story,
  StoryMediaType,
  StoryPromotionTier,
  StoryObjective,
  StorySource,
  StoryStatus,
  StoryInteractionType,
  StoryMetrics,
  Categoria,
} from '@/types';
import {
  DEFAULT_STORY_OBJECTIVE,
  DEFAULT_STORY_SOURCE,
  DEFAULT_STORY_STATUS,
  storyVisibleUntilIso,
} from '@/lib/stories/config';

function dbToStory(row: Record<string, unknown>): Story {
  return {
    id: row.id as string,
    user_id: row.user_id as string,
    media_url: row.media_url as string,
    media_type: row.media_type as StoryMediaType,
    caption: (row.caption as string) || undefined,
    categoria: (row.categoria as Categoria) || undefined,
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
  };
}

export async function uploadStoryMediaServer(
  file: File,
  userId: string
): Promise<{ url: string; mediaType: StoryMediaType }> {
  const result = await uploadSharedMedia(file, userId, 'stories');
  return { url: result.url, mediaType: result.mediaType };
}

export interface CreateStoryParams {
  mediaUrl: string;
  mediaType: StoryMediaType;
  caption?: string;
  categoria?: string;
  adisoId?: string;
  promotionTier?: StoryPromotionTier;
  objective?: StoryObjective;
  source?: StorySource;
  ctaUrl?: string;
  status?: StoryStatus;
}

export async function createStoryServer(
  userId: string,
  params: CreateStoryParams
): Promise<Story> {
  const tier = params.promotionTier || 'gratis';
  const visibleUntil = storyVisibleUntilIso(tier);

  const { data, error } = await supabaseAdmin
    .from('stories')
    .insert({
      user_id: userId,
      media_url: params.mediaUrl,
      media_type: params.mediaType,
      caption: params.caption || null,
      categoria: params.categoria || null,
      adiso_id: params.adisoId || null,
      promotion_tier: tier,
      objective: params.objective || DEFAULT_STORY_OBJECTIVE,
      source: params.source || DEFAULT_STORY_SOURCE,
      cta_url: params.ctaUrl || null,
      status: params.status || DEFAULT_STORY_STATUS,
      visible_until: visibleUntil,
      expires_at: visibleUntil,
    })
    .select('*')
    .single();

  if (error || !data) {
    const msg = error?.message || 'unknown';
    if (msg.includes('relation') && msg.includes('stories')) {
      throw new Error(
        'La tabla stories no existe. Aplica las migraciones 010, 013 y 014 en Supabase.'
      );
    }
    throw new Error(error?.message || 'No se pudo crear la historia');
  }

  return dbToStory(data as Record<string, unknown>);
}

export async function reactivateStoryServer(
  userId: string,
  storyId: string,
  tier: StoryPromotionTier
): Promise<Story> {
  const visibleUntil = storyVisibleUntilIso(tier);

  const { data, error } = await supabaseAdmin
    .from('stories')
    .update({
      promotion_tier: tier,
      status: 'active',
      visible_until: visibleUntil,
      expires_at: visibleUntil,
      archived_at: null,
    })
    .eq('id', storyId)
    .eq('user_id', userId)
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(error?.message || 'No se pudo reactivar la historia');
  }

  return dbToStory(data as Record<string, unknown>);
}

export async function getActiveStoriesServer(params?: {
  categoria?: string;
  limit?: number;
}): Promise<Story[]> {
  let query = supabaseAdmin
    .from('stories')
    .select('*')
    .eq('status', 'active')
    .gt('visible_until', new Date().toISOString())
    .order('created_at', { ascending: false });

  if (params?.categoria && params.categoria !== 'todos') {
    query = query.eq('categoria', params.categoria);
  }

  if (params?.limit) {
    query = query.limit(params.limit);
  }

  const { data, error } = await query;
  if (error || !data) return [];

  const userIds = Array.from(new Set(data.map((row) => row.user_id)));
  const perfiles = new Map<string, { nombre: string; avatarUrl?: string }>();

  if (userIds.length > 0) {
    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('id, nombre, avatar_url')
      .in('id', userIds);

    (profiles || []).forEach((p: { id: string; nombre: string; avatar_url?: string }) => {
      perfiles.set(p.id, { nombre: p.nombre || 'Usuario', avatarUrl: p.avatar_url || undefined });
    });
  }

  return data.map((row) =>
    dbToStory({ ...row, vendedor: perfiles.get(row.user_id) } as Record<string, unknown>)
  );
}

export async function getUserStoriesServer(
  userId: string,
  includeArchived = true
): Promise<Story[]> {
  let query = supabaseAdmin
    .from('stories')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (!includeArchived) {
    query = query.eq('status', 'active');
  }

  const { data, error } = await query;
  if (error || !data) return [];
  return data.map((row) => dbToStory(row as Record<string, unknown>));
}

export async function deleteStoryServer(userId: string, storyId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('stories')
    .delete()
    .eq('id', storyId)
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
}

export async function recordStoryInteractionServer(
  storyId: string,
  interactionType: StoryInteractionType,
  userId?: string
): Promise<void> {
  await supabaseAdmin.from('story_interactions').insert({
    story_id: storyId,
    user_id: userId || null,
    interaction_type: interactionType,
  });
}

export async function getStoryMetricsServer(storyId: string): Promise<StoryMetrics> {
  const { data } = await supabaseAdmin
    .from('story_interactions')
    .select('interaction_type')
    .eq('story_id', storyId);

  const counts: StoryMetrics = {
    views: 0,
    whatsapp_clicks: 0,
    chat_opens: 0,
    favorites: 0,
    shares: 0,
    cta_clicks: 0,
  };

  (data || []).forEach((row: { interaction_type: string }) => {
    switch (row.interaction_type) {
      case 'view':
        counts.views++;
        break;
      case 'whatsapp_click':
        counts.whatsapp_clicks++;
        break;
      case 'chat_open':
        counts.chat_opens++;
        break;
      case 'favorite':
        counts.favorites++;
        break;
      case 'share':
        counts.shares++;
        break;
      case 'cta_click':
        counts.cta_clicks++;
        break;
    }
  });

  return counts;
}

export async function toggleStoryFavoriteServer(
  userId: string,
  storyId: string
): Promise<boolean> {
  const { data: existing } = await supabaseAdmin
    .from('story_favorites')
    .select('story_id')
    .eq('user_id', userId)
    .eq('story_id', storyId)
    .maybeSingle();

  if (existing) {
    await supabaseAdmin
      .from('story_favorites')
      .delete()
      .eq('user_id', userId)
      .eq('story_id', storyId);
    return false;
  }

  await supabaseAdmin.from('story_favorites').insert({ user_id: userId, story_id: storyId });
  await recordStoryInteractionServer(storyId, 'favorite', userId);
  return true;
}

export async function verifyStoryOwnership(storyId: string, userId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from('stories')
    .select('id')
    .eq('id', storyId)
    .eq('user_id', userId)
    .maybeSingle();

  return !error && Boolean(data);
}

export { dbToStory };

import { supabase } from './supabase';
import { ADISO_IMAGES_BUCKET_FALLBACKS } from './storage-buckets';
import { Story, StoryGroup, StoryMediaType, StoryPromotionTier } from '@/types';

const TIER_ORDER: Record<StoryPromotionTier, number> = {
    premium: 0,
    destacada: 1,
    gratis: 2,
};

const SEEN_STORIES_KEY = 'seen_stories';

function dbToStory(row: any, vendedor?: { nombre: string; avatarUrl?: string }): Story {
    return {
        id: row.id,
        user_id: row.user_id,
        media_url: row.media_url,
        media_type: row.media_type,
        caption: row.caption || undefined,
        categoria: row.categoria || undefined,
        adiso_id: row.adiso_id || undefined,
        promotion_tier: row.promotion_tier || 'gratis',
        view_count: row.view_count || 0,
        created_at: row.created_at,
        expires_at: row.expires_at,
        vendedor,
    };
}

/**
 * Obtiene las historias activas (no expiradas), ordenadas por nivel de
 * promoción (premium/destacada primero) y luego por recencia.
 */
export async function getActiveStories(): Promise<Story[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
        .from('stories')
        .select('*')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

    if (error || !data) {
        if (error) console.error('Error al obtener historias:', error);
        return [];
    }

    const userIds = Array.from(new Set(data.map((row: any) => row.user_id)));
    const perfiles = new Map<string, { nombre: string; avatarUrl?: string }>();

    if (userIds.length > 0) {
        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, nombre, avatar_url')
            .in('id', userIds);

        (profiles || []).forEach((p: any) => {
            perfiles.set(p.id, { nombre: p.nombre || 'Usuario', avatarUrl: p.avatar_url || undefined });
        });
    }

    const stories = data.map((row: any) => dbToStory(row, perfiles.get(row.user_id)));

    return stories.sort((a, b) => {
        const tierDiff = TIER_ORDER[a.promotion_tier] - TIER_ORDER[b.promotion_tier];
        if (tierDiff !== 0) return tierDiff;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
}

/**
 * Agrupa historias por autor, marcando cada grupo como "no visto" si tiene
 * al menos una historia que el usuario actual no ha visto, y ordena los
 * grupos por nivel de promoción y novedad.
 */
export function groupStoriesByUser(stories: Story[], seenIds: Set<string>): StoryGroup[] {
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
        if (TIER_ORDER[story.promotion_tier] < TIER_ORDER[group.topTier]) {
            group.topTier = story.promotion_tier;
        }
    }

    return Array.from(groups.values()).sort((a, b) => {
        const tierDiff = TIER_ORDER[a.topTier] - TIER_ORDER[b.topTier];
        if (tierDiff !== 0) return tierDiff;
        if (a.hasUnseen !== b.hasUnseen) return a.hasUnseen ? -1 : 1;
        return new Date(b.stories[0].created_at).getTime() - new Date(a.stories[0].created_at).getTime();
    });
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

/**
 * Sube el archivo de media de una historia (imagen o video) y devuelve su
 * URL pública junto con el tipo de media detectado.
 */
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

    console.error('Error al subir media de la historia: ningún bucket disponible');
    return null;
}

/**
 * Crea una nueva historia.
 */
export async function createStory(
    userId: string,
    params: {
        mediaUrl: string;
        mediaType: StoryMediaType;
        caption?: string;
        categoria?: string;
        adisoId?: string;
        promotionTier?: StoryPromotionTier;
    }
): Promise<Story | null> {
    if (!supabase) return null;

    const tier = params.promotionTier || 'gratis';
    const durationHours = tier === 'premium' ? 48 : 24;
    const expiresAt = new Date(Date.now() + durationHours * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
        .from('stories')
        .insert({
            user_id: userId,
            media_url: params.mediaUrl,
            media_type: params.mediaType,
            caption: params.caption || null,
            categoria: params.categoria || null,
            adiso_id: params.adisoId || null,
            promotion_tier: tier,
            expires_at: expiresAt,
        })
        .select()
        .single();

    if (error || !data) {
        console.error('Error al crear historia:', error);
        return null;
    }

    return dbToStory(data);
}

/**
 * Registra una vista de historia (una vez por usuario) e incrementa su contador.
 */
export async function registerStoryView(storyId: string, userId: string): Promise<void> {
    if (!supabase) return;

    const { error } = await supabase.rpc('fn_register_story_view', {
        p_story_id: storyId,
        p_user_id: userId,
    });

    if (error) console.error('Error al registrar vista de historia:', error);
}

export async function deleteStory(storyId: string, userId: string): Promise<void> {
    if (!supabase) return;

    const { error } = await supabase
        .from('stories')
        .delete()
        .eq('id', storyId)
        .eq('user_id', userId);

    if (error) console.error('Error al eliminar historia:', error);
}

import { supabaseAdmin } from '@/lib/supabase-admin';
import { ADISO_IMAGES_BUCKET_FALLBACKS } from '@/lib/storage-buckets';
import { Story, StoryMediaType, StoryPromotionTier, Categoria } from '@/types';

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
  };
}

export async function uploadStoryMediaServer(
  file: File,
  userId: string
): Promise<{ url: string; mediaType: StoryMediaType }> {
  const mediaType: StoryMediaType = file.type.startsWith('video/') ? 'video' : 'image';
  const ext = file.name.split('.').pop() || (mediaType === 'video' ? 'mp4' : 'jpg');
  const fileName = `${userId}/stories/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  let lastError: string | undefined;

  for (const bucketName of ADISO_IMAGES_BUCKET_FALLBACKS) {
    const { error } = await supabaseAdmin.storage
      .from(bucketName)
      .upload(fileName, buffer, {
        contentType: file.type || (mediaType === 'video' ? 'video/mp4' : 'image/jpeg'),
        cacheControl: '3600',
        upsert: false,
      });

    if (!error) {
      const { data } = supabaseAdmin.storage.from(bucketName).getPublicUrl(fileName);
      return { url: data.publicUrl, mediaType };
    }

    lastError = error.message;
    const bucketMissing =
      error.message?.toLowerCase().includes('bucket') ||
      error.message?.toLowerCase().includes('not found');
    if (!bucketMissing) break;
  }

  throw new Error(lastError || 'No se pudo subir el archivo al storage');
}

export async function createStoryServer(
  userId: string,
  params: {
    mediaUrl: string;
    mediaType: StoryMediaType;
    caption?: string;
    categoria?: string;
    adisoId?: string;
    promotionTier?: StoryPromotionTier;
  }
): Promise<Story> {
  const tier = params.promotionTier || 'gratis';
  const durationHours = tier === 'premium' ? 48 : 24;
  const expiresAt = new Date(Date.now() + durationHours * 60 * 60 * 1000).toISOString();

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
      expires_at: expiresAt,
    })
    .select('*')
    .single();

  if (error || !data) {
    const msg = error?.message || 'unknown';
    if (msg.includes('relation') && msg.includes('stories')) {
      throw new Error(
        'La tabla stories no existe. Aplica las migraciones 010 y 013 en Supabase.'
      );
    }
    throw new Error(error?.message || 'No se pudo crear la historia');
  }

  return dbToStory(data as Record<string, unknown>);
}

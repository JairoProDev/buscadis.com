import { supabaseAdmin } from '@/lib/supabase-admin';
import { ADISO_IMAGES_BUCKET_FALLBACKS } from '@/lib/storage-buckets';

export type MediaKind = 'image' | 'video';

export const DEAL_MEDIA_MAX_BYTES = 25 * 1024 * 1024;
export const DEAL_VIDEO_MAX_SEC = 90;
export const DEAL_ASPECT_RATIO = '9:16';

export function detectMediaKind(mimeType: string): MediaKind | null {
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('image/')) return 'image';
  return null;
}

export function validateDealMediaFile(file: File): string | null {
  if (file.size === 0) return 'Selecciona un archivo';
  if (file.size > DEAL_MEDIA_MAX_BYTES) return 'El archivo supera 25 MB';
  const kind = detectMediaKind(file.type);
  if (!kind) return 'Formato no soportado. Usa imagen o video.';
  return null;
}

export async function uploadMediaServer(
  file: File,
  userId: string,
  folder: 'stories' | 'deals' = 'deals'
): Promise<{ url: string; mediaType: MediaKind }> {
  const mediaType = detectMediaKind(file.type);
  if (!mediaType) throw new Error('Formato no soportado');

  const ext = file.name.split('.').pop() || (mediaType === 'video' ? 'mp4' : 'jpg');
  const fileName = `${userId}/${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  let lastError: string | undefined;

  for (const bucketName of ADISO_IMAGES_BUCKET_FALLBACKS) {
    const { error } = await supabaseAdmin.storage.from(bucketName).upload(fileName, buffer, {
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

/** Poster = same URL for images; for video use first frame client-side or same URL until transcoding */
export function defaultPosterUrl(mediaUrl: string, mediaType: MediaKind): string {
  return mediaUrl;
}

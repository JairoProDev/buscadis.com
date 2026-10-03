import { ADISO_IMAGES_BUCKET_FALLBACKS } from '@/lib/storage-buckets';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getOgAdisoStoryUrl } from '@/lib/stories/media-url';
/**
 * Descarga /og/adiso/[id] y guarda PNG en Storage; persiste story_cover_url en private_data.
 */
export async function prewarmStoryCoverForAdiso(
  adisoId: string,
  userId: string,
): Promise<string | null> {
  const ogUrl = getOgAdisoStoryUrl(adisoId);
  const res = await fetch(ogUrl, { headers: { Accept: 'image/png' } });
  if (!res.ok) {
    console.warn('[prewarmStoryCover] fetch failed', adisoId, res.status);
    return null;
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  const storagePath = `${userId}/stories/cover-${adisoId}-${Date.now()}.png`;

  let publicUrl: string | null = null;
  for (const bucket of ADISO_IMAGES_BUCKET_FALLBACKS) {
    const { error } = await supabaseAdmin.storage.from(bucket).upload(storagePath, buffer, {
      contentType: 'image/png',
      cacheControl: '86400',
      upsert: true,
    });
    if (!error) {
      publicUrl = supabaseAdmin.storage.from(bucket).getPublicUrl(storagePath).data.publicUrl;
      break;
    }
  }

  if (!publicUrl) return null;

  const { data: row } = await supabaseAdmin
    .from('adisos')
    .select('private_data')
    .eq('id', adisoId)
    .maybeSingle();

  const priv =
    row?.private_data && typeof row.private_data === 'object'
      ? { ...(row.private_data as Record<string, unknown>) }
      : {};

  priv.story_cover_url = publicUrl;

  await supabaseAdmin
    .from('adisos')
    .update({ private_data: priv })
    .eq('id', adisoId);

  return publicUrl;
}

export async function prewarmStoryCoverIfPremium(
  adisoId: string,
  userId: string,
  promotionTier?: string | null,
): Promise<string | null> {
  if (promotionTier !== 'premium' && promotionTier !== 'destacada') return null;
  return prewarmStoryCoverForAdiso(adisoId, userId);
}

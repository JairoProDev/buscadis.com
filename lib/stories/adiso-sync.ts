import { Adiso, StoryObjective, StoryPromotionTier } from '@/types';
import { createStoryServer } from '@/lib/stories/server';
import { adisoTierToStoryTier } from '@/lib/stories/config';
import { getAdisoAbsoluteUrl } from '@/lib/url';

function pickAdisoMedia(adiso: Adiso): { url: string; mediaType: 'image' | 'video' } | null {
  const imageUrl = adiso.imagenesUrls?.[0] || adiso.imagenUrl;
  if (imageUrl) {
    return { url: imageUrl, mediaType: 'image' };
  }
  return null;
}

function defaultObjectiveForCategory(): StoryObjective {
  return 'contactos';
}

/**
 * Crea una historia automática al publicar un aviso clasificado.
 * Gratis: visible 1h. Promoción pagada del aviso: hereda tier (24h/48h).
 */
export async function createStoryFromAdiso(
  userId: string,
  adiso: Adiso,
  options?: {
    promotionTier?: StoryPromotionTier;
    objective?: StoryObjective;
  }
): Promise<void> {
  const media = pickAdisoMedia(adiso);
  if (!media) return;

  const tier = options?.promotionTier ?? adisoTierToStoryTier(adiso.promotionTier);
  const ctaUrl = getAdisoAbsoluteUrl(adiso);

  try {
    await createStoryServer(userId, {
      mediaUrl: media.url,
      mediaType: media.mediaType,
      caption: adiso.titulo,
      categoria: adiso.categoria,
      adisoId: adiso.id,
      promotionTier: tier,
      objective: options?.objective ?? defaultObjectiveForCategory(),
      source: 'adiso_auto',
      ctaUrl,
    });
  } catch (e) {
    console.error('[createStoryFromAdiso]', e);
  }
}

import { Adiso, StoryObjective, StoryPromotionTier } from '@/types';
import { createStoryServer } from '@/lib/stories/server';
import { adisoTierToStoryTier } from '@/lib/stories/config';
import { getAdisoAbsoluteUrl } from '@/lib/url';
import { resolveStoryMediaUrl } from '@/lib/stories/media-url';
import { prewarmStoryCoverIfPremium } from '@/lib/stories/prewarm-cover';
import { supabaseAdmin } from '@/lib/supabase-admin';

function defaultObjectiveForCategory(): StoryObjective {
  return 'contactos';
}

/**
 * Crea una historia automática al publicar un adiso.
 * Gratis: visible 1h. Promoción pagada del adiso: hereda tier (24h/48h).
 * Avisos con plantilla (sin foto) usan /og/adiso/[id].
 */
export async function createStoryFromAdiso(
  userId: string,
  adiso: Adiso,
  options?: {
    promotionTier?: StoryPromotionTier;
    objective?: StoryObjective;
    sortOrder?: number;
    skipIfActiveExists?: boolean;
  },
): Promise<void> {
  if (adiso.estaActivo === false) return;

  if (options?.skipIfActiveExists !== false) {
    const { data: existing } = await supabaseAdmin
      .from('stories')
      .select('id')
      .eq('adiso_id', adiso.id)
      .eq('status', 'active')
      .gt('visible_until', new Date().toISOString())
      .maybeSingle();
    if (existing?.id) return;
  }

  const tier = options?.promotionTier ?? adisoTierToStoryTier(adiso.promotionTier);
  const ctaUrl = getAdisoAbsoluteUrl(adiso);

  let media = resolveStoryMediaUrl(adiso);

  if (tier === 'premium' || tier === 'destacada') {
    const warmed = await prewarmStoryCoverIfPremium(adiso.id, userId, tier);
    if (warmed) media = { url: warmed, mediaType: 'image' };
  }

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
      sortOrder: options?.sortOrder ?? 0,
    });
  } catch (e) {
    console.error('[createStoryFromAdiso]', e);
  }
}

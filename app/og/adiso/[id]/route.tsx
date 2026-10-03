import { ImageResponse } from 'next/og';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { dbToAdiso } from '@/lib/supabase';
import { adisoUsesGeneratedCover } from '@/lib/flyer/templates';
import {
  buildFlyerContentFromAdiso,
  flyerStateFromPrivateData,
} from '@/lib/flyer/layout';
import { OgAdisoFlyerImage, OG_ADISO_STORY_SIZE } from '@/lib/flyer/og-adiso-image';

export const runtime = 'nodejs';
export const revalidate = 3600;

type RouteProps = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: RouteProps) {
  const { id } = await params;

  const { data: row } = await supabaseAdmin
    .from('adisos')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (!row) {
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#0d9488',
            color: '#fff',
            fontSize: 48,
            fontFamily: 'sans-serif',
          }}
        >
          Buscadis
        </div>
      ),
      OG_ADISO_STORY_SIZE,
    );
  }

  const adiso = dbToAdiso(row);
  const photo =
    adiso.imagenUrl?.trim() ||
    adiso.imagenesUrls?.find((u) => u?.trim())?.trim();

  if (photo && !adisoUsesGeneratedCover(adiso)) {
    return Response.redirect(photo, 302);
  }

  const priv =
    adiso.privateData && typeof adiso.privateData === 'object'
      ? (adiso.privateData as Record<string, unknown>)
      : {};
  const { templateId, config: rawConfig } = flyerStateFromPrivateData(priv, {
    categoria: adiso.categoria,
    adisoId: adiso.id,
  });
  const config = {
    primary: rawConfig.primary || '#0d9488',
    secondary: rawConfig.secondary || '#f0fdfa',
    align: rawConfig.align || 'left',
    showCategory: rawConfig.showCategory !== false,
    showLocation: rawConfig.showLocation !== false,
  };
  const content = buildFlyerContentFromAdiso(adiso);
  const premium = adiso.promotionTier === 'premium';

  return new ImageResponse(
    (
      <OgAdisoFlyerImage
        templateId={templateId}
        config={config}
        content={content}
        premium={premium}
      />
    ),
    OG_ADISO_STORY_SIZE,
  );
}

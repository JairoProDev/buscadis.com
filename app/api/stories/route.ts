import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserFromRouteRequest } from '@/lib/supabase-route-auth';
import { createStoryServer, uploadStoryMediaServer } from '@/lib/stories/server';
import { StoryPromotionTier } from '@/types';

export const dynamic = 'force-dynamic';

const tierSchema = z.enum(['gratis', 'destacada', 'premium']);

const MAX_BYTES = 25 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRouteRequest(request);
    if (!user?.id) {
      return NextResponse.json({ error: 'Debes iniciar sesión' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: 'Selecciona una imagen o video' }, { status: 400 });
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'El archivo supera 25 MB' }, { status: 400 });
    }

    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      return NextResponse.json({ error: 'Formato no soportado' }, { status: 400 });
    }

    const caption = String(formData.get('caption') || '').trim().slice(0, 150);
    const categoria = String(formData.get('categoria') || '').trim() || undefined;
    const tierRaw = String(formData.get('tier') || 'gratis');
    const tierParsed = tierSchema.safeParse(tierRaw);
    if (!tierParsed.success) {
      return NextResponse.json({ error: 'Tier de promoción inválido' }, { status: 400 });
    }
    const tier: StoryPromotionTier = tierParsed.data;

    const uploaded = await uploadStoryMediaServer(file, user.id);
    const story = await createStoryServer(user.id, {
      mediaUrl: uploaded.url,
      mediaType: uploaded.mediaType,
      caption: caption || undefined,
      categoria,
      promotionTier: tier,
    });

    return NextResponse.json({ success: true, story });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error al publicar';
    console.error('[api/stories POST]', e);

    if (message.includes('SUPABASE_SERVICE_ROLE_KEY')) {
      return NextResponse.json(
        { error: 'Servidor no configurado para publicar historias' },
        { status: 503 }
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserFromRouteRequest } from '@/lib/supabase-route-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import {
  buildAutoReply,
  fieldQuestion,
  photoReplyContent,
  RevealField,
} from '@/lib/interactions/field-reveal';
import { getInteractionSession, updateRevealedFields } from '@/lib/interactions/auto-contact';

const bodySchema = z.object({
  adisoId: z.string().min(1),
  field: z.string().min(1),
  photoIndex: z.number().int().min(0).optional(),
});

function parsePrivateData(row: Record<string, unknown>) {
  const priv = row.private_data;
  if (priv && typeof priv === 'object') return priv as Record<string, unknown>;
  try {
    return typeof priv === 'string' ? JSON.parse(priv) : {};
  } catch {
    return {};
  }
}

function parseFeatures(row: Record<string, unknown>) {
  const f = row.features;
  if (f && typeof f === 'object') return f as Record<string, unknown>;
  try {
    return typeof f === 'string' ? JSON.parse(f) : {};
  } catch {
    return {};
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRouteRequest(request);
    if (!user?.id) {
      return NextResponse.json({ error: 'Debes iniciar sesión' }, { status: 401 });
    }

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }

    const { adisoId, field, photoIndex } = parsed.data;

    const { data: adiso } = await supabaseAdmin
      .from('adisos')
      .select(
        'id, titulo, descripcion, precio, moneda, tipo_precio, ubicacion, imagenes_urls, user_id, publish_tier, features, private_data'
      )
      .eq('id', adisoId)
      .maybeSingle();

    if (!adiso) {
      return NextResponse.json({ error: 'Aviso no encontrado' }, { status: 404 });
    }

    const sellerId = adiso.user_id as string;
    if (sellerId === user.id) {
      return NextResponse.json({ error: 'No aplica en tu propio aviso' }, { status: 400 });
    }

    const session = await getInteractionSession(user.id, adisoId);
    if (!session?.conversation_id) {
      return NextResponse.json({ error: 'Abre el aviso primero' }, { status: 409 });
    }

    const conversationId = session.conversation_id as string;
    const question = fieldQuestion(field as RevealField, photoIndex);
    const revealed = [...((session.revealed_fields as string[]) || [])];
    const fieldKey = photoIndex != null ? `fotos_${photoIndex}` : field;

    await supabaseAdmin.from('messages').insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content: question,
      message_kind: 'system_buyer',
      metadata: { field, photoIndex, adiso_id: adisoId },
    });

    const priv = parsePrivateData(adiso as Record<string, unknown>);
    const features = parseFeatures(adiso as Record<string, unknown>);
    const publishTier = (adiso.publish_tier as string) || 'paid';
    const autoReplyEnabled = publishTier === 'paid' && features.auto_reply !== false;

    let imagenesUrls: string[] | undefined;
    try {
      imagenesUrls =
        typeof adiso.imagenes_urls === 'string'
          ? JSON.parse(adiso.imagenes_urls)
          : (adiso.imagenes_urls as string[]) || undefined;
    } catch {
      imagenesUrls = undefined;
    }

    const adData = {
      precio: (priv.precio as number) ?? (adiso.precio as number),
      moneda: (priv.moneda as string) ?? (adiso.moneda as string),
      tipoPrecio: (priv.tipoPrecio as string) ?? (adiso.tipo_precio as string),
      ubicacion: priv.ubicacion ?? adiso.ubicacion,
      descripcion: adiso.descripcion as string,
      imagenesUrls: (priv.imagenesUrls as string[]) || imagenesUrls,
    };

    let replyText: string | null = null;
    let replyImage: string | undefined;

    if (field === 'fotos') {
      const idx = photoIndex ?? 1;
      const photo = photoReplyContent(adData.imagenesUrls, idx);
      replyText = photo.text;
      replyImage = photo.imageUrl;
    } else if (autoReplyEnabled) {
      replyText = buildAutoReply(field as RevealField, adData, photoIndex);
    }

    let revealedNow = false;

    if (replyText && autoReplyEnabled) {
      await new Promise((r) => setTimeout(r, 400 + Math.random() * 400));

      await supabaseAdmin.from('messages').insert({
        conversation_id: conversationId,
        sender_id: sellerId,
        content: replyImage ? `${replyText}\n${replyImage}` : replyText,
        message_kind: 'system_seller',
        metadata: { field, photoIndex, adiso_id: adisoId, auto: true, imageUrl: replyImage },
      });

      if (!revealed.includes(fieldKey)) revealed.push(fieldKey);
      revealedNow = true;

      await updateRevealedFields(
        session.id as string,
        revealed,
        field === 'fotos' ? photoIndex ?? 1 : undefined
      );

      await supabaseAdmin
        .from('conversations')
        .update({ last_message: replyText, last_message_at: new Date().toISOString() })
        .eq('id', conversationId);
    } else if (!autoReplyEnabled) {
      await supabaseAdmin.from('notifications').insert({
        user_id: sellerId,
        type: 'message',
        title: 'Nueva consulta sobre tu aviso',
        body: question,
        data: { adiso_id: adisoId, conversation_id: conversationId },
      });
    }

    return NextResponse.json({
      conversationId,
      question,
      reply: replyText,
      replyImage,
      revealed: revealedNow,
      revealedFields: revealed,
      upsell: !autoReplyEnabled,
    });
  } catch (e) {
    console.error('[interactions/ask]', e);
    return NextResponse.json({ error: 'Error al procesar consulta' }, { status: 500 });
  }
}

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
import {
  getInteractionSession,
  openAdInteraction,
  updateRevealedFields,
} from '@/lib/interactions/auto-contact';
import { resolveListingForInteraction } from '@/lib/interactions/resolve-listing';
import { notifyChatParticipant } from '@/lib/chat/notify';

const bodySchema = z.object({
  adisoId: z.string().min(1),
  field: z.string().min(1),
  photoIndex: z.number().int().min(0).optional(),
});

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
    const listing = await resolveListingForInteraction(adisoId);

    if (!listing) {
      return NextResponse.json({ error: 'Aviso no encontrado' }, { status: 404 });
    }

    if (listing.contactLocked && (field === 'contacto' || field === 'whatsapp')) {
      return NextResponse.json(
        {
          error: 'contact_locked',
          message: 'El contacto del anunciante estará disponible cuando verifique su pago.',
        },
        { status: 403 }
      );
    }

    const sellerId = listing.sellerUserId;
    if (!sellerId) {
      return NextResponse.json({ error: 'Vendedor no registrado en la app' }, { status: 422 });
    }
    if (sellerId === user.id) {
      return NextResponse.json({ error: 'No aplica en tu propio aviso' }, { status: 400 });
    }

    let session = await getInteractionSession(user.id, listing.id);
    if (!session?.conversation_id) {
      const opened = await openAdInteraction({
        viewerUserId: user.id,
        adisoId: listing.id,
        adisoTitle: listing.titulo,
        sellerUserId: sellerId,
        notifySeller: false,
      });
      session = await getInteractionSession(user.id, listing.id);
      if (!session?.conversation_id) {
        return NextResponse.json(
          { error: 'No se pudo abrir la conversación', conversationId: opened.conversationId },
          { status: 500 }
        );
      }
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
      metadata: { field, photoIndex, adiso_id: listing.id },
    });

    // Always notify the real seller — auto-replies do not replace a human notification
    void notifyChatParticipant({
      recipientUserId: sellerId,
      senderUserId: user.id,
      conversationId,
      title: `Consulta: ${listing.titulo}`,
      body: question,
      adisoId: listing.id,
    });

    const adData = {
      precio: listing.precio ?? undefined,
      moneda: listing.moneda ?? undefined,
      tipoPrecio: listing.tipoPrecio ?? undefined,
      ubicacion: listing.ubicacion,
      descripcion: listing.descripcion,
      imagenesUrls: listing.imagenesUrls,
    };

    let replyText: string | null = null;
    let replyImage: string | undefined;

    if (field === 'fotos') {
      const idx = photoIndex ?? 1;
      const photo = photoReplyContent(adData.imagenesUrls, idx);
      replyText = photo.text;
      replyImage = photo.imageUrl;
    } else {
      // Always answer with known listing fields so the UI + chat stay in sync
      replyText =
        buildAutoReply(field as RevealField, adData, photoIndex) ||
        'Te confirmo por aquí. ¿Quieres que te cuente algo más?';
    }

    if (!revealed.includes(fieldKey)) revealed.push(fieldKey);

    await updateRevealedFields(
      session.id as string,
      revealed,
      field === 'fotos' ? photoIndex ?? 1 : undefined
    );

    await new Promise((r) => setTimeout(r, 250 + Math.random() * 250));

    await supabaseAdmin.from('messages').insert({
      conversation_id: conversationId,
      sender_id: sellerId,
      content: replyImage ? `${replyText}\n${replyImage}` : replyText,
      message_kind: 'system_seller',
      metadata: { field, photoIndex, adiso_id: listing.id, auto: true, imageUrl: replyImage },
    });

    await supabaseAdmin
      .from('conversations')
      .update({ last_message: replyText, last_message_at: new Date().toISOString() })
      .eq('id', conversationId);

    const publishTier = listing.publishTier || 'paid';
    const autoReplyFeature = listing.features.auto_reply !== false;
    const isPaidAuto = publishTier === 'paid' && autoReplyFeature;

    return NextResponse.json({
      conversationId,
      question,
      reply: replyText,
      replyImage,
      revealed: true,
      revealedFields: revealed,
      upsell: !isPaidAuto,
    });
  } catch (e) {
    console.error('[interactions/ask]', e);
    return NextResponse.json({ error: 'Error al procesar consulta' }, { status: 500 });
  }
}

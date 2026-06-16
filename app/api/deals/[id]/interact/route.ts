import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserFromRouteRequest } from '@/lib/supabase-route-auth';
import {
  registerDealViewServer,
  toggleDealLikeServer,
  toggleDealSaveServer,
  recordDealInteractionServer,
  incrementDealCounter,
} from '@/lib/deals/server';
import { logDealBehavioralEvent, DEAL_EVENTS } from '@/lib/deals/analytics';
import { supabaseAdmin } from '@/lib/supabase-admin';

const bodySchema = z.object({
  type: z.enum([
    'view',
    'like',
    'save',
    'share',
    'cta_click',
    'whatsapp_click',
    'chat_open',
    'not_interested',
    'report',
  ]),
  sessionId: z.string().optional(),
  watchTimeMs: z.number().optional(),
  reason: z.string().optional(),
  details: z.string().optional(),
});

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getUserFromRouteRequest(request);
    const { id: clipId } = await params;

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 });
    }

    const { type, sessionId, watchTimeMs, reason, details } = parsed.data;

    if (type === 'view') {
      await registerDealViewServer(clipId, {
        userId: user?.id,
        sessionId,
        watchTimeMs,
      });
      await logDealBehavioralEvent({
        userId: user?.id,
        sessionId,
        eventType: DEAL_EVENTS.CLIP_VIEW,
        clipId,
        metadata: { watchTimeMs },
      });
      return NextResponse.json({ success: true });
    }

    if (type === 'like') {
      if (!user?.id) {
        return NextResponse.json({ error: 'Inicia sesión para dar like' }, { status: 401 });
      }
      const liked = await toggleDealLikeServer(user.id, clipId);
      await recordDealInteractionServer(clipId, liked ? 'like' : 'unlike', { userId: user.id });
      await logDealBehavioralEvent({
        userId: user.id,
        eventType: DEAL_EVENTS.CLIP_LIKE,
        clipId,
        metadata: { liked },
      });
      return NextResponse.json({ success: true, liked });
    }

    if (type === 'save') {
      if (!user?.id) {
        return NextResponse.json({ error: 'Inicia sesión para guardar' }, { status: 401 });
      }
      const saved = await toggleDealSaveServer(user.id, clipId);
      await recordDealInteractionServer(clipId, saved ? 'save' : 'unsave', { userId: user.id });
      await logDealBehavioralEvent({
        userId: user.id,
        eventType: DEAL_EVENTS.CLIP_SAVE,
        clipId,
        metadata: { saved },
      });
      return NextResponse.json({ success: true, saved });
    }

    if (type === 'share') {
      await incrementDealCounter(clipId, 'share_count');
      await recordDealInteractionServer(clipId, 'share', {
        userId: user?.id,
        sessionId,
      });
      await logDealBehavioralEvent({
        userId: user?.id,
        sessionId,
        eventType: DEAL_EVENTS.CLIP_SHARE,
        clipId,
      });
      return NextResponse.json({ success: true });
    }

    if (type === 'cta_click' || type === 'whatsapp_click' || type === 'chat_open') {
      if (type === 'cta_click') await incrementDealCounter(clipId, 'cta_click_count');
      await recordDealInteractionServer(clipId, type, { userId: user?.id, sessionId });
      await logDealBehavioralEvent({
        userId: user?.id,
        sessionId,
        eventType: type === 'whatsapp_click' ? DEAL_EVENTS.WHATSAPP_CLICK : DEAL_EVENTS.CTA_CLICK,
        clipId,
      });
      return NextResponse.json({ success: true });
    }

    if (type === 'not_interested') {
      await recordDealInteractionServer(clipId, 'not_interested', { userId: user?.id, sessionId });
      await logDealBehavioralEvent({
        userId: user?.id,
        sessionId,
        eventType: DEAL_EVENTS.NOT_INTERESTED,
        clipId,
      });
      return NextResponse.json({ success: true });
    }

    if (type === 'report') {
      await supabaseAdmin.from('deal_clip_reports').insert({
        clip_id: clipId,
        reporter_id: user?.id || null,
        reason: reason || 'other',
        details: details || null,
      });
      await incrementDealCounter(clipId, 'report_count');
      await recordDealInteractionServer(clipId, 'report', {
        userId: user?.id,
        metadata: { reason },
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Acción no soportada' }, { status: 400 });
  } catch (e) {
    console.error('[api/deals/interact]', e);
    return NextResponse.json({ error: 'Error al registrar interacción' }, { status: 500 });
  }
}

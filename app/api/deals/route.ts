import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserFromRouteRequest } from '@/lib/supabase-route-auth';
import { uploadMediaServer, validateDealMediaFile } from '@/lib/media/upload';
import { createDealClipServer } from '@/lib/deals/server';
import { commerceFromAdiso, validateDiscount } from '@/lib/deals/commerce-overlay';
import { isPaidDealTier } from '@/lib/deals/config';
import {
  createDealPromotionOrder,
  fulfillDealPromotionOrder,
  isDealPromotionDevBypassEnabled,
} from '@/lib/deals/promotions';
import { createMercadoPagoPreference, isMercadoPagoConfigured } from '@/lib/mercadopago';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { dbToAdiso } from '@/lib/supabase';
import { DEAL_TIERS, DealPromotionTier } from '@/types';
import { logDealBehavioralEvent, DEAL_EVENTS } from '@/lib/deals/analytics';

export const dynamic = 'force-dynamic';

const tierSchema = z.enum(['gratis', 'destacada', 'premium']);

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRouteRequest(request);
    if (!user?.id) {
      return NextResponse.json({ error: 'Debes iniciar sesión' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Selecciona un video o imagen' }, { status: 400 });
    }

    const mediaError = validateDealMediaFile(file);
    if (mediaError) {
      return NextResponse.json({ error: mediaError }, { status: 400 });
    }

    const adisoId = String(formData.get('adisoId') || '').trim();
    if (!adisoId) {
      return NextResponse.json({ error: 'Vincula un aviso comercial' }, { status: 400 });
    }

    const { data: adisoRow } = await supabaseAdmin
      .from('adisos')
      .select('*')
      .eq('id', adisoId)
      .maybeSingle();

    if (!adisoRow) {
      return NextResponse.json({ error: 'Aviso no encontrado' }, { status: 404 });
    }

    const adiso = dbToAdiso(adisoRow);
    const commerce = commerceFromAdiso(adiso);

    const title = String(formData.get('title') || commerce.title || adiso.titulo).trim().slice(0, 120);
    const caption = String(formData.get('caption') || commerce.caption || '').trim().slice(0, 500);
    const hashtagsRaw = String(formData.get('hashtags') || '');
    const hashtags = hashtagsRaw
      .split(/[\s,]+/)
      .map((h) => h.replace(/^#/, '').trim())
      .filter(Boolean)
      .slice(0, 10);

    const priceDisplay = formData.get('priceDisplay')
      ? Number(formData.get('priceDisplay'))
      : commerce.price_display;
    const priceOriginal = formData.get('priceOriginal')
      ? Number(formData.get('priceOriginal'))
      : commerce.price_original;

    if (!validateDiscount(priceOriginal, priceDisplay)) {
      return NextResponse.json({ error: 'Precio original debe ser mayor o igual al precio oferta' }, { status: 400 });
    }

    let discountPct: number | undefined;
    if (priceDisplay != null && priceOriginal != null && priceOriginal > priceDisplay) {
      discountPct = Math.round(((priceOriginal - priceDisplay) / priceOriginal) * 100);
    }

    const tierParsed = tierSchema.safeParse(String(formData.get('tier') || 'gratis'));
    const tier: DealPromotionTier = tierParsed.success ? tierParsed.data : 'gratis';

    const businessProfileId = String(formData.get('businessProfileId') || '').trim() || undefined;
    const dealExpiresAt = String(formData.get('dealExpiresAt') || '').trim() || undefined;
    const stockHint = String(formData.get('stockHint') || '').trim().slice(0, 80) || undefined;

    const uploaded = await uploadMediaServer(file, user.id, 'deals');

    const clip = await createDealClipServer(user.id, {
      mediaUrl: uploaded.url,
      mediaType: uploaded.mediaType,
      title,
      caption: caption || undefined,
      categoria: adiso.categoria,
      hashtags,
      adisoId,
      businessProfileId,
      priceDisplay: priceDisplay ?? undefined,
      priceOriginal: priceOriginal ?? undefined,
      currency: adiso.moneda || 'PEN',
      discountPct,
      dealExpiresAt: dealExpiresAt || undefined,
      stockHint,
      ctaType: 'adiso',
      promotionTier: tier,
      status: isPaidDealTier(tier) ? 'draft' : 'active',
      source: 'manual',
    });

    await logDealBehavioralEvent({
      userId: user.id,
      eventType: DEAL_EVENTS.PUBLISH_COMPLETE,
      clipId: clip.id,
    });

    if (!isPaidDealTier(tier)) {
      return NextResponse.json({ success: true, clip, status: 'fulfilled' });
    }

    if (isDealPromotionDevBypassEnabled()) {
      const order = await createDealPromotionOrder({
        userId: user.id,
        clipId: clip.id,
        tier,
        status: 'dev_bypass',
      });
      if (order) await fulfillDealPromotionOrder(order.id);
      return NextResponse.json({ success: true, clip, status: 'fulfilled', devBypass: true });
    }

    const order = await createDealPromotionOrder({
      userId: user.id,
      clipId: clip.id,
      tier,
      status: 'pending',
    });

    if (!order) {
      return NextResponse.json({ error: 'No se pudo crear la orden' }, { status: 500 });
    }

    if (!isMercadoPagoConfigured()) {
      await supabaseAdmin.from('deal_promotion_orders').update({ status: 'cancelled' }).eq('id', order.id);
      return NextResponse.json(
        { error: 'Pagos no disponibles', code: 'PAYMENTS_NOT_CONFIGURED', clip },
        { status: 503 }
      );
    }

    const tierInfo = DEAL_TIERS[tier];
    const preference = await createMercadoPagoPreference({
      orderId: order.id,
      title: `Buscadis · Deals ${tierInfo.nombre}`,
      unitPricePen: tierInfo.precio,
      payerEmail: user.email || undefined,
      kind: 'deal',
    });

    if (!preference) {
      return NextResponse.json({ error: 'No se pudo iniciar el pago' }, { status: 500 });
    }

    await supabaseAdmin
      .from('deal_promotion_orders')
      .update({ mp_preference_id: preference.preferenceId })
      .eq('id', order.id);

    const useSandbox =
      process.env.NODE_ENV === 'development' && process.env.MERCADOPAGO_USE_SANDBOX === 'true';

    return NextResponse.json({
      success: true,
      clip,
      status: 'checkout',
      orderId: order.id,
      checkoutUrl:
        useSandbox && preference.sandboxInitPoint ? preference.sandboxInitPoint : preference.initPoint,
    });
  } catch (e) {
    console.error('[api/deals POST]', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Error al publicar deal' },
      { status: 500 }
    );
  }
}

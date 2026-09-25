import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserFromRouteRequest } from '@/lib/supabase-route-auth';
import { ADISO_PROMOTION_TIERS } from '@/types';
import {
  calculatePromotionTotalPen,
  isValidPromotionDays,
  isValidPromotionTier,
  promotionExpiresAtIso,
} from '@/lib/promotions';
import {
  createPromotionOrder,
  fulfillPromotionOrder,
  isPromotionDevBypassEnabled,
  removeAdisoPromotion,
  verifyAdisoOwnership,
} from '@/lib/promotions/server';
import { createMercadoPagoPreference, isMercadoPagoConfigured } from '@/lib/mercadopago';
import { supabaseAdmin } from '@/lib/supabase-admin';

const bodySchema = z.object({
  adisoId: z.string().min(1).max(64),
  tier: z.enum(['gratis', 'destacada', 'premium']),
  days: z.number().int().min(0).max(90),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRouteRequest(request);
    if (!user?.id) {
      return NextResponse.json({ error: 'Debes iniciar sesión' }, { status: 401 });
    }

    const json = (await request.json()) as unknown;
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { adisoId, tier, days } = parsed.data;

    if (!isValidPromotionTier(tier)) {
      return NextResponse.json({ error: 'Tier inválido' }, { status: 400 });
    }

    if (tier !== 'gratis' && !isValidPromotionDays(days)) {
      return NextResponse.json(
        { error: 'Duración no válida. Usa 3, 7, 14 o 30 días.' },
        { status: 400 }
      );
    }

    const owns = await verifyAdisoOwnership(adisoId, user.id);
    if (!owns) {
      return NextResponse.json({ error: 'No eres el dueño de este adiso' }, { status: 403 });
    }

    // Quitar promoción (gratis)
    if (tier === 'gratis') {
      await removeAdisoPromotion(user.id, adisoId);
      return NextResponse.json({
        status: 'fulfilled',
        tier: 'gratis',
        expiresAt: null,
      });
    }

    const total = calculatePromotionTotalPen(tier, days);
    const tierInfo = ADISO_PROMOTION_TIERS[tier];

    // Desarrollo: bypass explícito solo con flag
    if (isPromotionDevBypassEnabled()) {
      const order = await createPromotionOrder({
        userId: user.id,
        adisoId,
        tier,
        days,
        status: 'dev_bypass',
      });
      if (!order) {
        return NextResponse.json({ error: 'No se pudo registrar la orden' }, { status: 500 });
      }
      await fulfillPromotionOrder(order.id);
      return NextResponse.json({
        status: 'fulfilled',
        tier,
        expiresAt: promotionExpiresAtIso(tier, days),
        devBypass: true,
      });
    }

    const order = await createPromotionOrder({
      userId: user.id,
      adisoId,
      tier,
      days,
      status: 'pending',
    });

    if (!order) {
      return NextResponse.json({ error: 'No se pudo crear la orden' }, { status: 500 });
    }

    if (!isMercadoPagoConfigured()) {
      await supabaseAdmin
        .from('adiso_promotion_orders')
        .update({ status: 'cancelled' })
        .eq('id', order.id);

      return NextResponse.json(
        {
          error: 'Pagos en línea no disponibles aún. Escríbenos por WhatsApp para activar tu promoción.',
          code: 'PAYMENTS_NOT_CONFIGURED',
        },
        { status: 503 }
      );
    }

    const preference = await createMercadoPagoPreference({
      orderId: order.id,
      title: `Buscadis · ${tierInfo.nombre} · ${days} días`,
      unitPricePen: total,
      payerEmail: user.email || undefined,
    });

    if (!preference) {
      await supabaseAdmin
        .from('adiso_promotion_orders')
        .update({ status: 'failed' })
        .eq('id', order.id);

      return NextResponse.json(
        { error: 'No se pudo iniciar el pago. Intenta de nuevo.' },
        { status: 502 }
      );
    }

    await supabaseAdmin
      .from('adiso_promotion_orders')
      .update({ mp_preference_id: preference.preferenceId })
      .eq('id', order.id);

    const useSandbox =
      process.env.NODE_ENV === 'development' &&
      process.env.MERCADOPAGO_USE_SANDBOX === 'true';

    return NextResponse.json({
      status: 'checkout',
      orderId: order.id,
      checkoutUrl: useSandbox && preference.sandboxInitPoint
        ? preference.sandboxInitPoint
        : preference.initPoint,
      amountPen: total,
      tier,
      days,
    });
  } catch (e) {
    console.error('[api/adisos/promote]', e);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

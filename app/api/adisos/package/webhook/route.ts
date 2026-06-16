import { NextRequest, NextResponse } from 'next/server';
import { getMercadoPagoPayment } from '@/lib/mercadopago';
import {
  getPackageOrder,
  markPackageOrderPaid,
  updatePackageOrderAdiso,
} from '@/lib/packages/server';
import { applyPaidTierToAdiso } from '@/lib/publish/paid-publish';
import { createAdisoInSupabase } from '@/lib/supabase';
import { runInstantMatchCampaign } from '@/lib/activation/instant-match';
import {
  linkUserDemandIntentOnPublish,
  processBothPaidMatchesForDemandAdiso,
} from '@/lib/matching/both-paid';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { TamañoPaquete } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url);
    let paymentId = url.searchParams.get('id') || url.searchParams.get('data.id');

    if (!paymentId) {
      try {
        const body = (await request.json()) as { data?: { id?: string }; id?: string };
        paymentId = body?.data?.id || body?.id || null;
      } catch {
        // empty body
      }
    }

    if (!paymentId) {
      return NextResponse.json({ ok: true, skipped: 'no_payment_id' });
    }

    const payment = await getMercadoPagoPayment(paymentId);
    if (!payment?.externalReference) {
      return NextResponse.json({ ok: true, skipped: 'payment_not_found' });
    }

    const orderId = payment.externalReference;
    const order = await getPackageOrder(orderId);
    if (!order) {
      return NextResponse.json({ ok: true, skipped: 'order_not_found' });
    }

    if (order.status === 'paid' || order.status === 'dev_bypass') {
      const { data: fulfilled } = await supabaseAdmin
        .from('adiso_package_orders')
        .select('fulfilled_at, adiso_id')
        .eq('id', orderId)
        .maybeSingle();
      if (fulfilled?.fulfilled_at) {
        return NextResponse.json({ ok: true, already_fulfilled: true });
      }
    }

    if (payment.status !== 'approved') {
      return NextResponse.json({ ok: true, status: payment.status });
    }

    await markPackageOrderPaid(orderId, paymentId);

    const draft = order.draft_payload as Record<string, unknown>;
    const adiso = await createAdisoInSupabase(
      applyPaidTierToAdiso(
        {
          ...draft,
          tamaño: order.package_tier as TamañoPaquete,
          user_id: order.user_id,
          usuario_id: order.user_id,
          estaActivo: true,
          esHistorico: false,
        } as Parameters<typeof createAdisoInSupabase>[0],
        order.package_tier as TamañoPaquete
      )
    );

    const { onAdisoSearchIndexUpdate } = await import('@/lib/search/post-create');
    onAdisoSearchIndexUpdate(adiso);

    await updatePackageOrderAdiso(orderId, adiso.id);
    await supabaseAdmin
      .from('adiso_package_orders')
      .update({ fulfilled_at: new Date().toISOString() })
      .eq('id', orderId);

    await runInstantMatchCampaign({
      adisoId: adiso.id,
      advertiserUserId: order.user_id,
      titulo: String(draft.titulo || ''),
      descripcion: String(draft.descripcion || ''),
      categoria: String(draft.categoria || ''),
      ubicacion:
        typeof draft.ubicacion === 'object' && draft.ubicacion
          ? (draft.ubicacion as Record<string, unknown>)
          : {},
    });

    await linkUserDemandIntentOnPublish(
      order.user_id,
      adiso.id,
      String(draft.categoria || '')
    );
    await processBothPaidMatchesForDemandAdiso(adiso.id);

    return NextResponse.json({ ok: true, adisoId: adiso.id });
  } catch (e) {
    console.error('[package/webhook]', e);
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 });
  }
}

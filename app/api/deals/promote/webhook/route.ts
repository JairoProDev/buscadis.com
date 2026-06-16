import { NextRequest, NextResponse } from 'next/server';
import { getMercadoPagoPayment } from '@/lib/mercadopago';
import {
  fulfillDealPromotionOrder,
  getDealOrderById,
  markDealOrderPaid,
} from '@/lib/deals/promotions';

export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url);
    let paymentId = url.searchParams.get('id') || url.searchParams.get('data.id');

    if (!paymentId) {
      try {
        const body = (await request.json()) as { data?: { id?: string }; id?: string };
        paymentId = body?.data?.id || body?.id || null;
      } catch {
        // body vacío
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
    const order = await getDealOrderById(orderId);
    if (!order) {
      return NextResponse.json({ ok: true, skipped: 'order_not_found' });
    }

    if (order.fulfilled_at) {
      return NextResponse.json({ ok: true, already_fulfilled: true });
    }

    if (payment.status !== 'approved') {
      return NextResponse.json({ ok: true, status: payment.status });
    }

    await markDealOrderPaid(orderId, paymentId);
    await fulfillDealPromotionOrder(orderId);

    return NextResponse.json({ ok: true, fulfilled: true });
  } catch (e) {
    console.error('[api/deals/promote/webhook]', e);
    return NextResponse.json({ error: 'webhook_error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}

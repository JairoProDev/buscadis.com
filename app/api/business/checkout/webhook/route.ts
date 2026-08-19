import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Webhook Mercado Pago — pedidos de catálogo (P3B).
 * Marca commerce_orders como paid cuando el pago se aprueba.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const paymentId =
    body?.data?.id?.toString?.() ||
    body?.id?.toString?.() ||
    req.nextUrl.searchParams.get('id');

  if (!paymentId) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) {
    return NextResponse.json({ ok: false, error: 'MP no configurado' }, { status: 503 });
  }

  try {
    const payRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!payRes.ok) {
      return NextResponse.json({ ok: false }, { status: 502 });
    }
    const payment = await payRes.json();
    const externalRef = String(payment.external_reference || '');
    const status = payment.status as string;
    const supabase = admin();
    if (!supabase || !externalRef) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    if (status === 'approved') {
      const { data } = await supabase
        .from('commerce_orders')
        .update({
          payment_status: 'paid',
          status: 'paid',
          payment_method: 'mercadopago',
          mp_payment_id: String(paymentId),
          updated_at: new Date().toISOString(),
        })
        .or(`id.eq.${externalRef},mp_preference_id.eq.${externalRef}`)
        .select('id, business_profile_id')
        .maybeSingle();

      if (data?.business_profile_id) {
        await supabase.from('page_analytics').insert({
          business_profile_id: data.business_profile_id,
          event_type: 'order_paid',
          product_id: null,
          session_id: `mp_${paymentId}`,
          metadata: { orderId: data.id, mpPaymentId: paymentId },
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('catalog checkout webhook', e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

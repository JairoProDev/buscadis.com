import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserFromRouteRequest } from '@/lib/supabase-route-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getYapePhone, buildWhatsAppPaymentMessage } from '@/lib/publish/pricing';

const bodySchema = z.object({
  orderId: z.string().uuid(),
  adisoId: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRouteRequest(request);
    if (!user?.id) {
      return NextResponse.json({ error: 'Debes iniciar sesión' }, { status: 401 });
    }

    const { orderId, adisoId } = bodySchema.parse(await request.json());

    const { data: order, error } = await supabaseAdmin
      .from('adiso_publish_orders')
      .select('*')
      .eq('id', orderId)
      .eq('user_id', user.id)
      .single();

    if (error || !order) {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
    }

    const yapePhone = getYapePhone();
    const whatsappMessage = buildWhatsAppPaymentMessage({
      adisoId,
      total: Number(order.total_amount),
      days: order.days,
      dailyRate: Number(order.daily_rate),
    });

    return NextResponse.json({
      ok: true,
      yapePhone,
      yapeQrUrl: process.env.NEXT_PUBLIC_YAPE_QR_URL || process.env.YAPE_QR_URL || null,
      total: order.total_amount,
      days: order.days,
      dailyRate: order.daily_rate,
      whatsappUrl: `https://wa.me/51${yapePhone.replace(/\D/g, '')}?text=${whatsappMessage}`,
      message: 'Envía tu captura de Yape por WhatsApp para activar el contacto de tu aviso.',
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

/** Admin/manual verification endpoint */
export async function PATCH(request: NextRequest) {
  try {
    const user = await getUserFromRouteRequest(request);
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderId, status } = z.object({
      orderId: z.string().uuid(),
      status: z.enum(['verified', 'underpaid']),
    }).parse(await request.json());

    const { data: order, error: fetchErr } = await supabaseAdmin
      .from('adiso_publish_orders')
      .select('adiso_id, user_id')
      .eq('id', orderId)
      .single();

    if (fetchErr || !order) {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
    }

    if (order.user_id !== user.id) {
      // TODO: admin role check for manual verification
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await supabaseAdmin
      .from('adiso_publish_orders')
      .update({ payment_status: status, verified_at: status === 'verified' ? new Date().toISOString() : null })
      .eq('id', orderId);

    await supabaseAdmin
      .from('adisos')
      .update({
        contact_locked: status !== 'verified',
        payment_status: status,
      })
      .eq('id', order.adiso_id);

    return NextResponse.json({ ok: true, status });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

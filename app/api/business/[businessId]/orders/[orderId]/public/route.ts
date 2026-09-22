import { NextResponse } from 'next/server';
import { getBusinessProfileBySlug } from '@/lib/business';
import { supabaseAdmin } from '@/lib/supabase-admin';

/**
 * GET público — hidratar carrito desde `?pedido=<orderId>`.
 * Solo expone ítems / total / nota (sin datos sensibles del dueño).
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ businessId: string; orderId: string }> }
) {
  const { businessId, orderId } = await params;
  const slug = decodeURIComponent(businessId);
  const id = decodeURIComponent(orderId).trim();

  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ ok: false, error: 'Pedido inválido' }, { status: 400 });
  }

  const profile = await getBusinessProfileBySlug(slug);
  if (!profile) {
    return NextResponse.json({ ok: false, error: 'Negocio no encontrado' }, { status: 404 });
  }

  try {
    const { data: order, error } = await supabaseAdmin
      .from('commerce_orders')
      .select('id, order_number, items, total, customer_note, status, business_profile_id')
      .eq('id', id)
      .eq('business_profile_id', profile.id)
      .maybeSingle();

    if (error) {
      console.error('[orders/public]', error.message);
      return NextResponse.json({ ok: false, error: 'No se pudo cargar' }, { status: 500 });
    }
    if (!order) {
      return NextResponse.json({ ok: false, error: 'Pedido no encontrado' }, { status: 404 });
    }
    if (order.status === 'cancelled') {
      return NextResponse.json({ ok: false, error: 'Este pedido fue cancelado' }, { status: 410 });
    }

    const items = Array.isArray(order.items) ? order.items : [];

    return NextResponse.json({
      ok: true,
      orderId: order.id,
      orderNumber: order.order_number,
      total: Number(order.total) || 0,
      note: order.customer_note || undefined,
      items: items.map((raw: Record<string, unknown>) => ({
        productId: String(raw.productId || raw.product_id || ''),
        title: String(raw.title || 'Producto'),
        qty: Math.max(1, Number(raw.qty) || 1),
        price: typeof raw.price === 'number' ? raw.price : undefined,
        imageUrl: typeof raw.imageUrl === 'string' ? raw.imageUrl : undefined,
      })),
    });
  } catch (err) {
    console.error('[orders/public]', err);
    return NextResponse.json({ ok: false, error: 'Servicio no disponible' }, { status: 503 });
  }
}

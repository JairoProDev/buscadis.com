import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase-server';
import { getUserFromRouteRequest } from '@/lib/supabase-route-auth';
import { getBusinessProfileBySlug } from '@/lib/business';
import {
  buildWhatsappOrderMessage,
  orderSubtotal,
  waMeUrl,
  type CommerceOrderItem,
} from '@/lib/business/commerce';
import { canUseCommerceOrders } from '@/lib/business/subscription';
import { resolveBusinessForUser } from '@/lib/business-server-auth';
import { hasPermission } from '@/lib/business-access';

const itemSchema = z.object({
  productId: z.string().min(1),
  title: z.string().min(1),
  qty: z.number().int().positive(),
  price: z.number().nonnegative().optional(),
  imageUrl: z.string().optional(),
});

const createSchema = z.object({
  items: z.array(itemSchema).min(1),
  note: z.string().max(500).optional(),
  customerName: z.string().max(120).optional(),
  customerPhone: z.string().max(40).optional(),
  sendWhatsapp: z.boolean().optional(),
  visitorKey: z.string().max(80).optional(),
});

/** POST — visitante crea pedido (público por slug). */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  const { businessId } = await params;
  const slug = decodeURIComponent(businessId);
  const profile = await getBusinessProfileBySlug(slug);
  if (!profile) {
    return NextResponse.json({ ok: false, error: 'Negocio no encontrado' }, { status: 404 });
  }

  // Free puede recibir leads WA básicos; pedidos estructurados = Pro+
  // Permitimos crear en todos los planes publicados para no romper demos;
  // el gate duro está en entitlements de productos / checkout Max.
  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'Pedido inválido' }, { status: 400 });
  }

  const items = parsed.data.items as CommerceOrderItem[];
  const subtotal = orderSubtotal(items);
  const supabase = await createServerClient();

  const { data: order, error } = await supabase
    .from('commerce_orders')
    .insert({
      business_profile_id: profile.id,
      source: 'perfil_vivo',
      customer_name: parsed.data.customerName ?? null,
      customer_phone: parsed.data.customerPhone ?? null,
      customer_note: parsed.data.note ?? null,
      items,
      subtotal,
      total: subtotal,
      status: 'sent_wa',
      payment_method: 'whatsapp',
      payment_status: 'pending',
      visitor_key: parsed.data.visitorKey ?? null,
      wa_message_sent: Boolean(parsed.data.sendWhatsapp && (profile.contact_whatsapp || profile.contact_phone)),
      order_number: '', // trigger fills
    })
    .select('id, order_number, total, status')
    .single();

  if (error || !order) {
    console.error('commerce_orders insert', error);
    const fallbackNumber = `PV-LOCAL-${Date.now().toString(36).toUpperCase()}`;
    const phone = profile.contact_whatsapp || profile.contact_phone;
    const text = buildWhatsappOrderMessage({
      businessName: profile.name,
      orderNumber: fallbackNumber,
      items,
      total: subtotal,
      note: parsed.data.note,
    });
    return NextResponse.json({
      ok: true,
      orderId: null,
      orderNumber: fallbackNumber,
      waUrl: phone ? waMeUrl(phone, text) : null,
      persisted: false,
    });
  }

  const phone = profile.contact_whatsapp || profile.contact_phone;
  const text = buildWhatsappOrderMessage({
    businessName: profile.name,
    orderNumber: order.order_number,
    items,
    total: Number(order.total),
    note: parsed.data.note,
  });

  return NextResponse.json({
    ok: true,
    orderId: order.id,
    orderNumber: order.order_number,
    waUrl: phone ? waMeUrl(phone, text) : null,
    persisted: true,
  });
}

/** GET — dueño lista pedidos. */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  const user = await getUserFromRouteRequest(req);
  if (!user) {
    return NextResponse.json({ ok: false, error: 'No autenticado' }, { status: 401 });
  }

  const { businessId } = await params;
  const slug = decodeURIComponent(businessId);
  const supabase = await createServerClient();
  const profile = await getBusinessProfileBySlug(slug);
  if (!profile) {
    return NextResponse.json({ ok: false, error: 'Negocio no encontrado' }, { status: 404 });
  }

  const ctx = await resolveBusinessForUser(supabase, user.id, profile.id);
  if (!ctx || !hasPermission(ctx.role, 'catalog:read')) {
    return NextResponse.json({ ok: false, error: 'Sin acceso' }, { status: 403 });
  }

  if (!canUseCommerceOrders({ subscription_tier: profile.subscription_tier })) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Los pedidos estructurados son parte del alquiler Pro (S/30).',
        upgrade: 'pro',
      },
      { status: 402 }
    );
  }

  const { data, error } = await supabase
    .from('commerce_orders')
    .select(
      'id, order_number, items, total, subtotal, status, payment_status, payment_method, customer_note, customer_name, customer_phone, created_at, wa_message_sent'
    )
    .eq('business_profile_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, orders: data ?? [] });
}

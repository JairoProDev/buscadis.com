import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { getBusinessProfileBySlug } from '@/lib/business';
import { createMercadoPagoPreference, isMercadoPagoConfigured } from '@/lib/mercadopago';
import { createServerClient } from '@/lib/supabase-server';
import { canUseCommerceCheckout } from '@/lib/business/subscription';

const bodySchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      quantity: z.number().int().positive(),
      unit_price: z.number().nonnegative(),
    })
  ).min(1),
  note: z.string().max(500).optional(),
});

/** businessId is the public business slug for this route */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  const { businessId } = await params;
  const profile = await getBusinessProfileBySlug(decodeURIComponent(businessId));
  if (!profile) {
    return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 });
  }

  if (!canUseCommerceCheckout({ subscription_tier: profile.subscription_tier })) {
    return NextResponse.json(
      {
        error: 'Checkout en línea es parte de Max (S/300). Usa pedido por WhatsApp en Pro.',
        upgrade: 'max',
      },
      { status: 402 }
    );
  }

  if (!isMercadoPagoConfigured()) {
    return NextResponse.json(
      { error: 'Pago en línea no configurado. Usa WhatsApp.' },
      { status: 503 }
    );
  }

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Carrito inválido' }, { status: 400 });
  }

  const orderId = randomUUID();
  const items = parsed.data.items.map((i) => ({
    productId: i.id,
    title: i.title,
    qty: i.quantity,
    price: i.unit_price,
  }));
  const total = parsed.data.items.reduce((s, i) => s + i.unit_price * i.quantity, 0);

  if (total <= 0) {
    return NextResponse.json(
      { error: 'Agrega productos con precio para pagar en línea' },
      { status: 400 }
    );
  }

  const preference = await createMercadoPagoPreference({
    orderId,
    title: `Pedido ${profile.name}`.slice(0, 256),
    unitPricePen: total,
    kind: 'catalog_order',
  });

  if (!preference) {
    return NextResponse.json({ error: 'No se pudo crear el checkout' }, { status: 500 });
  }

  const supabase = await createServerClient();
  await supabase.from('commerce_orders').insert({
    id: orderId,
    business_profile_id: profile.id,
    source: 'perfil_vivo_mp',
    customer_note: parsed.data.note ?? null,
    items,
    subtotal: total,
    total,
    status: 'draft',
    payment_method: 'mercadopago',
    payment_status: 'pending',
    mp_preference_id: preference.preferenceId,
    order_number: '',
  });

  return NextResponse.json({
    orderId,
    checkoutUrl: preference.initPoint,
    preferenceId: preference.preferenceId,
  });
}

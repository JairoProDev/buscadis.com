import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { getBusinessProfileBySlug } from '@/lib/business';
import { createMercadoPagoPreference, isMercadoPagoConfigured } from '@/lib/mercadopago';

const bodySchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      quantity: z.number().int().positive(),
      unit_price: z.number().nonnegative(),
    })
  ).min(1),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const profile = await getBusinessProfileBySlug(decodeURIComponent(slug));
  if (!profile) {
    return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 });
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
  const total = parsed.data.items.reduce(
    (s, i) => s + i.unit_price * i.quantity,
    0
  );

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

  return NextResponse.json({
    orderId,
    checkoutUrl: preference.initPoint,
    preferenceId: preference.preferenceId,
  });
}

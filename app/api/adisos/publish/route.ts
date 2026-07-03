import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRouteRequest } from '@/lib/supabase-route-auth';
import { publishStudioSchema } from '@/lib/validations';
import { publishFromStudio } from '@/lib/publish/publish-server';
import { PublishDraft } from '@/lib/publish/publish-draft-types';

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRouteRequest(request);
    if (!user?.id) {
      return NextResponse.json({ error: 'Debes iniciar sesión' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = publishStudioSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.flatten() }, { status: 400 });
    }

    const data = parsed.data;
    const draft: PublishDraft = {
      categoria: data.categoria,
      subcategoria: data.subcategoria,
      subsubcategoria: data.subsubcategoria,
      titulo: data.titulo,
      descripcion: data.descripcion,
      contacto: data.contacto,
      ubicacion: data.ubicacion as PublishDraft['ubicacion'],
      imagenes: data.imagenes || [],
      precio: data.precio,
      moneda: data.moneda,
      tipoPrecio: data.tipoPrecio,
      atributos: (data.atributos as PublishDraft['atributos']) || {},
      aiConfidence: {},
      missingFields: [],
      chatHistory: [],
      plan: data.plan,
      paidDays: data.paidDays,
      dailyRate: data.dailyRate,
    };

    const { adiso, orderId } = await publishFromStudio({ userId: user.id, draft });

    return NextResponse.json({
      ok: true,
      adiso,
      orderId,
      tier: data.plan,
      paymentStatus: data.plan === 'free' ? 'free' : 'pending',
      contactLocked: data.plan !== 'free',
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error al publicar';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

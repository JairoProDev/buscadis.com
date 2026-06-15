import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserFromRouteRequest } from '@/lib/supabase-route-auth';
import { publishFreeAdiso } from '@/lib/publish/free-publish';
import { Categoria } from '@/types';

const bodySchema = z.object({
  text: z.string().min(1).max(500),
  categoria: z
    .enum([
      'empleos',
      'inmuebles',
      'vehiculos',
      'servicios',
      'productos',
      'eventos',
      'negocios',
      'comunidad',
    ])
    .optional(),
  contacto: z.string().min(6).max(30),
  ubicacion: z.unknown().optional(),
  imageUrl: z.string().url().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRouteRequest(request);
    if (!user?.id) {
      return NextResponse.json({ error: 'Debes iniciar sesión' }, { status: 401 });
    }

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }

    const adiso = await publishFreeAdiso({
      userId: user.id,
      text: parsed.data.text,
      categoria: parsed.data.categoria as Categoria | undefined,
      contacto: parsed.data.contacto,
      ubicacion: parsed.data.ubicacion,
      imageUrl: parsed.data.imageUrl,
    });

    return NextResponse.json({ ok: true, adiso, tier: 'free' });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error al publicar';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

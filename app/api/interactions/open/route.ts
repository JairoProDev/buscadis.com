import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserFromRouteRequest } from '@/lib/supabase-route-auth';
import { openAdInteraction } from '@/lib/interactions/auto-contact';
import { resolveListingForInteraction } from '@/lib/interactions/resolve-listing';
import { registrarContacto } from '@/lib/analytics';

const bodySchema = z.object({
  adisoId: z.string().min(1),
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

    const { adisoId } = parsed.data;
    const listing = await resolveListingForInteraction(adisoId);

    if (!listing) {
      return NextResponse.json({ error: 'Aviso no encontrado' }, { status: 404 });
    }

    const sellerId = listing.sellerUserId;
    if (!sellerId) {
      return NextResponse.json({ error: 'Vendedor no registrado en la app' }, { status: 422 });
    }

    if (sellerId === user.id) {
      return NextResponse.json({ error: 'No puedes contactarte a ti mismo' }, { status: 400 });
    }

    const result = await openAdInteraction({
      viewerUserId: user.id,
      adisoId: listing.id,
      adisoTitle: listing.titulo,
      sellerUserId: sellerId,
    });

    if (result.isNew) {
      await registrarContacto(user.id, listing.id, listing.categoria || 'productos', 'chat');
    }

    return NextResponse.json({
      ...result,
      adisoTitle: listing.titulo,
    });
  } catch (e) {
    console.error('[interactions/open]', e);
    return NextResponse.json({ error: 'Error al abrir interacción' }, { status: 500 });
  }
}

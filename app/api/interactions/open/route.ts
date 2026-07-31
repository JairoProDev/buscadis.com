import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserFromRouteRequest } from '@/lib/supabase-route-auth';
import { openAdInteraction } from '@/lib/interactions/auto-contact';
import { resolveListingForInteraction } from '@/lib/interactions/resolve-listing';
import { registrarContacto } from '@/lib/analytics';
import { ensureAdisoSellerUserId } from '@/lib/rueda/ensure-advertiser';
import { getOpsLeadWhatsAppUrl, isLeadCaptureAd } from '@/lib/adiso-contact';
import { registrarInteresAnuncioCaducado } from '@/lib/supabase';

const bodySchema = z.object({
  adisoId: z.string().min(1),
  /** Explicit user action to start chat — notifies the seller. Warm opens should omit this. */
  notifySeller: z.boolean().optional(),
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

    const { adisoId, notifySeller } = parsed.data;
    let listing = await resolveListingForInteraction(adisoId);

    if (!listing) {
      return NextResponse.json({ error: 'Aviso no encontrado' }, { status: 404 });
    }

    let sellerId = listing.sellerUserId;
    let advertiserPhone = listing.contacto;

    // Rueda / huérfanos: crear cuenta stub del anunciante con su número
    if (!sellerId && listing.source === 'adiso') {
      const ensured = await ensureAdisoSellerUserId(adisoId);
      if (ensured?.sellerUserId) {
        sellerId = ensured.sellerUserId;
        advertiserPhone = ensured.phone || listing.contacto;
        listing = { ...listing, sellerUserId: sellerId };
      }
    }

    if (!sellerId) {
      return NextResponse.json({ error: 'Vendedor no registrado en la app' }, { status: 422 });
    }

    const resolvedSellerId: string = sellerId;

    if (resolvedSellerId === user.id) {
      return NextResponse.json({ error: 'No puedes contactarte a ti mismo' }, { status: 400 });
    }

    const leadCapture = isLeadCaptureAd({
      estaActivo: listing.estaActivo,
      fechaExpiracion: listing.fechaExpiracion || undefined,
      esHistorico: listing.esHistorico,
      fechaPublicacion: listing.fechaPublicacion || undefined,
      fechaPublicacionOriginal: listing.fechaPublicacionOriginal || undefined,
    });

    const result = await openAdInteraction({
      viewerUserId: user.id,
      adisoId: listing.id,
      adisoTitle: listing.titulo,
      sellerUserId: resolvedSellerId,
      // Para caducados el "seller" es stub/ops: no spamear push al stub
      notifySeller: leadCapture ? false : Boolean(notifySeller),
    });

    if (result.isNew) {
      await registrarContacto(user.id, listing.id, listing.categoria || 'productos', 'chat');
    }

    let opsWhatsAppUrl: string | undefined;
    if (leadCapture) {
      const baseUrl =
        request.headers.get('origin') ||
        process.env.NEXT_PUBLIC_SITE_URL ||
        'https://www.buscadis.com';
      opsWhatsAppUrl = getOpsLeadWhatsAppUrl(
        {
          id: listing.id,
          titulo: listing.titulo,
          categoria: (listing.categoria as any) || 'productos',
          edicionNumero: listing.edicionNumero || undefined,
          contacto: advertiserPhone || listing.contacto || '',
        },
        { baseUrl, advertiserPhone }
      );

      try {
        const contactoUsuario =
          (user.phone as string | undefined) ||
          (user.email as string | undefined) ||
          user.id;
        await registrarInteresAnuncioCaducado(
          listing.id,
          user.id,
          contactoUsuario,
          `Lead via chat. Anunciante: ${advertiserPhone || 's/n'}`
        );
      } catch (e) {
        console.warn('[interactions/open] interes caducado', e);
      }
    }

    return NextResponse.json({
      ...result,
      adisoTitle: listing.titulo,
      leadCapture,
      opsWhatsAppUrl,
      sellerUserId: resolvedSellerId,
    });
  } catch (e) {
    console.error('[interactions/open]', e);
    return NextResponse.json({ error: 'Error al abrir interacción' }, { status: 500 });
  }
}

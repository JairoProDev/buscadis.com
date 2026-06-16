import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserFromRouteRequest } from '@/lib/supabase-route-auth';
import { PAQUETES, TamañoPaquete } from '@/types';
import {
  createPackageOrder,
  getPackagePrice,
  isPackageDevBypassEnabled,
} from '@/lib/packages/server';
import { createMercadoPagoPreference, isMercadoPagoConfigured } from '@/lib/mercadopago';
import { matchInterestedUsers } from '@/lib/matching/server';
import { applyPaidTierToAdiso } from '@/lib/publish/paid-publish';
import { createAdisoInSupabase } from '@/lib/supabase';
import { runInstantMatchCampaign } from '@/lib/activation/instant-match';
import {
  linkUserDemandIntentOnPublish,
  processBothPaidMatchesForDemandAdiso,
} from '@/lib/matching/both-paid';
import { supabaseAdmin } from '@/lib/supabase-admin';

const bodySchema = z.object({
  packageTier: z.enum(['miniatura', 'pequeño', 'mediano', 'grande', 'gigante']),
  draft: z.object({
    id: z.string().optional(),
    categoria: z.string(),
    titulo: z.string(),
    descripcion: z.string(),
    contacto: z.string(),
    ubicacion: z.unknown().optional(),
    tamaño: z.string().optional(),
    imagenesUrls: z.array(z.string()).optional(),
    imagenUrl: z.string().optional(),
    fechaPublicacion: z.string().optional(),
    horaPublicacion: z.string().optional(),
    user_id: z.string().optional(),
  }),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRouteRequest(request);
    if (!user?.id) {
      return NextResponse.json({ error: 'Debes iniciar sesión' }, { status: 401 });
    }

    const json = (await request.json()) as unknown;
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }

    const { packageTier, draft } = parsed.data;
    const tier = packageTier as TamañoPaquete;
    const amount = getPackagePrice(tier);

    const interested = await matchInterestedUsers(
      {
        categoria: draft.categoria,
        titulo: draft.titulo,
        descripcion: draft.descripcion,
        ubicacion:
          typeof draft.ubicacion === 'object' && draft.ubicacion
            ? (draft.ubicacion as Record<string, unknown>)
            : {},
      },
      50
    );

    if (isPackageDevBypassEnabled() || amount === 0) {
      const adiso = await createAdisoInSupabase(
        applyPaidTierToAdiso(
          {
            ...draft,
            tamaño: tier,
            user_id: user.id,
            usuario_id: user.id,
            estaActivo: true,
            esHistorico: false,
          } as Parameters<typeof createAdisoInSupabase>[0],
          tier
        )
      );

      const { onAdisoSearchIndexUpdate } = await import('@/lib/search/post-create');
      onAdisoSearchIndexUpdate(adiso);

      const order = await createPackageOrder({
        userId: user.id,
        packageTier: tier,
        draftPayload: draft as Record<string, unknown>,
        status: 'dev_bypass',
        adisoId: adiso.id,
      });

      if (order) {
        await supabaseAdmin
          .from('adiso_package_orders')
          .update({
            interested_users_count: interested.length,
            fulfilled_at: new Date().toISOString(),
          })
          .eq('id', order.id);
      }

      await runInstantMatchCampaign({
        adisoId: adiso.id,
        advertiserUserId: user.id,
        titulo: draft.titulo,
        descripcion: draft.descripcion,
        categoria: draft.categoria,
      });

      await linkUserDemandIntentOnPublish(user.id, adiso.id, draft.categoria);
      await processBothPaidMatchesForDemandAdiso(adiso.id);

      return NextResponse.json({
        status: 'fulfilled',
        adiso,
        interestedCount: interested.length,
      });
    }

    if (!isMercadoPagoConfigured()) {
      return NextResponse.json({ error: 'Pagos no configurados' }, { status: 503 });
    }

    const order = await createPackageOrder({
      userId: user.id,
      packageTier: tier,
      draftPayload: draft as Record<string, unknown>,
    });

    if (!order) {
      return NextResponse.json({ error: 'No se pudo crear la orden' }, { status: 500 });
    }

    await supabaseAdmin
      .from('adiso_package_orders')
      .update({ interested_users_count: interested.length })
      .eq('id', order.id);

    const preference = await createMercadoPagoPreference({
      orderId: order.id,
      title: `Publicar anuncio ${PAQUETES[tier].nombre} — Buscadis`,
      unitPricePen: amount,
      payerEmail: user.email,
      kind: 'package',
    });

    if (!preference) {
      return NextResponse.json({ error: 'No se pudo iniciar el pago' }, { status: 502 });
    }

    await supabaseAdmin
      .from('adiso_package_orders')
      .update({ mp_preference_id: preference.preferenceId })
      .eq('id', order.id);

    return NextResponse.json({
      status: 'pending',
      orderId: order.id,
      initPoint: preference.initPoint,
      interestedCount: interested.length,
    });
  } catch (e) {
    console.error('[package]', e);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

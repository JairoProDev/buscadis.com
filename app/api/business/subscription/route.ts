import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { getUserFromRouteRequest } from '@/lib/supabase-route-auth';
import { getBusinessProfileBySlug } from '@/lib/business';
import { getBusinessMemberRole } from '@/lib/business-access';
import { supabaseAdmin } from '@/lib/supabase-admin';
import {
  createMercadoPagoPreference,
  isMercadoPagoConfigured,
} from '@/lib/mercadopago';
import {
  PROFILE_PUBLISH_MONTHLY_PEN,
  canPublishProfile,
} from '@/lib/business/subscription';

/**
 * POST /api/business/subscription
 * Creates a MercadoPago Checkout Pro preference for the Buscadis Pro plan (S/30).
 * Body: { slug?: string, businessId?: string }
 */
export async function POST(req: NextRequest) {
  const user = await getUserFromRouteRequest(req);
  if (!user?.id) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  if (!isMercadoPagoConfigured()) {
    return NextResponse.json(
      { error: 'Pagos no configurados. Contacta soporte o activa PUBLISH_DEV_BYPASS en desarrollo.' },
      { status: 503 }
    );
  }

  const body = (await req.json()) as { slug?: string; businessId?: string };
  if (!body.slug && !body.businessId) {
    return NextResponse.json({ error: 'slug o businessId requerido' }, { status: 400 });
  }

  let profile = body.slug ? await getBusinessProfileBySlug(body.slug) : null;
  if (!profile && body.businessId) {
    const { data } = await supabaseAdmin
      .from('business_profiles')
      .select('*')
      .eq('id', body.businessId)
      .maybeSingle();
    profile = data;
  }
  if (!profile) {
    return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 });
  }

  const role = await getBusinessMemberRole(user.id, profile.id);
  if (profile.user_id !== user.id && (!role || !['owner', 'admin'].includes(role))) {
    return NextResponse.json({ error: 'Sin permiso' }, { status: 403 });
  }

  if (canPublishProfile(profile)) {
    return NextResponse.json({ error: 'Ya tienes plan Pro activo', alreadyActive: true }, { status: 400 });
  }

  const orderId = `bizsub_${nanoid(12)}`;
  const { data: subRow, error: subErr } = await supabaseAdmin
    .from('business_subscriptions')
    .insert({
      business_profile_id: profile.id,
      tier: 'pro',
      status: 'pending',
      amount_pen: PROFILE_PUBLISH_MONTHLY_PEN,
      external_order_id: orderId,
    })
    .select('id')
    .single();

  if (subErr || !subRow) {
    console.error('[subscription]', subErr);
    return NextResponse.json({ error: 'Error al crear suscripción' }, { status: 500 });
  }

  const preference = await createMercadoPagoPreference({
    orderId,
    title: `Buscadis Pro — ${profile.name || 'Tu negocio'}`,
    unitPricePen: PROFILE_PUBLISH_MONTHLY_PEN,
    payerEmail: user.email,
    kind: 'business_subscription',
    metadata: {
      business_profile_id: profile.id,
      slug: profile.slug || '',
    },
  });

  if (!preference) {
    return NextResponse.json({ error: 'Error al crear preferencia de pago' }, { status: 502 });
  }

  await supabaseAdmin
    .from('business_subscriptions')
    .update({
      mercadopago_preference_id: preference.preferenceId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', subRow.id);

  return NextResponse.json({
    initPoint: preference.initPoint,
    sandboxInitPoint: preference.sandboxInitPoint,
    orderId,
    amountPen: PROFILE_PUBLISH_MONTHLY_PEN,
  });
}

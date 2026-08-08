/**
 * POST /api/business/[businessId]/review-invite
 * businessId = slug público. Dueño autenticado obtiene enlace de captura.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRouteRequest } from '@/lib/supabase-route-auth';
import { getBusinessProfileBySlug } from '@/lib/business';
import { supabaseAdmin } from '@/lib/supabase-admin';
import {
  crearTokenResenaInvite,
  rutaResenaInvite,
} from '@/lib/business/review-invite-token';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  const user = await getUserFromRouteRequest(req);
  if (!user?.id) {
    return NextResponse.json({ error: 'Inicia sesión' }, { status: 401 });
  }

  const { businessId } = await params;
  const slug = decodeURIComponent(businessId);
  const profile = await getBusinessProfileBySlug(slug);
  if (!profile) {
    return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 });
  }

  let authorized = profile.user_id === user.id;
  if (!authorized && supabaseAdmin) {
    const { data: membership } = await supabaseAdmin
      .from('business_members')
      .select('role')
      .eq('business_profile_id', profile.id)
      .eq('user_id', user.id)
      .maybeSingle();
    authorized = Boolean(membership);
  }
  if (!authorized) {
    return NextResponse.json({ error: 'Sin permiso' }, { status: 403 });
  }

  const token = crearTokenResenaInvite({
    negocioId: profile.id,
    slug: profile.slug,
    nombre: profile.name,
  });
  const path = rutaResenaInvite(token);
  const origin = new URL(req.url).origin;
  const url = `${origin}${path}`;

  const waText = encodeURIComponent(
    `Hola, ¿cómo te fue con ${profile.name}? Califica en 5 segundos:\n${url}`
  );
  const waShare = profile.contact_whatsapp
    ? `https://wa.me/?text=${waText}`
    : `https://wa.me/?text=${waText}`;

  return NextResponse.json({
    success: true,
    url,
    path,
    waShare,
    expiresInDays: 30,
  });
}

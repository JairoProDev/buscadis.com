import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRouteRequest } from '@/lib/supabase-route-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

const REASONS = [
  'no_llego',
  'cobro_incorrecto',
  'trato',
  'dano_paquete',
  'seguridad',
  'otro',
] as const;

export async function POST(request: NextRequest) {
  const user = await getUserFromRouteRequest(request);
  if (!user?.id) {
    return NextResponse.json({ error: 'Debes iniciar sesión' }, { status: 401 });
  }

  let body: {
    request_id?: string;
    reason?: string;
    details?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  if (!body.request_id || !body.reason) {
    return NextResponse.json(
      { error: 'request_id y reason requeridos' },
      { status: 400 }
    );
  }
  if (!REASONS.includes(body.reason as (typeof REASONS)[number])) {
    return NextResponse.json({ error: 'Motivo inválido' }, { status: 400 });
  }

  const { data: req } = await supabaseAdmin
    .from('moto_requests')
    .select('id, requester_id, rider_id, status')
    .eq('id', body.request_id)
    .maybeSingle();

  if (!req) {
    return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
  }

  const { data: rider } = await supabaseAdmin
    .from('moto_riders')
    .select('id, user_id')
    .eq('user_id', user.id)
    .maybeSingle();

  const isParty =
    req.requester_id === user.id ||
    (rider && req.rider_id === rider.id);

  if (!isParty) {
    return NextResponse.json({ error: 'Sin permiso' }, { status: 403 });
  }

  const { data, error } = await supabaseAdmin
    .from('moto_claims')
    .insert({
      request_id: body.request_id,
      opened_by: user.id,
      reason: body.reason,
      details: (body.details || '').trim().slice(0, 2000) || null,
      status: 'abierto',
    })
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Notify admins lightly via notifications table if any admin exists
  const { data: admins } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('rol', 'admin')
    .limit(5);

  if (admins?.length) {
    await supabaseAdmin.from('notifications').insert(
      admins.map((a) => ({
        user_id: a.id,
        type: 'system',
        title: 'Nuevo reclamo Envíos',
        message: `Motivo: ${body.reason} · pedido ${body.request_id}`,
        data: { kind: 'moto_claim', claim_id: data.id, request_id: body.request_id },
      }))
    );
  }

  return NextResponse.json({ claim: data }, { status: 201 });
}

export async function GET(request: NextRequest) {
  const user = await getUserFromRouteRequest(request);
  if (!user?.id) {
    return NextResponse.json({ error: 'Debes iniciar sesión' }, { status: 401 });
  }

  const requestId = request.nextUrl.searchParams.get('request_id');
  if (!requestId) {
    return NextResponse.json({ error: 'request_id requerido' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('moto_claims')
    .select('*')
    .eq('request_id', requestId)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ claims: data || [] });
}

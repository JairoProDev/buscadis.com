import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRouteRequest } from '@/lib/supabase-route-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const user = await getUserFromRouteRequest(request);
  if (!user?.id) {
    return NextResponse.json({ error: 'Debes iniciar sesión' }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from('moto_favorites')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ favorites: data || [] });
}

export async function POST(request: NextRequest) {
  const user = await getUserFromRouteRequest(request);
  if (!user?.id) {
    return NextResponse.json({ error: 'Debes iniciar sesión' }, { status: 401 });
  }

  let body: {
    label?: string;
    pickup?: {
      lat: number;
      lng: number;
      text: string;
      zona?: string | null;
    };
    dropoff?: {
      lat: number;
      lng: number;
      text: string;
      zona?: string | null;
    };
    from_request_id?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  if (body.from_request_id) {
    const { data: req } = await supabaseAdmin
      .from('moto_requests')
      .select('*')
      .eq('id', body.from_request_id)
      .eq('requester_id', user.id)
      .maybeSingle();
    if (!req) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
    }
    body.pickup = {
      lat: Number(req.pickup_lat),
      lng: Number(req.pickup_lng),
      text: req.pickup_text,
      zona: req.pickup_zona,
    };
    body.dropoff = {
      lat: Number(req.dropoff_lat),
      lng: Number(req.dropoff_lng),
      text: req.dropoff_text,
      zona: req.dropoff_zona,
    };
    body.label =
      body.label ||
      `${req.pickup_text.slice(0, 24)} → ${req.dropoff_text.slice(0, 24)}`;
  }

  if (
    !body.pickup?.lat ||
    !body.pickup?.lng ||
    !body.dropoff?.lat ||
    !body.dropoff?.lng
  ) {
    return NextResponse.json({ error: 'Ruta incompleta' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('moto_favorites')
    .insert({
      user_id: user.id,
      label: (body.label || 'Mi ruta').slice(0, 80),
      pickup_lat: body.pickup.lat,
      pickup_lng: body.pickup.lng,
      pickup_text: body.pickup.text,
      pickup_zona: body.pickup.zona || null,
      dropoff_lat: body.dropoff.lat,
      dropoff_lng: body.dropoff.lng,
      dropoff_text: body.dropoff.text,
      dropoff_zona: body.dropoff.zona || null,
    })
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ favorite: data }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const user = await getUserFromRouteRequest(request);
  if (!user?.id) {
    return NextResponse.json({ error: 'Debes iniciar sesión' }, { status: 401 });
  }
  const id = request.nextUrl.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'id requerido' }, { status: 400 });
  }
  const { error } = await supabaseAdmin
    .from('moto_favorites')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

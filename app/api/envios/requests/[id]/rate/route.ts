import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRouteRequest } from '@/lib/supabase-route-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, ctx: Ctx) {
  const user = await getUserFromRouteRequest(request);
  if (!user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await ctx.params;
  let body: { stars?: number; comment?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const stars = Number(body.stars);
  if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
    return NextResponse.json({ error: 'Calificación 1-5 requerida' }, { status: 400 });
  }

  const { data: req } = await supabaseAdmin
    .from('moto_requests')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (!req || req.status !== 'entregado') {
    return NextResponse.json(
      { error: 'Solo puedes calificar envíos entregados' },
      { status: 400 }
    );
  }

  if (req.requester_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (!req.rider_id) {
    return NextResponse.json({ error: 'Sin motorizado asignado' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('moto_ratings')
    .upsert(
      {
        request_id: id,
        from_user_id: user.id,
        to_rider_id: req.rider_id,
        stars,
        comment: body.comment?.trim() || null,
      },
      { onConflict: 'request_id,from_user_id' }
    )
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ rating: data });
}

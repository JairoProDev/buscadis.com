import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRouteRequest } from '@/lib/supabase-route-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { z } from 'zod';

const schema = z.object({
  handle: z.string().min(3).max(30).regex(/^[a-z0-9_]+$/),
  bio: z.string().max(200).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRouteRequest(request);
    if (!user?.id) {
      return NextResponse.json({ error: 'Debes iniciar sesión' }, { status: 401 });
    }

    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Handle inválido (a-z, 0-9, _)' }, { status: 400 });
    }

    const { handle, bio } = parsed.data;

    const { data, error } = await supabaseAdmin
      .from('creator_profiles')
      .upsert(
        {
          user_id: user.id,
          handle,
          bio: bio || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )
      .select('*')
      .single();

    if (error) {
      if (error.message.includes('unique')) {
        return NextResponse.json({ error: 'Handle ya en uso' }, { status: 409 });
      }
      throw error;
    }

    return NextResponse.json({ success: true, profile: data });
  } catch (e) {
    console.error('[api/deals/creator]', e);
    return NextResponse.json({ error: 'Error al guardar perfil' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const handle = request.nextUrl.searchParams.get('handle');
  if (!handle) {
    return NextResponse.json({ error: 'handle required' }, { status: 400 });
  }

  const { data } = await supabaseAdmin
    .from('creator_profiles')
    .select('*')
    .eq('handle', handle)
    .maybeSingle();

  if (!data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ profile: data });
}

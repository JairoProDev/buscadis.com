import { NextRequest, NextResponse } from 'next/server';
import { getLiveSessionsServer } from '@/lib/deals/server';
import { getUserFromRouteRequest } from '@/lib/supabase-route-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const sessions = await getLiveSessionsServer();
    return NextResponse.json({ sessions });
  } catch (e) {
    console.error('[api/deals/live GET]', e);
    return NextResponse.json({ sessions: [] });
  }
}

const schema = z.object({
  title: z.string().min(3).max(120),
  embedUrl: z.string().url().optional(),
  streamUrl: z.string().url().optional(),
  pinnedAdisoIds: z.array(z.string()).optional(),
});

/** Fase 3: crear sesión live (embed bridge hasta streaming nativo) */
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRouteRequest(request);
    if (!user?.id) {
      return NextResponse.json({ error: 'Debes iniciar sesión' }, { status: 401 });
    }

    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }

    const { title, embedUrl, streamUrl, pinnedAdisoIds } = parsed.data;

    const { data, error } = await supabaseAdmin
      .from('deal_live_sessions')
      .insert({
        host_user_id: user.id,
        title,
        embed_url: embedUrl || null,
        stream_url: streamUrl || null,
        status: embedUrl || streamUrl ? 'live' : 'scheduled',
        started_at: embedUrl || streamUrl ? new Date().toISOString() : null,
        pinned_adiso_ids: pinnedAdisoIds || [],
      })
      .select('*')
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, session: data });
  } catch (e) {
    console.error('[api/deals/live POST]', e);
    return NextResponse.json({ error: 'Error al crear live' }, { status: 500 });
  }
}

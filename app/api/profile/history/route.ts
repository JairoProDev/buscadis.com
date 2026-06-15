import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserFromRouteRequest } from '@/lib/supabase-route-auth';
import { getViewHistoryServer, recordViewHistoryServer } from '@/lib/profile/server';
import { getAdisoByIdFromDb } from '@/lib/profile/adiso-fetch';

export const dynamic = 'force-dynamic';

const postSchema = z.object({
  adisoId: z.string().optional(),
  storyId: z.string().uuid().optional(),
  businessProfileId: z.string().uuid().optional(),
  source: z.enum(['feed', 'story', 'search', 'direct']).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRouteRequest(request);
    if (!user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const rows = await getViewHistoryServer(user.id, 50);
    const enriched = await Promise.all(
      rows.map(async (row) => {
        let adiso = null;
        if (row.adiso_id) {
          adiso = await getAdisoByIdFromDb(row.adiso_id);
        }
        return { ...row, adiso };
      })
    );

    return NextResponse.json({ history: enriched });
  } catch (e) {
    console.error('[api/profile/history GET]', e);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRouteRequest(request);
    if (!user?.id) {
      return NextResponse.json({ ok: true, skipped: 'guest' });
    }

    const parsed = postSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }

    await recordViewHistoryServer(user.id, parsed.data);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[api/profile/history POST]', e);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

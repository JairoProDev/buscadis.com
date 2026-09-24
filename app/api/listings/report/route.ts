import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getUserFromRouteRequest } from '@/lib/supabase-route-auth';
import { rateLimit, getClientIP } from '@/lib/rate-limit';

const bodySchema = z.object({
  listingId: z.string().min(1).max(128),
  listingKind: z.enum(['adiso', 'catalog_product']).default('adiso'),
  reason: z.enum(['spam', 'scam', 'offensive', 'duplicate', 'wrong_category', 'other']),
  details: z.string().max(2000).optional(),
  categoria: z.string().max(64).optional(),
  title: z.string().max(500).optional(),
});

export async function POST(request: NextRequest) {
  const ip = getClientIP(request);
  const limited = rateLimit(`listing-report-${ip}`, { windowMs: 60_000, maxRequests: 15 });
  if (!limited.allowed) {
    return NextResponse.json({ error: 'Demasiados reportes. Espera un momento.' }, { status: 429 });
  }

  const user = await getUserFromRouteRequest(request);
  if (!user) {
    return NextResponse.json({ error: 'Debes iniciar sesión para reportar' }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
  }

  const { listingId, listingKind, reason, details, categoria, title } = parsed.data;

  const { error } = await supabaseAdmin.from('listing_reports').insert({
    reporter_id: user.id,
    listing_id: listingId,
    listing_kind: listingKind,
    reason,
    details: details || null,
    status: 'open',
    metadata: {
      categoria: categoria || null,
      title: title || null,
      user_agent: request.headers.get('user-agent')?.slice(0, 300) || null,
    },
  });

  if (error) {
    if (error.code === 'PGRST205' || error.message?.includes('listing_reports')) {
      console.error('[listing report] table missing:', error.message);
      return NextResponse.json({ error: 'Reportes no disponibles temporalmente' }, { status: 503 });
    }
    console.error('[listing report]', error.message);
    return NextResponse.json({ error: 'No se pudo guardar el reporte' }, { status: 500 });
  }

  await supabaseAdmin.from('behavioral_events').insert({
    user_id: user.id,
    event_type: 'ad.report',
    entity_type: 'adiso',
    entity_id: listingId,
    payload: { reason, listing_kind: listingKind, categoria },
    score_delta: 0,
  });

  return NextResponse.json({ success: true });
}

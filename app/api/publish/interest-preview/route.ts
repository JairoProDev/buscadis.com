import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { rateLimit, getClientIP } from '@/lib/rate-limit';
import { matchInterestedUsers } from '@/lib/matching/server';
import { getPreviewCache, setPreviewCache, previewCacheKey } from '@/lib/matching/preview-cache';
import { supabaseAdmin } from '@/lib/supabase-admin';

const querySchema = z.object({
  categoria: z.string().min(1),
  titulo: z.string().min(1).max(300),
  descripcion: z.string().max(5000).optional(),
  ubicacion: z.string().optional(),
});

async function getDemandByZone(categoria: string): Promise<{ zone: string; count: number }[]> {
  const { data } = await supabaseAdmin
    .from('demand_intents')
    .select('ubicacion')
    .eq('status', 'active')
    .eq('categoria', categoria)
    .limit(200);

  const counts: Record<string, number> = {};
  for (const row of data || []) {
    const ubi = row.ubicacion as Record<string, unknown> | null;
    const zone =
      (typeof ubi?.distrito === 'string' && ubi.distrito) ||
      (typeof ubi?.departamento === 'string' && ubi.departamento) ||
      (typeof ubi?.label === 'string' && ubi.label) ||
      'Otras zonas';
    counts[zone] = (counts[zone] || 0) + 1;
  }

  return Object.entries(counts)
    .map(([zone, count]) => ({ zone, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
}

export async function GET(request: NextRequest) {
  const ip = getClientIP(request);
  const limited = rateLimit(`interest-preview-${ip}`, { windowMs: 60_000, maxRequests: 40 });
  if (!limited.allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  const params = request.nextUrl.searchParams;
  const parsed = querySchema.safeParse({
    categoria: params.get('categoria'),
    titulo: params.get('titulo'),
    descripcion: params.get('descripcion') || '',
    ubicacion: params.get('ubicacion') || undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid draft params' }, { status: 400 });
  }

  const { categoria, titulo, descripcion, ubicacion } = parsed.data;
  const cacheKey = previewCacheKey({ categoria, titulo, descripcion: descripcion || '', ubicacion: ubicacion || '' });
  const cached = getPreviewCache<{
    count: number;
    interested: unknown[];
    demandByZone: { zone: string; count: number }[];
    message: string;
  }>(cacheKey);

  if (cached) {
    return NextResponse.json(cached);
  }

  try {
    const [interested, demandByZone] = await Promise.all([
      matchInterestedUsers(
        {
          categoria,
          titulo,
          descripcion: descripcion || '',
          ubicacion: ubicacion ? { label: ubicacion } : {},
        },
        50
      ),
      getDemandByZone(categoria),
    ]);

    const payload = {
      count: interested.length,
      interested: interested.slice(0, 10).map((u) => ({
        matchScore: Math.round(u.matchScore * 100),
        reasons: u.matchReasons,
        hint: u.queryHint,
        locationHint: u.locationHint,
        lastActiveAt: u.lastActiveAt,
      })),
      demandByZone,
      message:
        interested.length > 0
          ? `${interested.length} personas podrían estar interesadas en tu oferta`
          : 'Aún estamos detectando demanda para esta categoría',
    };

    setPreviewCache(cacheKey, payload);
    return NextResponse.json(payload);
  } catch (e) {
    console.error('[interest-preview]', e);
    return NextResponse.json({ count: 0, interested: [], demandByZone: [], message: 'Preview no disponible' });
  }
}

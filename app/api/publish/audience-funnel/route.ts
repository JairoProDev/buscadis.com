import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { rateLimit, getClientIP } from '@/lib/rate-limit';
import { matchInterestedUsers } from '@/lib/matching/server';
import { estimateAudienceFunnel, scaleReachByRate, FUNNEL_CHANNELS } from '@/lib/publish/audience-estimates';
import { estimateDailyReach } from '@/lib/publish/pricing';
import { getPreviewCache, setPreviewCache, previewCacheKey } from '@/lib/matching/preview-cache';
import { supabaseAdmin } from '@/lib/supabase-admin';

const querySchema = z.object({
  categoria: z.string().optional(),
  subcategoria: z.string().optional(),
  titulo: z.string().optional(),
  descripcion: z.string().optional(),
  dailyRate: z.coerce.number().optional(),
});

async function countDemandIntents(categoria?: string, subcategoria?: string): Promise<number> {
  let q = supabaseAdmin.from('demand_intents').select('id', { count: 'exact', head: true }).eq('status', 'active');
  if (categoria) q = q.eq('categoria', categoria);
  const { count } = await q;
  return count ?? 0;
}

export async function GET(request: NextRequest) {
  const ip = getClientIP(request);
  const limited = rateLimit(`audience-funnel-${ip}`, { windowMs: 60_000, maxRequests: 40 });
  if (!limited.allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  const params = request.nextUrl.searchParams;
  const parsed = querySchema.safeParse({
    categoria: params.get('categoria') || undefined,
    subcategoria: params.get('subcategoria') || undefined,
    titulo: params.get('titulo') || undefined,
    descripcion: params.get('descripcion') || undefined,
    dailyRate: params.get('dailyRate') || 5,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid params' }, { status: 400 });
  }

  const { categoria, subcategoria, titulo, descripcion, dailyRate = 5 } = parsed.data;

  const cacheKey = previewCacheKey({
    categoria: categoria || '',
    titulo: titulo || '',
    descripcion: descripcion || '',
    ubicacion: subcategoria || '',
  });

  const cached = getPreviewCache<unknown>(`funnel-${cacheKey}`);
  if (cached) return NextResponse.json(cached);

  let specificMatchCount = 0;
  let interested: unknown[] = [];

  if (categoria && titulo && titulo.length >= 4) {
    const matches = await matchInterestedUsers(
      { categoria, titulo, descripcion: descripcion || '', facets: { subcategoria } },
      20
    );
    specificMatchCount = matches.length;
    interested = matches.slice(0, 5).map((u) => ({
      matchScore: Math.round(u.matchScore * 100),
      reasons: u.matchReasons,
      hint: u.queryHint,
    }));
  }

  const demandCount = await countDemandIntents(categoria, subcategoria);

  const funnel = estimateAudienceFunnel({
    categoria,
    subcategoria,
    titulo,
    descripcion,
    dailyRate,
    specificMatchCount: Math.max(specificMatchCount, demandCount > 0 ? Math.round(demandCount * 0.1) : 0),
  });

  if (demandCount > 0) {
    funnel.B = Math.max(funnel.B, demandCount);
    funnel.C = categoria ? Math.max(funnel.C, Math.round(demandCount * 0.6)) : funnel.C;
    funnel.D = subcategoria ? Math.max(funnel.D, Math.round(demandCount * 0.3)) : funnel.D;
  }

  const payload = {
    funnel,
    interested,
    reachEstimate: scaleReachByRate(estimateDailyReach(dailyRate), dailyRate),
    dailyReach: estimateDailyReach(dailyRate),
    channels: FUNNEL_CHANNELS,
    message:
      funnel.E > 0
        ? `${funnel.E} personas podrían estar interesadas en tu aviso específico`
        : 'Completa tu aviso para ver el potencial de alcance',
  };

  setPreviewCache(`funnel-${cacheKey}`, payload);
  return NextResponse.json(payload);
}

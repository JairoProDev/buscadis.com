import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

/**
 * Feed corpus normalizado para ADIS AI / indexación interna (08-SEO-AEO).
 * GET /api/feed/negocios?desde=ISO&limit=50
 * Auth: Bearer CRON_SECRET o FEED_SECRET.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.FEED_SECRET || process.env.CRON_SECRET;
  const auth = req.headers.get('authorization') || '';
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'No admin' }, { status: 503 });
  }

  const url = new URL(req.url);
  const desde = url.searchParams.get('desde');
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit') || 50)));

  let q = supabaseAdmin
    .from('business_profiles')
    .select(
      'id, slug, name, tagline, description, contact_whatsapp, contact_address, theme_color, subscription_tier, verification_tier, is_published, updated_at, profile_layout'
    )
    .eq('is_published', true)
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (desde) {
    q = q.gte('updated_at', desde);
  }

  const { data, error } = await q;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const items = (data || []).map((row) => ({
    id: row.id,
    slug: row.slug,
    nombre: row.name,
    eslogan: row.tagline,
    descripcion: typeof row.description === 'string' ? row.description.slice(0, 500) : null,
    whatsapp: row.contact_whatsapp,
    direccion: row.contact_address,
    plan: row.subscription_tier || 'free',
    verificacion: row.verification_tier,
    perfilVivo: Boolean(
      (row.profile_layout as { perfil_vivo_enabled?: boolean } | null)?.perfil_vivo_enabled
    ),
    actualizadoEn: row.updated_at,
    url: row.slug ? `https://www.buscadis.com/@${row.slug}` : null,
  }));

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    count: items.length,
    items,
  });
}

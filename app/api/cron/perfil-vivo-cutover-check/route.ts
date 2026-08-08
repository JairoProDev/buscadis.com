import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import {
  evaluateHardCutoverReady,
  isPerfilVivoHardCutover,
  listPerfilVivoEnvCohort,
  perfilVivoHardCutoverThreshold,
} from '@/lib/business/perfil-vivo-flag';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Cron / ops: mide cohort Perfil Vivo vs publicados.
 * Si ratio ≥ PERFIL_VIVO_HARD_CUTOVER_THRESHOLD → ready=true (activar HARD_CUTOVER a mano).
 *
 * Auth: Authorization: Bearer CRON_SECRET (igual que otros crons).
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get('authorization') || '';
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (isPerfilVivoHardCutover()) {
    return NextResponse.json({
      hardCutover: true,
      message: 'PERFIL_VIVO_HARD_CUTOVER ya activo — legacy público desactivado',
      envCohort: listPerfilVivoEnvCohort(),
    });
  }

  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'No admin client' }, { status: 503 });
  }

  const { data: published, error } = await supabaseAdmin
    .from('business_profiles')
    .select('id, slug, profile_layout')
    .eq('is_published', true)
    .limit(5000);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = published || [];
  const envSet = new Set(listPerfilVivoEnvCohort());
  let enabled = 0;
  for (const row of rows) {
    const layout = row.profile_layout as { perfil_vivo_enabled?: boolean } | null;
    const slug = typeof row.slug === 'string' ? row.slug.toLowerCase() : '';
    if (layout?.perfil_vivo_enabled === true || (slug && envSet.has(slug))) {
      enabled += 1;
    }
  }

  const evalResult = evaluateHardCutoverReady(
    enabled,
    rows.length,
    perfilVivoHardCutoverThreshold()
  );

  return NextResponse.json({
    hardCutover: false,
    published: rows.length,
    enabled,
    ...evalResult,
    envCohort: listPerfilVivoEnvCohort(),
    action: evalResult.ready
      ? 'Set PERFIL_VIVO_HARD_CUTOVER=1 to remove legacy storefront for all public profiles'
      : 'Keep soft/opt-in cutover',
  });
}

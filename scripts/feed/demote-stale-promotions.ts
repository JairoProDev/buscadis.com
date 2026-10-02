/**
 * Quita promotion_rank a anuncios antiguos sin promoción vigente (ruido legacy en feed).
 *   npx tsx scripts/feed/demote-stale-promotions.ts --apply
 */
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function main() {
  const apply = process.argv.includes('--apply');
  const { supabaseAdmin } = await import('../../lib/supabase-admin');
  const now = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from('adisos')
    .select('id, titulo, fecha_publicacion, promotion_tier, promotion_rank, promotion_expires_at')
    .eq('esta_activo', true)
    .lt('fecha_publicacion', '2025-01-01')
    .gt('promotion_rank', 0);

  if (error) throw error;

  const stale = (data ?? []).filter((row) => {
    const exp = row.promotion_expires_at as string | null;
    if (!exp) return true;
    const t = new Date(exp).getTime();
    return Number.isNaN(t) || t < Date.now();
  });

  console.log(JSON.stringify({ candidates: stale.length, sample: stale.slice(0, 5) }, null, 2));

  if (!apply || !stale.length) return;

  const ids = stale.map((r) => r.id);
  for (let i = 0; i < ids.length; i += 50) {
    const chunk = ids.slice(i, i + 50);
    const { error: upErr } = await supabaseAdmin
      .from('adisos')
      .update({ promotion_rank: 0, promotion_tier: 'gratis' })
      .in('id', chunk);
    if (upErr) console.error(upErr.message);
  }
  console.log('done');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

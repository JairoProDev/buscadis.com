/**
 * Repara en BD títulos cortados al inicio (batch Rueda y similares).
 *
 *   npx tsx scripts/repair-shaved-titles.ts
 *   npx tsx scripts/repair-shaved-titles.ts --apply
 */
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });
dotenv.config({ path: path.join(process.cwd(), '.env') });

import { supabaseAdmin } from '../lib/supabase-admin';
import { isMidWordTitleFragment, repairMidWordTitle } from '../lib/adiso-title-repair';
import { repairListingTitle } from '../lib/rueda/listing-quality';

const apply = process.argv.includes('--apply');

async function main() {
  const { data: rows, error } = await supabaseAdmin
    .from('adisos')
    .select('id, titulo, descripcion, private_data')
    .eq('esta_activo', true);

  if (error) throw error;

  let candidates = 0;
  let updated = 0;

  for (const row of rows || []) {
    const titulo = String(row.titulo || '');
    const descripcion = String(row.descripcion || '');
    const priv = (row.private_data || {}) as Record<string, unknown>;
    const textoRaw = typeof priv.texto_raw === 'string' ? priv.texto_raw : '';

    if (!isMidWordTitleFragment(titulo)) continue;
    candidates++;

    const nuevoTitulo = repairListingTitle(
      titulo,
      textoRaw || `${titulo} ${descripcion}`,
      descripcion,
    );

    if (nuevoTitulo === titulo || nuevoTitulo.length < 8) continue;

    console.log(`\n${row.id}`);
    console.log(`  antes: ${titulo.slice(0, 72)}…`);
    console.log(`  después: ${nuevoTitulo.slice(0, 72)}…`);

    if (apply) {
      const { error: upErr } = await supabaseAdmin
        .from('adisos')
        .update({ titulo: nuevoTitulo.slice(0, 120) })
        .eq('id', row.id);
      if (upErr) console.error('  error:', upErr.message);
      else updated++;
    }
  }

  console.log(`\nCandidatos: ${candidates}, actualizados: ${apply ? updated : 0} (dry-run: ${!apply})`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

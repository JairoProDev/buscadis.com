/**
 * Carga todas las ediciones con avisos.json en Supabase rueda_* (sin publicar adisos web).
 *
 *   npx tsx scripts/rueda/batch-load-warehouse.ts --apply
 */
import { spawnSync } from 'node:child_process';
import * as fs from 'fs';
import * as path from 'path';
import { getRuedaOutputDir } from '../../lib/rueda/paths';

function main() {
  const apply = process.argv.includes('--apply');
  const root = getRuedaOutputDir();
  const editions = fs
    .readdirSync(root)
    .filter((d) => /^R\d+$/i.test(d) && fs.existsSync(path.join(root, d, 'avisos.json')))
    .sort();

  for (const ed of editions) {
    const args = ['tsx', 'scripts/rueda/load-warehouse.ts', `--edicion=${ed}`];
    if (apply) args.push('--apply');
    console.log('>>>', args.join(' '));
    const r = spawnSync('npx', args, { stdio: 'inherit', cwd: process.cwd() });
    if (r.status !== 0) process.exit(r.status ?? 1);
  }
  console.log(JSON.stringify({ ok: true, editions: editions.length, apply }, null, 2));
}

main();

/**
 * Orquesta publicación de una edición (sin --apply salvo que lo pases).
 *
 *   npx tsx scripts/rueda/publish-edition.ts --edicion=R2766
 *   npx tsx scripts/rueda/publish-edition.ts --edicion=R2766 --apply --start-in-minutes=30
 */
import { spawnSync } from 'node:child_process';
import * as fs from 'fs';
import * as path from 'path';
import { preflightEdition } from '../../lib/rueda/preflight';
import { getRuedaOutputDir } from '../../lib/rueda/paths';

function arg(name: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit?.split('=').slice(1).join('=');
}

function run(cmd: string[], env?: NodeJS.ProcessEnv) {
  const r = spawnSync('npx', cmd, { stdio: 'inherit', cwd: process.cwd(), env: { ...process.env, ...env } });
  return r.status ?? 1;
}

async function main() {
  const edicion = arg('edicion');
  if (!edicion) {
    console.error('Requiere --edicion=R2766');
    process.exit(1);
  }
  const apply = process.argv.includes('--apply');
  const pf = preflightEdition(edicion);
  const reportPath = path.join(getRuedaOutputDir(edicion), `informe-pre-publicacion-${edicion}.json`);
  fs.writeFileSync(reportPath, JSON.stringify({ ...pf, at: new Date().toISOString() }, null, 2) + '\n');

  console.log('\n=== PREFLIGHT ===\n', JSON.stringify(pf, null, 2));
  if (!pf.ok) {
    console.error('\nPreflight falló. Corrige antes de publicar.');
    process.exit(2);
  }

  run(['tsx', 'scripts/rueda/prepare-outreach-edition.ts', `--edicion=${edicion}`]);

  const importArgs = ['tsx', 'scripts/rueda/import-edition.ts', `--edicion=${edicion}`];
  if (apply) importArgs.push('--apply');
  const start = arg('start-in-minutes');
  if (start) importArgs.push(`--start-in-minutes=${start}`);
  const interval = arg('interval-seconds');
  if (interval) importArgs.push(`--interval-seconds=${interval}`);

  console.log('\n=== IMPORT ===');
  const st = run(importArgs);
  if (st !== 0) process.exit(st);

  if (apply) {
    console.log('\n=== POST-IMPORT (CRM + CSV contacto) ===');
    const st2 = run(['tsx', 'scripts/rueda/post-import-edition.ts', `--edicion=${edicion}`]);
    if (st2 !== 0) process.exit(st2);
    console.log(`
Siguiente:
  1. Revisar ${getRuedaOutputDir(edicion)}/contacto-anunciantes-${edicion}-LISTO.csv
  2. Activar go-live: RUEDA_ACTIVE_BATCH_ID=${pf.batch_id} npx tsx scripts/rueda/go-live-loop.ts
  3. /admin/comercial → backfill si hace falta
`);
  } else {
    console.log(`
(dry-run) Si OK, ejecuta:
  npx tsx scripts/rueda/publish-edition.ts --edicion=${edicion} --apply --start-in-minutes=60
`);
  }
}

main();

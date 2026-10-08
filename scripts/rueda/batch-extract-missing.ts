/**
 * Extrae ediciones con PDF en archive pero sin output/rueda/R####/avisos.json
 * Solo modo local (sin OpenAI).
 *
 *   npx tsx scripts/rueda/batch-extract-missing.ts
 *   npx tsx scripts/rueda/batch-extract-missing.ts --min=R2630 --split
 */
import { spawnSync } from 'node:child_process';
import * as fs from 'fs';
import * as path from 'path';
import { listEditionPdfFilesOnDisk, getEditionByCode } from '../../lib/rueda/editions';
import { resolveEditionRunContext } from '../../lib/rueda/batch';
import { getRuedaOutputDir } from '../../lib/rueda/paths';

function arg(name: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit?.split('=').slice(1).join('=');
}

function editionNum(code: string): number {
  return parseInt(code.replace(/^R/i, ''), 10);
}

function main() {
  const min = parseInt(arg('min') || '2630', 10);
  const doSplit = process.argv.includes('--split');
  const files = listEditionPdfFilesOnDisk()
    .filter((f) => editionNum(f.edicion) >= min)
    .sort((a, b) => a.edicion.localeCompare(b.edicion));

  const missing = files.filter(
    (f) => !fs.existsSync(path.join(getRuedaOutputDir(f.edicion), 'avisos.json')),
  );

  console.log(JSON.stringify({ min: `R${min}`, missing: missing.map((m) => m.edicion) }, null, 2));

  for (const f of missing) {
    if (doSplit) {
      spawnSync(
        'npx',
        ['tsx', 'scripts/rueda/split-edition-pages.ts', `--edicion=${f.edicion}`],
        { stdio: 'inherit', cwd: process.cwd() },
      );
    }
    const man = getEditionByCode(f.edicion);
    const ctx = resolveEditionRunContext({
      edicion: f.edicion,
      fecha: man?.fecha_inicio,
      batch: man?.batch_id,
    });
    const args = [
      'tsx',
      'scripts/rueda/extract-edition.ts',
      `--edicion=${f.edicion}`,
      `--pdf=${f.path}`,
      `--batch=${ctx.batchId}`,
      `--fecha=${ctx.fechaPublicacionOriginal}`,
    ];
    if (process.argv.includes('--ocr')) args.push('--ocr');
    console.log('>>>', args.join(' '));
    const r = spawnSync('npx', args, { stdio: 'inherit', cwd: process.cwd(), env: process.env });
    if (r.status !== 0) console.error('falló', f.edicion);
  }

  spawnSync('npx', ['tsx', 'scripts/rueda/export-master-catalog.ts'], {
    stdio: 'inherit',
    cwd: process.cwd(),
  });
}

main();

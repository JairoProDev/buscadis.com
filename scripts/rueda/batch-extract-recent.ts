/**
 * Extrae todas las ediciones recientes (R2747+) que tengan PDF; sin publicar en web.
 *
 *   npx tsx scripts/rueda/batch-extract-recent.ts
 *   npx tsx scripts/rueda/batch-extract-recent.ts --from=R2755 --force
 *   npx tsx scripts/rueda/batch-extract-recent.ts --vision
 */
import { spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { getEditionByCode, listEditionPdfFilesOnDisk } from '../../lib/rueda/editions';
import { getRuedaOutputDir } from '../../lib/rueda/paths';
import { resolveEditionRunContext } from '../../lib/rueda/batch';

function arg(name: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit?.split('=').slice(1).join('=');
}

function editionNum(code: string): number {
  return parseInt(code.replace(/^R/i, ''), 10);
}

function main() {
  const from = parseInt(arg('from') || '2747', 10);
  const force = process.argv.includes('--force');
  const vision = process.argv.includes('--vision');
  const visionPortada = process.argv.includes('--vision-portada');
  const files = listEditionPdfFilesOnDisk()
    .filter((f) => editionNum(f.edicion) >= from)
    .sort((a, b) => a.edicion.localeCompare(b.edicion));

  const results: { edicion: string; status: string; total?: number }[] = [];

  for (const f of files) {
    const outJson = path.join(getRuedaOutputDir(f.edicion), 'avisos.json');
    if (!force && fs.existsSync(outJson)) {
      const prev = JSON.parse(fs.readFileSync(outJson, 'utf8')) as { total_avisos?: number };
      results.push({ edicion: f.edicion, status: 'skipped', total: prev.total_avisos });
      continue;
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
    if (vision) args.push('--vision');
    if (visionPortada) args.push('--vision-portada');

    console.log('\n>>>', f.edicion, args.join(' '));
    const r = spawnSync('npx', args, { stdio: 'inherit', cwd: process.cwd() });
    if (r.status !== 0) {
      results.push({ edicion: f.edicion, status: 'error' });
      continue;
    }
    const payload = JSON.parse(fs.readFileSync(outJson, 'utf8')) as { total_avisos?: number };
    results.push({ edicion: f.edicion, status: 'ok', total: payload.total_avisos });
  }

  console.log('\n' + JSON.stringify({ from: `R${from}`, results }, null, 2));

  const exp = spawnSync('npx', ['tsx', 'scripts/rueda/export-master-catalog.ts'], {
    stdio: 'inherit',
    cwd: process.cwd(),
  });
  process.exit(exp.status ?? 0);
}

main();

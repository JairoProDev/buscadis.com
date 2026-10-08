/**
 * Regenera avisos.csv / txt desde avisos.json (sin re-extraer PDF).
 *
 *   npx tsx scripts/rueda/reexport-all-catalogs.ts --sync-fechas
 */
import { spawnSync } from 'node:child_process';
import * as fs from 'fs';
import * as path from 'path';
import { suggestBatchId } from '../../lib/rueda/batch';
import { getEditionByCode } from '../../lib/rueda/editions';
import { writeEditionAvisosCsv, writeEditionAvisosTxt } from '../../lib/rueda/export-catalog';
import { getRuedaOutputDir } from '../../lib/rueda/paths';
import type { RuedaExtractedAd } from '../../lib/rueda/types';

function main() {
  const syncFechas = process.argv.includes('--sync-fechas');
  const root = getRuedaOutputDir();
  const dirs = fs.readdirSync(root).filter((d) => /^R\d+$/i.test(d));

  for (const ed of dirs) {
    const dir = path.join(root, ed);
    const jsonPath = path.join(dir, 'avisos.json');
    if (!fs.existsSync(jsonPath)) continue;
    const payload = JSON.parse(fs.readFileSync(jsonPath, 'utf8')) as {
      avisos: RuedaExtractedAd[];
      fecha_publicacion_original?: string;
      fecha_sesion_fin?: string;
      batch_id?: string;
    };
    const man = getEditionByCode(ed);
    if (syncFechas && man?.fecha_inicio) {
      payload.fecha_publicacion_original = man.fecha_inicio;
      payload.fecha_sesion_fin = man.fecha_fin || man.fecha_inicio;
      payload.batch_id = man.batch_id || suggestBatchId(ed, man.fecha_inicio);
      for (const a of payload.avisos) a.batch_id = payload.batch_id!;
      fs.writeFileSync(jsonPath, JSON.stringify(payload, null, 2));
    }
    const fechas = {
      inicio: payload.fecha_publicacion_original || man?.fecha_inicio || '',
      fin: payload.fecha_sesion_fin || man?.fecha_fin || payload.fecha_publicacion_original || '',
    };
    writeEditionAvisosCsv(dir, payload.avisos, fechas);
    writeEditionAvisosTxt(dir, payload.avisos);
    console.log(ed, payload.avisos.length, fechas.inicio, '→', fechas.fin);
  }

  const exp = spawnSync('npx', ['tsx', 'scripts/rueda/export-master-catalog.ts'], {
    stdio: 'inherit',
    cwd: process.cwd(),
  });
  process.exit(exp.status ?? 0);
}

main();

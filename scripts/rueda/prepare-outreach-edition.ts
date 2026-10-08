/**
 * CSV de contacto WA (antes o después de import).
 *
 * Antes de import: url_aviso = placeholder
 * Después: npx tsx scripts/rueda/post-import-edition.ts --edicion=R2766
 *
 *   npx tsx scripts/rueda/prepare-outreach-edition.ts --edicion=R2766
 */
import * as fs from 'fs';
import * as path from 'path';
import { loadAvisosPayload } from '../../lib/rueda/import-run';
import { outreachRowsFromAds, outreachToCsv } from '../../lib/rueda/outreach';
import { getRuedaOutputDir } from '../../lib/rueda/paths';
import { resolveEditionRunContext } from '../../lib/rueda/batch';

function arg(name: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit?.split('=').slice(1).join('=');
}

function main() {
  const edicion = arg('edicion');
  if (!edicion) {
    console.error('Requiere --edicion=');
    process.exit(1);
  }
  const ctx = resolveEditionRunContext({ edicion });
  const { avisos } = loadAvisosPayload(edicion);
  const rows = outreachRowsFromAds(avisos, edicion, () => ({
    urlAviso: `https://buscadis.com/a/PENDIENTE-${edicion}`,
    urlReclamar: `https://buscadis.com/reclamar/PENDIENTE`,
  }));
  const out = path.join(getRuedaOutputDir(edicion), `contacto-anunciantes-${edicion}-PRE-import.csv`);
  fs.writeFileSync(out, outreachToCsv(rows), 'utf8');
  console.log(JSON.stringify({ out, batch_id: ctx.batchId, filas: rows.length }, null, 2));
}

main();

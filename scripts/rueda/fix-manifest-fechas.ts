/**
 * Rellena fecha_inicio/fin y batch_id desde nombre de archivo PDF.
 *
 *   npx tsx scripts/rueda/fix-manifest-fechas.ts --apply
 */
import { suggestBatchId } from '../../lib/rueda/batch';
import { loadManifestDocument, saveManifestEditions } from '../../lib/rueda/editions';
import { parseEditionDatesFromArchivo } from '../../lib/rueda/parse-filename-dates';

function main() {
  const apply = process.argv.includes('--apply');
  const doc = loadManifestDocument();
  let updated = 0;

  for (const e of doc.editions) {
    if (!e.archivo?.endsWith('.pdf')) continue;
    const parsed = parseEditionDatesFromArchivo(e.archivo, e.edicion);
    if (!parsed) continue;
    const needs =
      !e.fecha_inicio ||
      e.fecha_inicio === '2026-10-08' ||
      e.fecha_inicio !== parsed.fecha_inicio;
    if (!needs) continue;
    updated++;
    e.fecha_inicio = parsed.fecha_inicio;
    e.fecha_fin = parsed.fecha_fin;
    e.batch_id = suggestBatchId(e.edicion, parsed.fecha_inicio);
  }

  console.log(JSON.stringify({ updated, apply, sample: doc.editions.filter((e) => e.edicion.startsWith('R276')).slice(0, 5) }, null, 2));
  if (apply) saveManifestEditions(doc.editions);
}

main();

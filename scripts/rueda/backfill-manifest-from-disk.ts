/**
 * Sincroniza manifest.json con PDFs en archive/editions (metadatos básicos).
 *
 *   npx tsx scripts/rueda/backfill-manifest-from-disk.ts --apply
 */
import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import {
  listEditionPdfFilesOnDisk,
  loadManifestDocument,
  saveManifestEditions,
  type RuedaEditionRecord,
} from '../../lib/rueda/editions';
import { suggestBatchId } from '../../lib/rueda/batch';

function sha256File(filePath: string): string {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function main() {
  const apply = process.argv.includes('--apply');
  const onDisk = listEditionPdfFilesOnDisk();
  const doc = loadManifestDocument();
  const byCode = new Map(doc.editions.map((e) => [e.edicion, e]));

  const updates: RuedaEditionRecord[] = [];

  for (const f of onDisk) {
    const prev = byCode.get(f.edicion);
    let page_count: number | undefined;
    let edicion_detectada: string | undefined;
    try {
      const meta = JSON.parse(
        execFileSync('python3', ['scripts/rueda/pdf-edition-meta.py', f.path], { encoding: 'utf8' }),
      ) as { page_count?: number; edicion_detectada?: string };
      page_count = meta.page_count;
      edicion_detectada = meta.edicion_detectada;
    } catch {
      /* ignore */
    }

    const sha = sha256File(f.path);
    const rec: RuedaEditionRecord = {
      edicion: f.edicion,
      fecha_inicio: prev?.fecha_inicio || '',
      fecha_fin: prev?.fecha_fin || '',
      archivo: f.archivo,
      sha256: sha,
      page_count,
      batch_id: prev?.batch_id || (prev?.fecha_inicio ? suggestBatchId(f.edicion, prev.fecha_inicio) : undefined),
      source: prev?.source || 'unknown',
    };
    if (edicion_detectada && edicion_detectada !== f.edicion) {
      rec.notes = `PDF cabecera dice ${edicion_detectada}`;
      rec.status = 'conflict';
    }
    updates.push(rec);
  }

  // Mark R2760 missing
  if (!byCode.has('R2760') && !onDisk.some((f) => f.edicion === 'R2760')) {
    updates.push({
      edicion: 'R2760',
      fecha_inicio: '',
      fecha_fin: '',
      archivo: '',
      status: 'missing',
      notes: 'Hueco entre R2759 y R2761 — recuperar WP/Wayback',
    });
  }

  updates.sort((a, b) => a.edicion.localeCompare(b.edicion));

  console.log(JSON.stringify({ count: updates.length, apply, sample: updates.slice(-5) }, null, 2));

  if (apply) saveManifestEditions(updates);
}

main();

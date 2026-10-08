/**
 * Renombra `R####-recovered.pdf` → `R####-MesDia-Dia.pdf` leyendo portada del PDF.
 *
 *   npx tsx scripts/rueda/canonicalize-recovered-editions.ts --apply
 */
import { execFileSync } from 'node:child_process';
import * as fs from 'fs';
import * as path from 'path';
import { suggestBatchId } from '../../lib/rueda/batch';
import {
  getRuedaEditionsDir,
  loadRuedaManifest,
  ruedaEditionPdfPath,
  upsertManifestEdition,
} from '../../lib/rueda/editions';

interface PdfMeta {
  edicion_detectada?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  rango_label?: string;
  page_count?: number;
}

function readMeta(pdfPath: string): PdfMeta {
  const script = path.join(process.cwd(), 'scripts/rueda/pdf-edition-meta.py');
  const out = execFileSync('python3', [script, pdfPath], { encoding: 'utf8' });
  return JSON.parse(out) as PdfMeta;
}

function main() {
  const apply = process.argv.includes('--apply');
  const dir = getRuedaEditionsDir();
  const plan: { edicion: string; from: string; to: string; meta: PdfMeta }[] = [];

  for (const rec of loadRuedaManifest()) {
    if (!rec.archivo?.includes('-recovered.pdf')) continue;
    const pdfPath = ruedaEditionPdfPath(rec);
    if (!fs.existsSync(pdfPath)) {
      console.warn('missing pdf', rec.edicion);
      continue;
    }
    const meta = readMeta(pdfPath);
    if (!meta.rango_label || !meta.fecha_inicio || !meta.fecha_fin) {
      console.warn('no rango from portada', rec.edicion, meta);
      continue;
    }
    const to = `${rec.edicion}-${meta.rango_label}.pdf`;
    plan.push({ edicion: rec.edicion, from: rec.archivo, to, meta });
  }

  console.log(JSON.stringify({ apply, plan }, null, 2));
  if (!apply) {
    console.log('\n(dry-run — usa --apply)');
    return;
  }

  for (const p of plan) {
    const from = path.join(dir, p.from);
    const dest = path.join(dir, p.to);
    if (!fs.existsSync(from)) continue;
    if (fs.existsSync(dest) && path.resolve(from) !== path.resolve(dest)) {
      console.warn('skip dest exists', p.to);
      continue;
    }
    if (path.resolve(from) !== path.resolve(dest)) fs.renameSync(from, dest);
    upsertManifestEdition({
      edicion: p.edicion,
      fecha_inicio: p.meta.fecha_inicio!,
      fecha_fin: p.meta.fecha_fin!,
      archivo: p.to,
      batch_id: suggestBatchId(p.edicion, p.meta.fecha_inicio!),
      page_count: p.meta.page_count,
      source: 'manual',
      notes: 'Renombrado desde recovered vía portada PDF',
    });
  }
}

main();

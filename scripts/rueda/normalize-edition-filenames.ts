/**
 * Renombra PDFs `R####.pdf` → nombre canónico usando cabecera del PDF o manifest.
 *
 *   npx tsx scripts/rueda/normalize-edition-filenames.ts
 *   npx tsx scripts/rueda/normalize-edition-filenames.ts --apply
 */
import * as fs from 'fs';
import * as path from 'path';
import { execFileSync } from 'child_process';
import {
  getRuedaEditionsDir,
  listEditionPdfFilesOnDisk,
  loadRuedaManifest,
  upsertManifestEdition,
} from '../../lib/rueda/editions';

function main() {
  const apply = process.argv.includes('--apply');
  const dir = getRuedaEditionsDir();
  const manifest = new Map(loadRuedaManifest().map((e) => [e.edicion, e]));
  const plan: { from: string; to: string; edicion: string }[] = [];

  for (const f of listEditionPdfFilesOnDisk()) {
    if (/^R\d{3,4}-.+\.pdf$/i.test(f.archivo)) continue;

    const man = manifest.get(f.edicion);
    let destName = man?.archivo;
    if (!destName || !/^R\d{3,4}-.+\.pdf$/i.test(destName)) {
      // Mantener nombre descriptivo si el PDF ya trae rango en otro repo/copia
      const simple = `${f.edicion}-recovered.pdf`;
      destName = simple;
    }

    const dest = path.join(dir, destName);
    if (path.resolve(f.path) === path.resolve(dest)) continue;
    plan.push({ from: f.archivo, to: destName, edicion: f.edicion });
  }

  console.log(JSON.stringify({ apply, plan }, null, 2));

  if (!apply) {
    console.log('\n(dry-run — usa --apply para renombrar)');
    return;
  }

  for (const p of plan) {
    const from = path.join(dir, p.from);
    const to = path.join(dir, p.to);
    if (fs.existsSync(to)) {
      console.warn('skip', p.edicion, 'dest exists', p.to);
      continue;
    }
    fs.renameSync(from, to);
    const rec = manifest.get(p.edicion);
    upsertManifestEdition({
      edicion: p.edicion,
      fecha_inicio: rec?.fecha_inicio || '',
      fecha_fin: rec?.fecha_fin || '',
      archivo: p.to,
      sha256: rec?.sha256,
      source: rec?.source || 'manual',
    });
  }
}

main();

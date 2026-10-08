/**
 * Parte una edición en páginas bajo ads/archive/pages.
 *
 *   npx tsx scripts/rueda/split-edition-pages.ts --edicion=R2766
 *   npx tsx scripts/rueda/split-edition-pages.ts --pdf=... --out-dir=...
 *   npx tsx scripts/rueda/split-edition-pages.ts --all-recent
 */
import * as fs from 'fs';
import * as path from 'path';
import { execFileSync } from 'child_process';
import {
  getEditionByCode,
  listEditionPdfFilesOnDisk,
  ruedaEditionPdfPath,
} from '../../lib/rueda/editions';
import { getRuedaPagesDir } from '../../lib/rueda/paths';

function arg(name: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit?.split('=').slice(1).join('=');
}

function splitOne(pdf: string, outDir: string, withPng: boolean) {
  const args = ['scripts/rueda/split-edition-pages.py', pdf, outDir];
  if (withPng) args.push('--png');
  const out = execFileSync('python3', args, { encoding: 'utf8' });
  return JSON.parse(out.trim()) as { ok?: boolean; skipped?: boolean; page_count?: number };
}

function main() {
  const withPng = process.argv.includes('--png');
  const allRecent = process.argv.includes('--all-recent');
  const edicion = arg('edicion');
  const pdfArg = arg('pdf');
  const outArg = arg('out-dir');

  const jobs: { pdf: string; outDir: string; edicion: string }[] = [];

  if (allRecent) {
    const recent = listEditionPdfFilesOnDisk().filter((f) => {
      const n = parseInt(f.edicion.replace(/^R/i, ''), 10);
      return n >= 2747;
    });
    for (const f of recent) {
      const folderName = f.archivo.replace(/\.pdf$/i, '');
      jobs.push({
        pdf: f.path,
        outDir: path.join(getRuedaPagesDir(), folderName),
        edicion: f.edicion,
      });
    }
  } else if (pdfArg && outArg) {
    jobs.push({ pdf: pdfArg, outDir: outArg, edicion: edicion || '?' });
  } else if (edicion) {
    const record = getEditionByCode(edicion);
    const pdf = record ? ruedaEditionPdfPath(record) : path.join(getRuedaPagesDir(), '..', 'editions', `${edicion}.pdf`);
    if (!fs.existsSync(pdf)) {
      console.error('PDF no encontrado:', pdf);
      process.exit(1);
    }
    const folderName = record?.archivo.replace(/\.pdf$/i, '') || edicion;
    jobs.push({
      pdf,
      outDir: path.join(getRuedaPagesDir(), folderName),
      edicion,
    });
  } else {
    console.error('Usa --edicion=R2766, --all-recent, o --pdf + --out-dir');
    process.exit(1);
  }

  const results = [];
  for (const job of jobs) {
    fs.mkdirSync(job.outDir, { recursive: true });
    const r = splitOne(job.pdf, job.outDir, withPng);
    results.push({ ...job, ...r });
    console.log(JSON.stringify({ edicion: job.edicion, ...r }));
  }
  console.log(JSON.stringify({ total: results.length }, null, 2));
}

main();

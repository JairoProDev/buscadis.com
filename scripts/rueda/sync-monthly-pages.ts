/**
 * Parte cada edición en PDFs por página bajo:
 *   ads/archive/by-month/YYYY-MM/R####-MesDia-Dia/pagina-NN.pdf
 *
 *   npx tsx scripts/rueda/sync-monthly-pages.ts --from=2747
 *   npx tsx scripts/rueda/sync-monthly-pages.ts --edicion=R2766 --png
 */
import * as fs from 'fs';
import { execFileSync } from 'child_process';
import { loadRuedaManifest, ruedaEditionPdfPath } from '../../lib/rueda/editions';
import { monthlyEditionPagesDir, monthKeyFromEdition } from '../../lib/rueda/month-archive';

function arg(name: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit?.split('=').slice(1).join('=');
}

function editionNum(code: string): number {
  return parseInt(code.replace(/^R/i, ''), 10);
}

function splitOne(pdf: string, outDir: string, withPng: boolean) {
  fs.mkdirSync(outDir, { recursive: true });
  const args = ['scripts/rueda/split-edition-pages.py', pdf, outDir];
  if (withPng) args.push('--png');
  return JSON.parse(execFileSync('python3', args, { encoding: 'utf8' }).trim()) as {
    page_count?: number;
    skipped?: boolean;
  };
}

function main() {
  const from = parseInt(arg('from') || '2747', 10);
  const only = arg('edicion');
  const withPng = process.argv.includes('--png');
  const editions = loadRuedaManifest().filter((e) => {
    if (!e.archivo?.endsWith('.pdf')) return false;
    if (only) return e.edicion === only.toUpperCase();
    return editionNum(e.edicion) >= from;
  });

  const results: unknown[] = [];
  for (const e of editions) {
    const pdf = ruedaEditionPdfPath(e);
    if (!fs.existsSync(pdf)) {
      results.push({ edicion: e.edicion, error: 'pdf_missing' });
      continue;
    }
    const outDir = monthlyEditionPagesDir(e);
    const r = splitOne(pdf, outDir, withPng);
    results.push({
      edicion: e.edicion,
      month: monthKeyFromEdition(e),
      outDir,
      ...r,
    });
    console.log(JSON.stringify({ edicion: e.edicion, month: monthKeyFromEdition(e), outDir, ...r }));
  }
  console.log(JSON.stringify({ total: results.length }, null, 2));
}

main();

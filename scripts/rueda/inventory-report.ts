/**
 * Escanea PDFs, páginas partidas y manifiesto; escribe inventory.json y edition-gaps.json.
 *
 *   npx tsx scripts/rueda/inventory-report.ts
 *   npx tsx scripts/rueda/inventory-report.ts --write-manifest-drift
 */
import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { execFileSync } from 'node:child_process';
import {
  getEditionByCode,
  listEditionPdfFilesOnDisk,
  loadManifestDocument,
  loadRuedaManifest,
  parseEditionCodeFromFilename,
  type RuedaEditionRecord,
} from '../../lib/rueda/editions';
import {
  findEditionPagesDir,
  getEditionGapsPath,
  getInventoryPath,
  getRuedaPagesDir,
} from '../../lib/rueda/paths';
import { getRuedaEditionsDir } from '../../lib/rueda/editions';

function sha256File(filePath: string): string {
  const h = crypto.createHash('sha256');
  h.update(fs.readFileSync(filePath));
  return h.digest('hex');
}

function editionNumbers(files: { edicion: string }[]): number[] {
  return files
    .map((f) => {
      const m = f.edicion.match(/^R(\d+)$/i);
      return m ? parseInt(m[1], 10) : NaN;
    })
    .filter((n) => !Number.isNaN(n))
    .sort((a, b) => a - b);
}

function computeGaps(nums: number[]): { missing: number[]; groups: { from: number; to: number }[] } {
  if (!nums.length) return { missing: [], groups: [] };
  const set = new Set(nums);
  const missing: number[] = [];
  for (let i = nums[0]; i <= nums[nums.length - 1]; i++) {
    if (!set.has(i)) missing.push(i);
  }
  const groups: { from: number; to: number }[] = [];
  let s = missing[0];
  let e = missing[0];
  for (const n of missing.slice(1)) {
    if (n === e + 1) e = n;
    else {
      groups.push({ from: s, to: e });
      s = e = n;
    }
  }
  if (missing.length) groups.push({ from: s, to: e });
  return { missing, groups };
}

function pageMeta(edicion: string): { has_pages: boolean; page_count?: number } {
  const dir = findEditionPagesDir(edicion);
  if (!dir) return { has_pages: false };
  const metaPath = path.join(dir, 'meta.json');
  if (fs.existsSync(metaPath)) {
    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8')) as { page_count?: number };
    return { has_pages: true, page_count: meta.page_count };
  }
  const pdfs = fs.readdirSync(dir).filter((f) => /^pagina-\d+\.pdf$/i.test(f));
  return { has_pages: pdfs.length > 0, page_count: pdfs.length || undefined };
}

function pdfPageCount(pdfPath: string): number | undefined {
  try {
    const out = execFileSync('python3', ['scripts/rueda/pdf-edition-meta.py', pdfPath], {
      encoding: 'utf8',
    });
    const j = JSON.parse(out) as { page_count?: number };
    return j.page_count;
  } catch {
    return undefined;
  }
}

function main() {
  const writeDrift = process.argv.includes('--write-manifest-drift');
  const onDisk = listEditionPdfFilesOnDisk();
  const manifest = loadRuedaManifest();
  const manifestByCode = new Map(manifest.map((e) => [e.edicion, e]));
  const numsAll = editionNumbers(onDisk);
  const nums = numsAll.filter((n) => n >= 2518);
  const { missing, groups } = computeGaps(nums);

  const shaGroups = new Map<string, string[]>();
  for (const f of onDisk) {
    const sha = sha256File(f.path);
    const list = shaGroups.get(sha) || [];
    list.push(f.archivo);
    shaGroups.set(sha, list);
  }
  const duplicateSha = [...shaGroups.entries()].filter(([, files]) => files.length > 1);

  const editions = onDisk.map((f) => {
    const man = manifestByCode.get(f.edicion);
    const pages = pageMeta(f.edicion);
    const page_count_pdf = pdfPageCount(f.path);
    return {
      edicion: f.edicion,
      archivo: f.archivo,
      sha256: sha256File(f.path),
      in_manifest: Boolean(man),
      manifest_drift: man ? man.archivo !== f.archivo || man.sha256 !== sha256File(f.path) : true,
      page_count_pdf,
      pages_split: pages.has_pages,
      page_count_split: pages.page_count,
      batch_id: man?.batch_id,
      fecha_inicio: man?.fecha_inicio,
    };
  });

  const notInManifest = editions.filter((e) => !e.in_manifest).map((e) => e.edicion);
  const editionsDir = onDisk[0] ? path.dirname(onDisk[0].path) : getRuedaEditionsDir();
  const manifestMissingFile = manifest.filter(
    (m) => m.archivo && m.status !== 'missing' && !fs.existsSync(path.join(editionsDir, m.archivo)),
  );

  const inventory = {
    generated_at: new Date().toISOString(),
    editions_dir: onDisk[0] ? path.dirname(onDisk[0].path) : '',
    pages_dir: getRuedaPagesDir(),
    totals: {
      pdf_count: onDisk.length,
      manifest_count: manifest.length,
      edition_min: nums[0] ? `R${nums[0]}` : null,
      edition_max: nums.length ? `R${nums[nums.length - 1]}` : null,
      missing_edition_numbers: missing.length,
      not_in_manifest: notInManifest.length,
      recent_missing_R2755_R2766: [2755, 2756, 2757, 2758, 2759, 2760, 2761, 2762, 2763, 2764, 2765, 2766].filter(
        (n) => !nums.includes(n),
      ).map((n) => `R${n}`),
    },
    duplicate_sha256: duplicateSha.map(([sha, files]) => ({ sha256: sha, files })),
    editions,
    manifest_orphans: manifestMissingFile.map((m) => m.edicion),
    not_in_manifest: notInManifest,
  };

  fs.mkdirSync(path.dirname(getInventoryPath()), { recursive: true });
  fs.writeFileSync(getInventoryPath(), JSON.stringify(inventory, null, 2) + '\n');

  const gapsDoc = {
    generated_at: inventory.generated_at,
    strategy_note:
      'Huecos grandes (ej. R2684–R2734) pueden ser irrecuperables; priorizar 2026 y Downloads.',
    missing_edition_numbers: missing.map((n) => `R${n}`),
    missing_groups: groups.map((g) => ({
      label: g.from === g.to ? `R${g.from}` : `R${g.from}-R${g.to}`,
      from: g.from,
      to: g.to,
    })),
    priority_recover: ['R2760', 'R2635', 'R2684', 'R2686', 'R2687', 'R2690', 'R2706'],
  };
  fs.writeFileSync(getEditionGapsPath(), JSON.stringify(gapsDoc, null, 2) + '\n');

  if (writeDrift && notInManifest.length) {
    const doc = loadManifestDocument();
    for (const code of notInManifest) {
      const row = editions.find((e) => e.edicion === code);
      if (!row) continue;
      const rec: RuedaEditionRecord = {
        edicion: code,
        fecha_inicio: '',
        fecha_fin: '',
        archivo: row.archivo,
        sha256: row.sha256,
        page_count: row.page_count_pdf,
        source: 'unknown',
      };
      const idx = doc.editions.findIndex((e) => e.edicion === code);
      if (idx >= 0) doc.editions[idx] = { ...doc.editions[idx], ...rec };
      else doc.editions.push(rec);
    }
    doc.editions.sort((a, b) => a.edicion.localeCompare(b.edicion));
    fs.writeFileSync(
      path.join(process.cwd(), 'data', 'rueda', 'manifest.json'),
      JSON.stringify(doc, null, 2) + '\n',
    );
  }

  console.log(JSON.stringify(inventory.totals, null, 2));
  console.log('→', getInventoryPath());
  console.log('→', getEditionGapsPath());
}

main();

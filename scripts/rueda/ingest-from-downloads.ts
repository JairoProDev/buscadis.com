/**
 * Copia PDFs de Rueda desde Downloads (Windows/WSL) al archive con nombre canónico.
 *
 *   npx tsx scripts/rueda/ingest-from-downloads.ts
 *   npx tsx scripts/rueda/ingest-from-downloads.ts --apply
 *   npx tsx scripts/rueda/ingest-from-downloads.ts --dir=/path --apply
 */
import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { execFileSync } from 'node:child_process';
import {
  getRuedaEditionsDir,
  parseEditionCodeFromFilename,
  ruedaEditionPdfPath,
  upsertManifestEdition,
  getEditionByCode,
  type RuedaEditionRecord,
} from '../../lib/rueda/editions';
import { defaultWindowsDownloadsDir } from '../../lib/rueda/paths';

function arg(name: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit?.split('=').slice(1).join('=');
}

function sha256(buf: Buffer): string {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function metaForPdf(pdfPath: string) {
  try {
    return JSON.parse(
      execFileSync('python3', ['scripts/rueda/pdf-edition-meta.py', pdfPath], { encoding: 'utf8' }),
    ) as {
      edicion_detectada?: string;
      page_count?: number;
    };
  } catch {
    return {};
  }
}

function main() {
  const apply = process.argv.includes('--apply');
  const dir = arg('dir') || defaultWindowsDownloadsDir();
  if (!dir || !fs.existsSync(dir)) {
    console.error('No se encontró carpeta Downloads. Usa --dir=');
    process.exit(1);
  }

  const files = fs
    .readdirSync(dir)
    .filter((f) => /^R\d{3,4}.*\.pdf$/i.test(f))
    .map((f) => path.join(dir, f));

  const editionsDir = getRuedaEditionsDir();
  fs.mkdirSync(editionsDir, { recursive: true });

  const plan: {
    source: string;
    edicion: string;
    dest: string;
    action: string;
    sha256: string;
    page_count?: number;
  }[] = [];

  const byEdition = new Map<string, { file: string; sha: string }[]>();
  for (const src of files) {
    const code = parseEditionCodeFromFilename(path.basename(src));
    if (!code) continue;
    const buf = fs.readFileSync(src);
    const hash = sha256(buf);
    const list = byEdition.get(code) || [];
    list.push({ file: src, sha: hash });
    byEdition.set(code, list);
  }

  for (const [edicion, variants] of byEdition) {
    if (variants.length > 1) {
      console.warn(`[conflict] ${edicion} tiene ${variants.length} archivos en Downloads — se usa el más grande`);
      variants.sort((a, b) => fs.statSync(b.file).size - fs.statSync(a.file).size);
    }
    const chosen = variants[0];
    const meta = metaForPdf(chosen.file);
    const detected = meta.edicion_detectada?.toUpperCase();
    if (detected && detected !== edicion) {
      console.warn(`[warn] ${path.basename(chosen.file)}: código archivo ${edicion} vs PDF ${detected}`);
    }

    const existing = getEditionByCode(edicion);
    const baseFromSource = path.basename(chosen.file);
    const destName =
      existing?.archivo ||
      (baseFromSource.match(/^R\d{3,4}-.+\.pdf$/i) ? baseFromSource : `${edicion}.pdf`);
    const dest = path.join(editionsDir, destName);

    let action = 'copy';
    if (fs.existsSync(dest)) {
      const same = sha256(fs.readFileSync(dest)) === chosen.sha;
      action = same ? 'skip_same_sha' : 'replace_different_sha';
    }

    plan.push({
      source: chosen.file,
      edicion,
      dest,
      action,
      sha256: chosen.sha,
      page_count: meta.page_count,
    });

    if (apply && action !== 'skip_same_sha') {
      fs.copyFileSync(chosen.file, dest);
      const record: RuedaEditionRecord = {
        edicion,
        fecha_inicio: existing?.fecha_inicio || '',
        fecha_fin: existing?.fecha_fin || '',
        archivo: path.basename(dest),
        sha256: chosen.sha,
        page_count: meta.page_count,
        source: 'downloads',
        downloaded_at: new Date().toISOString(),
      };
      if (existing?.batch_id) record.batch_id = existing.batch_id;
      upsertManifestEdition(record);
    }
  }

  console.log(JSON.stringify({ apply, dir, editions_dir: editionsDir, plan }, null, 2));
}

main();

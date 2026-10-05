/**
 * Descarga revista.pdf de WordPress y la guarda con nombre estable en archive/editions.
 * WordPress suele reutilizar la misma URL; por eso cada descarga requiere --edicion y --rango.
 *
 *   npx tsx scripts/rueda/sync-wordpress-pdf.ts --url=https://.../revista.pdf --edicion=R2766 --rango=Oct5-7
 *   npx tsx scripts/rueda/sync-wordpress-pdf.ts --edicion=R2766 --rango=Oct5-7 --apply
 */
import * as crypto from 'node:crypto';
import * as dotenv from 'dotenv';
import * as fs from 'node:fs';
import * as path from 'node:path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });
dotenv.config({ path: path.join(process.cwd(), '.env') });

import {
  getRuedaEditionsDir,
  loadRuedaManifest,
  suggestEditionFilename,
  type RuedaEditionRecord,
} from '../../lib/rueda/editions';

function arg(name: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit?.split('=').slice(1).join('=');
}

async function download(url: string): Promise<Buffer> {
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  const ab = await res.arrayBuffer();
  return Buffer.from(ab);
}

function sha256(buf: Buffer): string {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function updateManifest(record: RuedaEditionRecord) {
  const manifestPath = path.join(process.cwd(), 'data', 'rueda', 'manifest.json');
  const doc = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as {
    editions: RuedaEditionRecord[];
  };
  const idx = doc.editions.findIndex((e) => e.edicion === record.edicion);
  if (idx >= 0) doc.editions[idx] = { ...doc.editions[idx], ...record };
  else doc.editions.push(record);
  doc.editions.sort((a, b) => a.fecha_inicio.localeCompare(b.fecha_inicio));
  fs.writeFileSync(manifestPath, JSON.stringify(doc, null, 2) + '\n');
}

async function main() {
  const apply = process.argv.includes('--apply');
  const edicion = arg('edicion');
  const rango = arg('rango');
  const url =
    arg('url') ||
    JSON.parse(
      fs.readFileSync(path.join(process.cwd(), 'data', 'rueda', 'manifest.json'), 'utf8'),
    ).wordpress_revista_url;

  if (!edicion || !rango) {
    console.error('Requiere --edicion=R2766 --rango=Oct5-7');
    process.exit(1);
  }

  const dir = getRuedaEditionsDir();
  fs.mkdirSync(dir, { recursive: true });
  const filename = suggestEditionFilename(edicion, rango);
  const dest = path.join(dir, filename);

  console.log(JSON.stringify({ url, dest, apply }, null, 2));
  const buf = await download(url);
  const hash = sha256(buf);

  const prev = loadRuedaManifest().find((e) => e.edicion === edicion);
  if (prev?.sha256 === hash && fs.existsSync(dest)) {
    console.log('Sin cambios (mismo SHA-256 que en manifiesto).');
    return;
  }

  const last = [...loadRuedaManifest()].sort((a, b) => b.fecha_inicio.localeCompare(a.fecha_inicio))[0];
  if (last && fs.existsSync(path.join(dir, last.archivo))) {
    const lastBuf = fs.readFileSync(path.join(dir, last.archivo));
    if (sha256(lastBuf) === hash) {
      console.warn(
        'El PDF descargado es idéntico al de la última edición registrada. ¿URL aún no actualizada en WordPress?',
      );
    }
  }

  if (!apply) {
    console.log(`Dry-run: ${buf.length} bytes, sha256=${hash}. Pasa --apply para escribir ${filename}`);
    return;
  }

  fs.writeFileSync(dest, buf);
  const fechas = arg('fechas');
  const [fecha_inicio, fecha_fin] = fechas?.split('..') || ['', ''];

  updateManifest({
    edicion,
    fecha_inicio: fecha_inicio || prev?.fecha_inicio || '',
    fecha_fin: fecha_fin || prev?.fecha_fin || '',
    archivo: filename,
    source_url: url,
    sha256: hash,
    downloaded_at: new Date().toISOString(),
  });

  console.log(JSON.stringify({ saved: dest, bytes: buf.length, sha256: hash }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

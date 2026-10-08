/**
 * Prueba URLs comunes de revista.pdf en WordPress (por mes) y compara SHA con archive.
 *
 *   npx tsx scripts/rueda/try-fetch-wordpress-pdf.ts --edicion=R2760
 */
import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import { getRuedaEditionsDir, upsertManifestEdition } from '../../lib/rueda/editions';

function arg(name: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit?.split('=').slice(1).join('=');
}

async function sha(buf: ArrayBuffer): string {
  return crypto.createHash('sha256').update(Buffer.from(buf)).digest('hex');
}

async function tryUrl(url: string) {
  try {
    const res = await fetch(url, { redirect: 'follow' });
    if (!res.ok) return null;
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('pdf') && !url.endsWith('.pdf')) return null;
    const ab = await res.arrayBuffer();
    if (ab.byteLength < 50_000) return null;
    return { url, bytes: ab.byteLength, sha256: await sha(ab), buf: Buffer.from(ab) };
  } catch {
    return null;
  }
}

async function main() {
  const edicion = arg('edicion') || 'R2760';
  const apply = process.argv.includes('--apply');
  const year = arg('year') || '2026';
  const months = ['09', '10', '08'];
  const urls: string[] = [];
  for (const m of months) {
    urls.push(`https://ruedadenegocios.com.pe/wp-content/uploads/${year}/${m}/revista.pdf`);
  }
  urls.push('https://ruedadenegocios.com.pe/wp-content/uploads/revista.pdf');

  const hits = [];
  for (const url of urls) {
    const r = await tryUrl(url);
    if (r) hits.push({ url, ...r });
  }

  console.log(JSON.stringify({ edicion, hits: hits.map((h) => ({ url: h.url, bytes: h.bytes, sha256: h.sha256 })) }, null, 2));

  if (!apply || !hits.length) return;

  const best = hits[0];
  const dest = `${getRuedaEditionsDir()}/${edicion}-recovered.pdf`;
  fs.writeFileSync(dest, best.buf);
  upsertManifestEdition({
    edicion,
    fecha_inicio: '',
    fecha_fin: '',
    archivo: `${edicion}-recovered.pdf`,
    sha256: best.sha256,
    source: 'wordpress',
    source_url: best.url,
    downloaded_at: new Date().toISOString(),
    notes: 'Recuperado vía try-fetch-wordpress-pdf',
  });
  console.log('saved', dest);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

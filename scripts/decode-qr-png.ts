import { readFileSync } from 'fs';
import jsQR from 'jsqr';
import { createCanvas, loadImage } from 'canvas';

async function main() {
  const path = process.argv[2] || '/tmp/prod-qr.png';
  const buf = readFileSync(path);
  const img = await loadImage(buf);
  const c = createCanvas(img.width, img.height);
  const ctx = c.getContext('2d')!;
  ctx.drawImage(img, 0, 0);
  const d = ctx.getImageData(0, 0, img.width, img.height);
  const r = jsQR(d.data, d.width, d.height);
  console.log('decoded:', r?.data || '(failed)');
  console.log('size:', img.width, 'bytes:', buf.length);
}

main().catch(console.error);

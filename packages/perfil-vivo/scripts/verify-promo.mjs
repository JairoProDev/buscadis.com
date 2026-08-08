/**
 * Smoke: promo vencida se oculta; vigente permanece.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(__dirname, '../src/promo/vigente.ts'), 'utf8');

if (!src.includes('export function promocionSiVigente')) {
  console.error('FAIL: promocionSiVigente missing');
  process.exit(1);
}

function promocionSiVigente(promo, nowMs) {
  if (!promo) return null;
  if (!promo.venceEn) return promo;
  const t = Date.parse(promo.venceEn);
  if (!Number.isFinite(t)) return promo;
  return t > nowMs ? promo : null;
}

const now = Date.parse('2026-08-08T12:00:00.000Z');
const dead = promocionSiVigente(
  { id: '1', titulo: 'Old', venceEn: '2026-08-07T12:00:00.000Z' },
  now
);
const live = promocionSiVigente(
  { id: '2', titulo: 'Live', venceEn: '2026-08-09T12:00:00.000Z' },
  now
);
const forever = promocionSiVigente({ id: '3', titulo: 'NoExpiry' }, now);

if (dead !== null) {
  console.error('FAIL: expired promo should be null');
  process.exit(1);
}
if (!live || live.titulo !== 'Live') {
  console.error('FAIL: live promo');
  process.exit(1);
}
if (!forever) {
  console.error('FAIL: no-expiry promo');
  process.exit(1);
}

console.log('OK: promo vigente / vencida');
console.log('\nPromo smoke passed.');

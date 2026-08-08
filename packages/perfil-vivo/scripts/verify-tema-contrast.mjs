/**
 * Verifica contraste AA de derivarTema con 20 semillas (Sprint 0 DoD).
 * Mirror de packages/perfil-vivo/src/tema/derivar-tema.ts para Node sin TS.
 */
import { parse, formatHex, converter } from 'culori';
import { hex as contrastHex } from 'wcag-contrast';

const toOklch = converter('oklch');

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

function toHexColor(color) {
  return (formatHex(color) || '#1F4FD8').toUpperCase();
}

function derivarTema(semillaHex, modo) {
  const parsed = parse(semillaHex);
  const oklch = parsed ? toOklch(parsed) : null;
  const c = clamp(oklch?.c ?? 0.08, 0, 0.19);
  const h = oklch?.h ?? 250;
  const lSeed = oklch?.l ?? 0.5;
  const lAccion =
    modo === 'light' ? clamp(lSeed, 0.42, 0.62) : clamp(lSeed, 0.55, 0.74);
  const mk = (L, C = c) => toHexColor({ mode: 'oklch', l: L, c: C, h });
  const accion = mk(lAccion);
  const sobre = contrastHex('#FFFFFF', accion) >= 4.5 ? '#FFFFFF' : '#131218';
  return { accion, sobre };
}

const SEEDS = [
  '#1F4FD8',
  '#C7401A',
  '#7A2FBF',
  '#0B7C8C',
  '#1B3A6B',
  '#1E7A3E',
  '#0E2A47',
  '#B0186B',
  '#00FF00',
  '#FF0000',
  '#0000FF',
  '#000000',
  '#FFFFFF',
  '#111111',
  '#EEEEEE',
  '#FF00FF',
  '#808080',
  '#FFA500',
  '#00CED1',
  '#8B4513',
];

let failed = 0;
for (const seed of SEEDS) {
  for (const modo of ['light', 'dark']) {
    const t = derivarTema(seed, modo);
    const ratio = contrastHex(t.sobre, t.accion);
    const ok = ratio >= 4.5;
    const label = `${seed} ${modo}`;
    console.log(
      `${ok ? 'OK' : 'FAIL'} ${label}: action=${t.accion} on=${t.sobre} ratio=${ratio.toFixed(2)}`
    );
    if (!ok) failed += 1;
  }
}

if (SEEDS.length !== 20) {
  console.error(`FAIL: expected 20 seeds, got ${SEEDS.length}`);
  failed += 1;
} else {
  console.log('OK: 20 seeds verified');
}

if (failed) {
  console.error(`\n${failed} failure(s)`);
  process.exit(1);
}
console.log('\nAll tema contrast checks passed.');

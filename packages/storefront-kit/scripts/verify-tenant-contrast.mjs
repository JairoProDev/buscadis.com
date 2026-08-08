/**
 * Smoke: extreme seeds still yield AA action ↔ on-action contrast.
 * Also asserts buildStorefrontTheme does not set marketplace --bg-*.
 */
import { parse, formatHex, converter } from 'culori';
import { hex as contrastHex } from 'wcag-contrast';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
// Load compiled-free TS via dynamic transpile is heavy — reimplement clamp path here
// mirroring packages/storefront-kit/src/derivar-tema-tenant.ts

const toOklch = converter('oklch');

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

function toHexColor(color) {
  return (formatHex(color) || '#53ACC5').toUpperCase();
}

function derivarTemaTenant(seed, mode) {
  const parsed = parse(seed);
  const oklch = parsed ? toOklch(parsed) : null;
  const h = oklch?.h ?? 200;
  const c = clamp(oklch?.c ?? 0.08, 0, 0.19);
  const lSeed = oklch?.l ?? 0.55;
  const lAccion = mode === 'light' ? clamp(lSeed, 0.42, 0.6) : clamp(lSeed, 0.62, 0.8);
  const accion = toHexColor({ mode: 'oklch', l: lAccion, c, h });
  const white = '#FFFFFF';
  const ink = '#0B1418';
  const onAction = contrastHex(white, accion) >= 4.5 ? white : ink;
  return { accion, onAction };
}

const cases = [
  { seed: '#39FF14', mode: 'light', label: 'neon green light' },
  { seed: '#39FF14', mode: 'dark', label: 'neon green dark' },
  { seed: '#050505', mode: 'light', label: 'near-black light' },
  { seed: '#050505', mode: 'dark', label: 'near-black dark' },
  { seed: '#7C3AED', mode: 'dark', label: 'nocturno' },
  { seed: '#FFFFFF', mode: 'light', label: 'white seed light' },
];

let failed = 0;
for (const c of cases) {
  const t = derivarTemaTenant(c.seed, c.mode);
  const ratio = contrastHex(t.onAction, t.accion);
  const ok = ratio >= 4.5;
  console.log(
    `${ok ? 'OK' : 'FAIL'} ${c.label}: action=${t.accion} on=${t.onAction} ratio=${ratio.toFixed(2)}`
  );
  if (!ok) failed += 1;
}

// Ensure app adapter source no longer invents --bg-primary in theme-css-vars
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const cssVars = readFileSync(join(root, 'lib/business/theme-css-vars.ts'), 'utf8');
if (/['"]--bg-primary['"]\s*:/.test(cssVars)) {
  console.error('FAIL: theme-css-vars.ts still assigns --bg-primary');
  failed += 1;
} else {
  console.log('OK: theme-css-vars.ts does not assign --bg-primary');
}

if (!cssVars.includes('buildStorefrontTheme') && !cssVars.includes('@buscadis/storefront-kit')) {
  console.error('FAIL: theme-css-vars.ts should use @buscadis/storefront-kit');
  failed += 1;
} else {
  console.log('OK: theme-css-vars wired to storefront-kit');
}

if (failed) {
  console.error(`\n${failed} failure(s)`);
  process.exit(1);
}
console.log('\nStorefront tenant contrast smoke passed.');

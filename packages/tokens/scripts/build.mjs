#!/usr/bin/env node
/**
 * @buscadis/tokens build pipeline
 * Source of truth: packages/tokens/src JSON files
 * Artifacts: dist/tokens.css | tokens.ts | tokens.json | tailwind-preset.js
 *
 * Uses Style Dictionary 5.x transforms where useful; semantic light/dark
 * modes are assembled by this script (SD has no first-class dual-theme CSS yet).
 */

import { mkdirSync, readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import StyleDictionary from 'style-dictionary';
import { verifyContrast } from './verify-contrast.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SRC = join(ROOT, 'src');
const DIST = join(ROOT, 'dist');

function loadJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function walkJsonFiles(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walkJsonFiles(full, acc);
    else if (entry.name.endsWith('.json')) acc.push(full);
  }
  return acc;
}

function deepMerge(target, source) {
  const out = { ...target };
  for (const [key, value] of Object.entries(source)) {
    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      !(value.value !== undefined && Object.keys(value).every((k) => ['value', 'type', 'comment', '$type', '$value', '$description'].includes(k) || k.startsWith('$')))
    ) {
      const looksLikeToken =
        Object.prototype.hasOwnProperty.call(value, 'value') ||
        Object.prototype.hasOwnProperty.call(value, '$value');
      if (looksLikeToken) {
        out[key] = value;
      } else {
        out[key] = deepMerge(out[key] || {}, value);
      }
    } else {
      out[key] = value;
    }
  }
  return out;
}

function flattenTokens(obj, path = [], out = []) {
  if (!obj || typeof obj !== 'object') return out;
  const isToken =
    Object.prototype.hasOwnProperty.call(obj, 'value') ||
    Object.prototype.hasOwnProperty.call(obj, '$value');
  if (isToken) {
    out.push({
      path: path.join('.'),
      name: path.join('-'),
      value: obj.value ?? obj.$value,
      type: obj.type ?? obj.$type,
      comment: obj.comment ?? obj.$description,
    });
    return out;
  }
  for (const [key, child] of Object.entries(obj)) {
    flattenTokens(child, [...path, key], out);
  }
  return out;
}

function getByPath(tree, dotted) {
  return dotted.split('.').reduce((acc, key) => (acc == null ? acc : acc[key]), tree);
}

function resolveValue(raw, tree, stack = []) {
  if (typeof raw !== 'string') return raw;
  return raw.replace(/\{([^}]+)\}/g, (_, ref) => {
    if (stack.includes(ref)) {
      throw new Error(`Circular token reference: ${[...stack, ref].join(' → ')}`);
    }
    const node = getByPath(tree, ref);
    if (!node) throw new Error(`Unresolved token reference: {${ref}}`);
    const next = node.value ?? node.$value ?? node;
    if (typeof next === 'object') {
      throw new Error(`Reference {${ref}} does not resolve to a leaf value`);
    }
    return String(resolveValue(String(next), tree, [...stack, ref]));
  });
}

function resolveTree(tree) {
  const flat = flattenTokens(tree);
  const map = Object.fromEntries(flat.map((t) => [t.path, t]));
  for (const token of flat) {
    token.resolved = resolveValue(String(token.value), tree);
  }
  return { flat, map };
}

function cssVarName(path) {
  // color.adis.600 → --bs-color-adis-600 for primitives
  // bs.bg.canvas → --bs-bg-canvas
  // cat.empleos.fg → --bs-cat-empleos-fg
  const parts = path.split('.');
  if (parts[0] === 'bs') {
    return `--bs-${parts
      .slice(1)
      .map((p) => (p === 'DEFAULT' ? '' : p))
      .filter(Boolean)
      .join('-')}`;
  }
  if (parts[0] === 'cat') {
    return `--bs-cat-${parts.slice(1).join('-')}`;
  }
  return `--bs-${parts.join('-')}`;
}

function hexToRgbChannels(hex) {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
}

function buildCss(lightResolved, darkResolved, primitivesResolved, categoriesResolved) {
  const lightLines = [];
  const darkLines = [];
  const primitiveLines = [];
  const catLines = [];

  for (const t of primitivesResolved.flat) {
    if (t.path.startsWith('color.') || t.path.startsWith('space.') || t.path.startsWith('radius.') || t.path.startsWith('elevation.') || t.path.startsWith('z.') || t.path.startsWith('motion.') || t.path.startsWith('density.') || t.path.startsWith('container.') || t.path.startsWith('breakpoint.')) {
      primitiveLines.push(`  ${cssVarName(t.path)}: ${t.resolved};`);
    }
  }

  for (const t of lightResolved.flat) {
    if (!t.path.startsWith('bs.')) continue;
    lightLines.push(`  ${cssVarName(t.path)}: ${t.resolved};`);
  }

  for (const t of darkResolved.flat) {
    if (!t.path.startsWith('bs.')) continue;
    darkLines.push(`  ${cssVarName(t.path)}: ${t.resolved};`);
  }

  for (const t of categoriesResolved.flat) {
    catLines.push(`  ${cssVarName(t.path)}: ${t.resolved};`);
  }

  const adis400 = primitivesResolved.map['color.adis.400']?.resolved ?? '#53ACC5';
  const sol400 = primitivesResolved.map['color.sol.400']?.resolved ?? '#FFC24A';
  const adis600 = primitivesResolved.map['color.adis.600']?.resolved ?? '#2A7C94';

  // Legacy aliases keep the existing app alive during migration (Sprint 1).
  const legacyLight = `
  /* Legacy aliases — migrate components to --bs-* then delete */
  --brand-blue: var(--bs-identity);
  --brand-yellow: var(--bs-identity-warm);
  --brand-primary-rgb: ${hexToRgbChannels(adis400)};
  --brand-yellow-rgb: ${hexToRgbChannels(sol400)};
  --brand-mesh:
    radial-gradient(at 0% 0%, rgba(${hexToRgbChannels(adis400)}, 0.17) 0px, transparent 58%),
    radial-gradient(at 100% 0%, rgba(${hexToRgbChannels(sol400)}, 0.2) 0px, transparent 58%),
    radial-gradient(at 100% 100%, rgba(${hexToRgbChannels(adis400)}, 0.12) 0px, transparent 55%),
    radial-gradient(at 0% 100%, rgba(${hexToRgbChannels(sol400)}, 0.15) 0px, transparent 55%),
    radial-gradient(at 48% 42%, rgba(${hexToRgbChannels(adis400)}, 0.06) 0px, transparent 68%);
  --brand-mesh-soft:
    radial-gradient(at 0% 0%, rgba(${hexToRgbChannels(adis400)}, 0.11) 0px, transparent 52%),
    radial-gradient(at 100% 100%, rgba(${hexToRgbChannels(sol400)}, 0.14) 0px, transparent 52%);
  --color-secondary: var(--bs-identity-warm);
  --accent-color: var(--bs-identity);
  --text-primary: var(--bs-fg-default);
  --text-secondary: var(--bs-fg-muted);
  --text-tertiary: var(--bs-fg-subtle);
  --bg-primary: var(--bs-bg-surface);
  --bg-secondary: var(--bs-bg-canvas);
  --bg-tertiary: var(--bs-bg-sunken);
  --border-color: var(--bs-border-default);
  --border-subtle: var(--bs-border-subtle);
  --hover-bg: color-mix(in srgb, var(--bs-identity) 12%, transparent);
  --hover-bg-yellow: color-mix(in srgb, var(--bs-identity-warm) 14%, transparent);
  --focus-ring: var(--bs-focus-ring);
  --card-radius: var(--bs-radius-lg);
  --card-shadow: var(--bs-elevation-1);
  --card-shadow-hover: var(--bs-elevation-2);
  --popover-shadow: var(--bs-elevation-3);
  --shadow-sm: var(--bs-elevation-1);
  --shadow-md: var(--bs-elevation-2);
  --shadow-lg: var(--bs-elevation-3);
  --shadow-hover: var(--bs-elevation-3);
  --shadow-up: 0 -4px 16px rgba(16, 22, 26, 0.04);
  --space-1: var(--bs-space-1);
  --space-2: var(--bs-space-2);
  --space-3: var(--bs-space-3);
  --space-4: var(--bs-space-4);
  --space-5: var(--bs-space-5);
  --space-6: var(--bs-space-6);
  --space-8: var(--bs-space-8);
  --cat-empleos: var(--bs-cat-empleos-fg);
  --cat-inmuebles: var(--bs-cat-inmuebles-fg);
  --cat-vehiculos: var(--bs-cat-vehiculos-fg);
  --cat-servicios: var(--bs-cat-servicios-fg);
  --cat-productos: var(--bs-cat-productos-fg);
  --cat-eventos: var(--bs-cat-eventos-fg);
  --cat-negocios: var(--bs-cat-negocios-fg);
  --cat-comunidad: var(--bs-cat-comunidad-fg);
  --glass-bg: color-mix(in srgb, var(--bs-bg-surface) 70%, transparent);
  --glass-border: color-mix(in srgb, var(--bs-bg-surface) 50%, transparent);
  --scrollbar-thumb: color-mix(in srgb, var(--bs-fg-default) 18%, transparent);
  --scrollbar-track: transparent;`;

  const legacyDark = `
  --brand-blue: var(--bs-identity);
  --brand-yellow: var(--bs-identity-warm);
  --brand-mesh:
    radial-gradient(at 0% 0%, rgba(${hexToRgbChannels(adis400)}, 0.10) 0px, transparent 55%),
    radial-gradient(at 100% 0%, rgba(${hexToRgbChannels(sol400)}, 0.07) 0px, transparent 52%),
    radial-gradient(at 100% 100%, rgba(${hexToRgbChannels(adis400)}, 0.08) 0px, transparent 55%),
    radial-gradient(at 0% 100%, rgba(${hexToRgbChannels(sol400)}, 0.06) 0px, transparent 50%);
  --brand-mesh-soft:
    radial-gradient(at 0% 0%, rgba(${hexToRgbChannels(adis400)}, 0.07) 0px, transparent 50%),
    radial-gradient(at 100% 100%, rgba(${hexToRgbChannels(sol400)}, 0.06) 0px, transparent 48%);
  --glass-bg: color-mix(in srgb, var(--bs-bg-surface) 88%, transparent);
  --glass-border: rgba(255, 255, 255, 0.08);
  --scrollbar-thumb: color-mix(in srgb, var(--bs-fg-default) 14%, transparent);`;

  return `/**
 * @buscadis/tokens — generated. Do not edit.
 * Source: packages/tokens/src
 * Rebuild: npm run tokens:build
 */

:root {
${primitiveLines.join('\n')}
${lightLines.join('\n')}
${catLines.join('\n')}
${legacyLight}

  --bs-brand-action: ${adis600};
  --bs-brand-identity: ${adis400};
  --bs-brand-warm: ${sol400};
}

.dark-mode,
html.dark {
  color-scheme: dark;
${darkLines.join('\n')}
${legacyDark}
}

@media (prefers-color-scheme: dark) {
  :root:not(.light-mode) {
    color-scheme: dark;
${darkLines.join('\n')}
${legacyDark}
  }
}

.light-mode {
  color-scheme: light;
${lightLines.join('\n')}
${legacyLight}
}
`;
}

function buildTs(lightResolved, primitivesResolved, categoriesResolved) {
  const entries = [];
  for (const t of [...primitivesResolved.flat, ...lightResolved.flat, ...categoriesResolved.flat]) {
    const varName = cssVarName(t.path);
    entries.push(`  '${varName}': '${t.resolved}'`);
  }
  return `/**
 * @buscadis/tokens — generated. Do not edit.
 * Rebuild: npm run tokens:build
 */

export const tokens = {
${entries.join(',\n')}
} as const;

export type TokenName = keyof typeof tokens;

export const brand = {
  identity: '${primitivesResolved.map['color.adis.400']?.resolved}',
  action: '${primitivesResolved.map['color.adis.600']?.resolved}',
  warm: '${primitivesResolved.map['color.sol.400']?.resolved}',
  onWarm: '${primitivesResolved.map['color.ink.onWarm']?.resolved}',
} as const;

export const categories = {
  empleos: '${categoriesResolved.map['cat.empleos.fg']?.resolved}',
  inmuebles: '${categoriesResolved.map['cat.inmuebles.fg']?.resolved}',
  vehiculos: '${categoriesResolved.map['cat.vehiculos.fg']?.resolved}',
  servicios: '${categoriesResolved.map['cat.servicios.fg']?.resolved}',
  productos: '${categoriesResolved.map['cat.productos.fg']?.resolved}',
  eventos: '${categoriesResolved.map['cat.eventos.fg']?.resolved}',
  negocios: '${categoriesResolved.map['cat.negocios.fg']?.resolved}',
  comunidad: '${categoriesResolved.map['cat.comunidad.fg']?.resolved}',
} as const;

export default tokens;
`;
}

function buildW3c(primitives, light, dark, categories) {
  return {
    $schema: 'https://design-tokens.github.io/community-group/format/',
    $description: 'Buscadis design tokens — generated from packages/tokens/src',
    primitive: primitives,
    semantic: {
      light,
      dark,
    },
    category: categories,
  };
}

function buildTailwindPreset(primitivesResolved, lightResolved) {
  const colors = {
    adis: {},
    sol: {},
    neutral: {},
    bs: {
      canvas: 'var(--bs-bg-canvas)',
      surface: 'var(--bs-bg-surface)',
      'surface-2': 'var(--bs-bg-surface-2)',
      sunken: 'var(--bs-bg-sunken)',
      action: 'var(--bs-action)',
      'action-hover': 'var(--bs-action-hover)',
      identity: 'var(--bs-identity)',
      warm: 'var(--bs-identity-warm)',
      publish: 'var(--bs-publish-bg)',
      danger: 'var(--bs-danger-fg)',
      success: 'var(--bs-success-fg)',
      warning: 'var(--bs-warning-fg)',
    },
  };

  for (const t of primitivesResolved.flat) {
    if (t.path.startsWith('color.adis.')) {
      colors.adis[t.path.split('.').pop()] = t.resolved;
    }
    if (t.path.startsWith('color.sol.')) {
      colors.sol[t.path.split('.').pop()] = t.resolved;
    }
    if (t.path.startsWith('color.neutral.')) {
      colors.neutral[t.path.split('.').pop()] = t.resolved;
    }
  }

  const spacing = {};
  for (const t of primitivesResolved.flat) {
    if (t.path.startsWith('space.')) {
      spacing[t.path.split('.').pop()] = t.resolved;
    }
  }

  const borderRadius = {};
  for (const t of primitivesResolved.flat) {
    if (t.path.startsWith('radius.')) {
      const key = t.path.split('.').pop();
      borderRadius[key] = t.resolved;
    }
  }

  const screens = {
    sm: '480px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  };

  const boxShadow = {
    1: 'var(--bs-elevation-1)',
    2: 'var(--bs-elevation-2)',
    3: 'var(--bs-elevation-3)',
    4: 'var(--bs-elevation-4)',
    focus: 'var(--bs-focus-ring)',
  };

  const zIndex = {};
  for (const t of primitivesResolved.flat) {
    if (t.path.startsWith('z.')) {
      zIndex[t.path.split('.').pop()] = t.resolved;
    }
  }

  const preset = {
    theme: {
      extend: {
        colors,
        spacing,
        borderRadius,
        screens,
        boxShadow,
        zIndex,
        maxWidth: {
          prose: '640px',
          feed: '480px',
          app: '1440px',
          panel: '420px',
        },
        transitionDuration: {
          instant: '100ms',
          fast: '150ms',
          normal: '250ms',
          slow: '400ms',
        },
        transitionTimingFunction: {
          out: 'cubic-bezier(0, 0, 0.2, 1)',
          inout: 'cubic-bezier(0.4, 0, 0.2, 1)',
          smooth: 'cubic-bezier(0.16, 1, 0.3, 1)',
        },
        fontFamily: {
          sans: [
            'system-ui',
            '-apple-system',
            'BlinkMacSystemFont',
            '"Segoe UI"',
            'Roboto',
            '"Helvetica Neue"',
            'Arial',
            'sans-serif',
          ],
          display: [
            'var(--font-archivo)',
            'system-ui',
            '-apple-system',
            'sans-serif',
          ],
        },
      },
    },
  };

  // silence unused for lint in generated context
  void lightResolved;

  return `/**
 * @buscadis/tokens — generated Tailwind preset. Do not edit.
 * Rebuild: npm run tokens:build
 * Usage: presets: [require('@buscadis/tokens/tailwind-preset')]
 */

module.exports = ${JSON.stringify(preset, null, 2)};
`;
}

async function assertStyleDictionaryAvailable() {
  // Touch Style Dictionary so the dependency is real and version is logged.
  const sd = new StyleDictionary({
    source: [join(SRC, 'primitive/color.json')],
    log: { verbosity: 'silent' },
    platforms: {},
  });
  await sd.hasInitialized;
  console.log(`style-dictionary ${StyleDictionary.VERSION || '5.x'} ready`);
}

function main() {
  mkdirSync(DIST, { recursive: true });

  const primitiveFiles = walkJsonFiles(join(SRC, 'primitive'));
  const categoryFile = join(SRC, 'semantic/category.json');
  const lightFile = join(SRC, 'semantic/light.json');
  const darkFile = join(SRC, 'semantic/dark.json');

  let primitives = {};
  for (const file of primitiveFiles) {
    primitives = deepMerge(primitives, loadJson(file));
  }
  const categories = loadJson(categoryFile);
  const light = deepMerge(deepMerge({}, primitives), deepMerge(loadJson(lightFile), categories));
  const dark = deepMerge(deepMerge({}, primitives), deepMerge(loadJson(darkFile), categories));

  const primitivesResolved = resolveTree(primitives);
  const lightResolved = resolveTree(light);
  const darkResolved = resolveTree(dark);
  const categoriesResolved = resolveTree(deepMerge(primitives, categories));

  const css = buildCss(lightResolved, darkResolved, primitivesResolved, categoriesResolved);
  const ts = buildTs(lightResolved, primitivesResolved, categoriesResolved);
  const w3c = buildW3c(
    loadJson(join(SRC, 'primitive/color.json')),
    loadJson(lightFile),
    loadJson(darkFile),
    categories
  );
  // Include other primitives in W3C export
  for (const file of primitiveFiles) {
    const rel = relative(join(SRC, 'primitive'), file).replace(/\.json$/, '');
    if (rel !== 'color') {
      w3c.primitive[rel] = loadJson(file);
    }
  }

  const preset = buildTailwindPreset(primitivesResolved, lightResolved);

  writeFileSync(join(DIST, 'tokens.css'), css);
  writeFileSync(join(DIST, 'tokens.ts'), ts);
  writeFileSync(join(DIST, 'tokens.json'), JSON.stringify(w3c, null, 2) + '\n');
  writeFileSync(join(DIST, 'tailwind-preset.cjs'), preset);
  // Keep .js copy for docs paths; same CJS body (package is "type":"module" so .cjs is required)
  writeFileSync(join(DIST, 'tailwind-preset.js'), preset);

  console.log('Wrote dist/tokens.css');
  console.log('Wrote dist/tokens.ts');
  console.log('Wrote dist/tokens.json');
  console.log('Wrote dist/tailwind-preset.cjs');
  console.log('Wrote dist/tailwind-preset.js');

  const contrast = verifyContrast(lightResolved, darkResolved, primitivesResolved);
  if (contrast.violations.length > 0) {
    console.error('\nContrast violations:');
    for (const v of contrast.violations) {
      console.error(`  ✗ ${v.pair}: ${v.ratio.toFixed(2)}:1 (need ${v.min}:1) — ${v.fg} on ${v.bg}`);
    }
    process.exitCode = 1;
  } else {
    console.log(`\nContrast: ${contrast.checked} semantic pairs OK (0 violations)`);
  }
}

await assertStyleDictionaryAvailable();
main();

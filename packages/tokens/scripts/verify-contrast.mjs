/**
 * WCAG contrast gate for semantic token pairs.
 * Runs after token resolution in build.mjs.
 */
import { parse, converter } from 'culori';
import { hex as wcagHex } from 'wcag-contrast';

const toRgb = converter('rgb');

function toHex(value) {
  if (!value || typeof value !== 'string') return null;
  const v = value.trim();
  if (v.startsWith('rgba') || v.startsWith('rgb') || v.startsWith('color-mix')) {
    return null; // skip non-solid for text pairs
  }
  if (v.startsWith('#')) {
    const parsed = parse(v);
    if (!parsed) return null;
    const rgb = toRgb(parsed);
    const hex = (n) =>
      Math.round(Math.min(1, Math.max(0, n)) * 255)
        .toString(16)
        .padStart(2, '0');
    return `#${hex(rgb.r)}${hex(rgb.g)}${hex(rgb.b)}`.toUpperCase();
  }
  const parsed = parse(v);
  if (!parsed) return null;
  const rgb = toRgb(parsed);
  const hex = (n) =>
    Math.round(Math.min(1, Math.max(0, n)) * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${hex(rgb.r)}${hex(rgb.g)}${hex(rgb.b)}`.toUpperCase();
}

function ratio(fg, bg) {
  const a = toHex(fg);
  const b = toHex(bg);
  if (!a || !b) return null;
  return wcagHex(a, b);
}

function get(map, path) {
  return map[path]?.resolved;
}

/**
 * @param {{ map: Record<string, { resolved: string }> }} light
 * @param {{ map: Record<string, { resolved: string }> }} dark
 * @param {{ map: Record<string, { resolved: string }> }} primitives
 */
export function verifyContrast(light, dark, primitives) {
  const violations = [];
  let checked = 0;

  const pairs = [
    // Light mode text
    { mode: 'light', fg: 'bs.fg.default', bg: 'bs.bg.surface', min: 4.5, map: light.map },
    { mode: 'light', fg: 'bs.fg.default', bg: 'bs.bg.canvas', min: 4.5, map: light.map },
    { mode: 'light', fg: 'bs.fg.muted', bg: 'bs.bg.surface', min: 4.5, map: light.map },
    { mode: 'light', fg: 'bs.fg.subtle', bg: 'bs.bg.surface', min: 4.5, map: light.map },
    { mode: 'light', fg: 'bs.fg.on-action', bg: 'bs.action.DEFAULT', min: 4.5, map: light.map },
    { mode: 'light', fg: 'bs.fg.on-warm', bg: 'bs.publish.bg', min: 4.5, map: light.map },
    { mode: 'light', fg: 'bs.success.fg', bg: 'bs.success.bg', min: 4.5, map: light.map },
    { mode: 'light', fg: 'bs.danger.fg', bg: 'bs.danger.bg', min: 4.5, map: light.map },
    { mode: 'light', fg: 'bs.warning.fg', bg: 'bs.warning.bg', min: 4.5, map: light.map },
    { mode: 'light', fg: 'bs.info.fg', bg: 'bs.info.bg', min: 4.5, map: light.map },
    // UI chrome 3:1
    { mode: 'light', fg: 'bs.border.focus', bg: 'bs.bg.surface', min: 3.0, map: light.map },
    { mode: 'light', fg: 'bs.action.DEFAULT', bg: 'bs.bg.surface', min: 3.0, map: light.map },
    // Dark mode text
    { mode: 'dark', fg: 'bs.fg.default', bg: 'bs.bg.surface', min: 4.5, map: dark.map },
    { mode: 'dark', fg: 'bs.fg.default', bg: 'bs.bg.canvas', min: 4.5, map: dark.map },
    { mode: 'dark', fg: 'bs.fg.muted', bg: 'bs.bg.surface', min: 4.5, map: dark.map },
    { mode: 'dark', fg: 'bs.fg.subtle', bg: 'bs.bg.surface', min: 4.5, map: dark.map },
    { mode: 'dark', fg: 'bs.fg.on-action', bg: 'bs.action.DEFAULT', min: 4.5, map: dark.map },
    { mode: 'dark', fg: 'bs.fg.on-warm', bg: 'bs.publish.bg', min: 4.5, map: dark.map },
    { mode: 'dark', fg: 'bs.success.fg', bg: 'bs.success.bg', min: 4.5, map: dark.map },
    { mode: 'dark', fg: 'bs.danger.fg', bg: 'bs.danger.bg', min: 4.5, map: dark.map },
    { mode: 'dark', fg: 'bs.warning.fg', bg: 'bs.warning.bg', min: 4.5, map: dark.map },
    { mode: 'dark', fg: 'bs.info.fg', bg: 'bs.info.bg', min: 4.5, map: dark.map },
    { mode: 'dark', fg: 'bs.border.focus', bg: 'bs.bg.surface', min: 3.0, map: dark.map },
    { mode: 'dark', fg: 'bs.action.DEFAULT', bg: 'bs.bg.surface', min: 3.0, map: dark.map },
    // Brand identity must NOT be used as action-with-white (document the failure as informational)
  ];

  for (const p of pairs) {
    const fg = get(p.map, p.fg);
    const bg = get(p.map, p.bg);
    const r = ratio(fg, bg);
    if (r == null) continue;
    checked += 1;
    if (r < p.min) {
      violations.push({
        pair: `${p.mode}:${p.fg} on ${p.bg}`,
        fg,
        bg,
        ratio: r,
        min: p.min,
      });
    }
  }

  // Identity vs white — expected to fail; report as info, not violation of semantic gate
  const identity = get(primitives.map, 'color.adis.400');
  const identityRatio = ratio('#FFFFFF', identity);
  if (identityRatio != null) {
    console.log(
      `Contrast info: white on identity adis-400 (${identity}) = ${identityRatio.toFixed(2)}:1 — must NOT be used for action text (use adis-600)`
    );
  }
  const legacyCta = ratio(identity, get(primitives.map, 'color.sol.400'));
  if (legacyCta != null) {
    console.log(
      `Contrast info: legacy CTA (adis-400 on sol-400) = ${legacyCta.toFixed(2)}:1 — replaced by on-warm on publish-bg`
    );
  }

  return { checked, violations };
}

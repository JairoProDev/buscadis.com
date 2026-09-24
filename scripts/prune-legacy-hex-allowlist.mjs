#!/usr/bin/env node
/**
 * Rebuild legacy-hex-allowlist.json from hex literals still used in app/components/lib
 * that are NOT already in packages/tokens/dist/tokens.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tokensTs = fs.readFileSync(path.join(root, 'packages/tokens/dist/tokens.ts'), 'utf8');
const allowed = new Set();
for (const m of tokensTs.matchAll(/'#[0-9a-fA-F]{3,8}'/g)) {
  allowed.add(normalize(m[0].slice(1, -1)));
}

function normalize(hex) {
  let h = hex.toLowerCase();
  if (h.length === 4) h = `#${h[1]}${h[1]}${h[2]}${h[2]}${h[3]}${h[3]}`;
  else if (h.length === 5) h = `#${h[1]}${h[1]}${h[2]}${h[2]}${h[3]}${h[3]}${h[4]}${h[4]}`;
  else if (h.length === 9) h = h.slice(0, 7);
  return h;
}

const HEX = /#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g;
const dirs = ['app', 'components', 'lib'];
const needed = new Set();

function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === 'node_modules' || ent.name === '.next') continue;
      walk(p);
      continue;
    }
    if (!/\.(tsx?|jsx?)$/.test(ent.name)) continue;
    const text = fs.readFileSync(p, 'utf8');
    HEX.lastIndex = 0;
    let match;
    while ((match = HEX.exec(text)) !== null) {
      const n = normalize(match[0]);
      if (n && !allowed.has(n)) needed.add(n);
    }
  }
}

for (const d of dirs) walk(path.join(root, d));

const outPath = path.join(root, 'packages/tokens/src/legacy-hex-allowlist.json');
const payload = {
  $description:
    'Hex still used outside @buscadis/tokens in app/components/lib — shrink by migrating to tokens (see lib/bs-tokens.ts). Auto: node scripts/prune-legacy-hex-allowlist.mjs',
  colors: [...needed].sort(),
};
fs.writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`);
console.log(`legacy allowlist: ${payload.colors.length} colors (token palette has ${allowed.size})`);

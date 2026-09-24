/**
 * ESLint rule: ban raw hex / rgb color literals outside packages/tokens.
 *
 * Hex values must appear in @buscadis/tokens (dist/tokens.ts) or legacy-hex-allowlist.json.
 * rgba()/hsl() literals are allowed (overlays, shadows); prefer tokens for solid brand colors.
 *
 * Escape hatch (migrate later):
 *   // eslint-disable-next-line buscadis-tokens/no-raw-colors -- TODO(tokens): migrate
 */

const fs = require('fs');
const path = require('path');

const HEX_LITERAL = /#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g;

const ALLOWED_PATH_FRAGMENTS = [
  'packages/tokens/',
  'packages/tokens\\',
  'design-system-improve-renew',
  'design-system-extract',
];

let allowedHexCache = null;
let allowedHexCacheMtime = 0;

function normalizeHex(hex) {
  if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) return null;
  let h = hex.toLowerCase();
  if (h.length === 4) {
    h = `#${h[1]}${h[1]}${h[2]}${h[2]}${h[3]}${h[3]}`;
  } else if (h.length === 5) {
    h = `#${h[1]}${h[1]}${h[2]}${h[2]}${h[3]}${h[3]}${h[4]}${h[4]}`;
  } else if (h.length === 9) {
    h = h.slice(0, 7);
  }
  return h;
}

function loadAllowedHexSet() {
  const tokensRoot = path.join(__dirname, '..');
  const legacyPath = path.join(tokensRoot, 'src', 'legacy-hex-allowlist.json');
  const tokensPath = path.join(tokensRoot, 'dist', 'tokens.ts');

  let mtime = 0;
  for (const p of [legacyPath, tokensPath]) {
    try {
      mtime = Math.max(mtime, fs.statSync(p).mtimeMs);
    } catch {
      // missing file
    }
  }
  if (allowedHexCache && mtime <= allowedHexCacheMtime) return allowedHexCache;

  const set = new Set();

  try {
    const tokensTs = fs.readFileSync(tokensPath, 'utf8');
    for (const m of tokensTs.matchAll(/'#[0-9a-fA-F]{3,8}'/g)) {
      const n = normalizeHex(m[0].slice(1, -1));
      if (n) set.add(n);
    }
  } catch {
    // tokens not built yet — rule stays permissive for hex until dist exists
  }

  try {
    const legacy = JSON.parse(fs.readFileSync(legacyPath, 'utf8'));
    for (const c of legacy.colors || []) {
      const n = normalizeHex(c);
      if (n) set.add(n);
    }
  } catch {
    // optional file
  }

  allowedHexCache = set;
  allowedHexCacheMtime = mtime;
  return set;
}

function isAllowedFile(filename) {
  if (!filename) return true;
  const normalized = filename.replace(/\\/g, '/');
  return ALLOWED_PATH_FRAGMENTS.some((frag) => normalized.includes(frag.replace(/\\/g, '/')));
}

function findDisallowedHex(value, allowed) {
  if (typeof value !== 'string') return null;
  HEX_LITERAL.lastIndex = 0;
  let match;
  while ((match = HEX_LITERAL.exec(value)) !== null) {
    const normalized = normalizeHex(match[0]);
    if (normalized && !allowed.has(normalized)) {
      return match[0];
    }
  }
  return null;
}

const rule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow raw hex outside @buscadis/tokens allowlist. Use CSS variables or token imports.',
    },
    schema: [],
    messages: {
      rawColor:
        'Raw color "{{value}}" is banned outside packages/tokens. Use var(--bs-*) or import from @buscadis/tokens. Temporary: // eslint-disable-next-line buscadis-tokens/no-raw-colors',
    },
  },
  create(context) {
    const filename = context.getFilename?.() || context.filename;
    if (isAllowedFile(filename)) return {};

    const allowed = loadAllowedHexSet();

    function check(node, value) {
      const bad = findDisallowedHex(value, allowed);
      if (bad) {
        context.report({
          node,
          messageId: 'rawColor',
          data: { value: bad },
        });
      }
    }

    return {
      Literal(node) {
        check(node, node.value);
      },
      TemplateElement(node) {
        check(node, node.value?.cooked);
      },
    };
  },
};

module.exports = {
  rules: {
    'no-raw-colors': rule,
  },
};

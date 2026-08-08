/**
 * ESLint rule: ban raw hex / rgb color literals outside packages/tokens.
 *
 * Escape hatch (migrate later):
 *   // eslint-disable-next-line @buscadis/tokens/no-raw-colors -- TODO(tokens): migrate
 */

const HEX_LITERAL = /#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/;
// Only flag rgba/hsla when they contain numeric color channels (not var(--…))
const RGB_LITERAL = /\brgba?\(\s*\d/;
const HSL_LITERAL = /\bhsla?\(\s*\d/;

const ALLOWED_PATH_FRAGMENTS = [
  'packages/tokens/',
  'packages/tokens\\',
  'design-system-improve-renew',
  'design-system-extract',
];

function isAllowedFile(filename) {
  if (!filename) return true;
  const normalized = filename.replace(/\\/g, '/');
  return ALLOWED_PATH_FRAGMENTS.some((frag) => normalized.includes(frag.replace(/\\/g, '/')));
}

const rule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow raw color literals outside @buscadis/tokens. Use CSS variables or token imports.',
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

    function check(node, value) {
      if (typeof value !== 'string') return;
      const match =
        value.match(HEX_LITERAL) || value.match(RGB_LITERAL) || value.match(HSL_LITERAL);
      if (match) {
        context.report({
          node,
          messageId: 'rawColor',
          data: { value: match[0] },
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

# @buscadis/tokens

JSON is the source of truth. CSS, TypeScript, W3C JSON, and the Tailwind preset are generated.

## Build

```bash
npm run tokens:build
# or
npm run build --workspace=@buscadis/tokens
```

Artifacts in `dist/` (committed — audit trail):

| File | Purpose |
|------|---------|
| `tokens.css` | CSS variables (`--bs-*`) + legacy aliases |
| `tokens.ts` | Typed token map |
| `tokens.json` | W3C DTCG for Figma / Token Studio |
| `tailwind-preset.js` | Tailwind `presets` entry |

## Layers

1. **Primitive** — `src/primitive/*` (adis, sol, neutral, space, radius…)
2. **Semantic** — `src/semantic/light.json`, `dark.json`, `category.json`
3. **Component** — `src/component/component.json` (empty until justified)

## Contrast gate

Post-build WCAG checks on semantic pairs. Build fails on violations.

## Note on Style Dictionary

Latest stable is **5.5.1** (no 6.x on npm yet). The build uses Style Dictionary for init/version and a custom assembler for dual-theme CSS (light + dark), which SD does not emit as a first-class single file.

## Legacy aliases

`tokens.css` maps `--brand-blue`, `--bg-*`, `--text-*`, `--space-*`, `--cat-*` → `--bs-*` so the existing app keeps working during component migration.

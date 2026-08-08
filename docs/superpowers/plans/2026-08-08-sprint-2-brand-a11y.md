# Sprint 2 — Brand freeze + P0 accessibility

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Congelar marca canónica (`#53ACC5` / `#FFC24A`), separar identidad de acción en UI real, corregir CTA Publicar a contraste AA, unificar categorías, optimizar logo, touch targets ≥44px, y eliminar hex derogados críticos.

**Architecture:** Los tokens ya existen en `@buscadis/tokens`. Este sprint **consume** esos tokens en superficies de producto (CTA, PWA, categorías, header) y limpia valores derogados. No crea primitivas nuevas (eso es Sprint 3).

**Tech Stack:** Next.js 15, Tailwind 3.4 + `@buscadis/tokens` preset, CSS vars `--bs-*`, `culori`/`wcag-contrast` vía `tokens:build`, SVGO para logo.

## Global Constraints

- Tokens > código: ningún hex nuevo fuera de `packages/tokens/src`.
- Marca identidad: `adis-400` `#53ACC5` — no usar como fondo de botón con texto blanco.
- Acción: `adis-600` `#2A7C94` / `var(--bs-action)`.
- CTA Publicar: fondo `sol-400` / warm; texto e ícono `var(--bs-fg-on-warm)` `#10242B`.
- Derogados: `#38bdf8`, `#fbbf24`, `#ec4899` (fallback), `#3b82f6` (electric).
- Touch mínimo: 44×44 CSS px (primary nav preferible 48).
- Commits pequeños; no mezclar con Sprint 3 (primitivas).
- Alias legacy `--brand-*` se mantienen este sprint (puente).

---

## File map

| File | Responsibility |
|------|----------------|
| `public/manifest.json`, `public/site.webmanifest` | `theme_color` → `#53ACC5` |
| `lib/publish-cta-styles.ts` | CTA AA (fg on warm) |
| `lib/categoria-theme.ts` | Única fuente runtime = tokens de categoría |
| `packages/tokens/src/semantic/category.json` | Ya correcto — TS debe espejar |
| `components/HeaderIconButton.tsx` | Touch 44×44; action vs identity |
| `components/Header.tsx` | Logo size/touch; theme classes |
| `components/ThemeToggle.tsx` / `app/layout.tsx` | light-mode = force light (ya unificado en tokens) |
| `components/BentoCard.tsx` | Quitar `bg-electric-500` / glow |
| `components/catalog/SortableCategoryStrip.tsx` etc. | Fallback `#ec4899` → `var(--bs-identity-warm)` |
| `public/logo.svg` | Optimizar &lt;15KB (o PNG/WebP header-only) |
| `docs/MARKETPLACE-DESIGN-SPEC.md` | Hex alineados a canónicos |
| `docs/superpowers/plans/2026-08-08-design-system-roadmap.md` | Marcar S2 done al final |

---

### Task 1: Baseline metrics (medir antes de tocar)

**Files:** append results into roadmap or `docs/superpowers/plans/2026-08-08-sprint-2-baseline.md`

- [ ] **Step 1: Run baseline commands**

```bash
cd /home/jairoprodev/proyectos/buscadis.com
{
  echo "## Sprint 2 baseline $(date -Iseconds)"
  echo "logo.svg bytes: $(wc -c < public/logo.svg)"
  echo "logo.png bytes: $(wc -c < public/logo.png)"
  echo "hex literals components: $(rg -o '#[0-9a-fA-F]{3,8}\b' components --glob '*.{tsx,ts}' | wc -l)"
  echo "38bdf8 files: $(rg -l '38bdf8' --glob '*.{tsx,ts,json,webmanifest,css,md}' | wc -l)"
  echo "ec4899 files: $(rg -l 'ec4899' --glob '*.{tsx,ts,css}' | wc -l)"
  echo "fbbf24 files: $(rg -l 'fbbf24' --glob '*.{tsx,ts,css}' | wc -l)"
  node -e "
    import { hex } from 'wcag-contrast';
    console.log('CTA legacy (53ACC5 on FFC24A):', hex('#53ACC5','#FFC24A').toFixed(2));
    console.log('CTA target (10242B on FFC24A):', hex('#10242B','#FFC24A').toFixed(2));
    console.log('white on action 2A7C94:', hex('#FFFFFF','#2A7C94').toFixed(2));
  "
} | tee docs/superpowers/plans/2026-08-08-sprint-2-baseline.md
```

- [ ] **Step 2: Commit baseline**

```bash
git add docs/superpowers/plans/2026-08-08-sprint-2-baseline.md
git commit -m "$(cat <<'EOF'
docs: capture Sprint 2 design-system baseline metrics

EOF
)"
```

---

### Task 2: Freeze PWA / manifest theme_color

**Files:** `public/manifest.json`, `public/site.webmanifest`

- [ ] **Step 1: Set `theme_color` to `#53ACC5`** in both manifests (and `background_color` stay `#ffffff` light).

- [ ] **Step 2: Grep for leftover sky blue**

```bash
rg -n '38bdf8|fbbf24' public/ app/ --glob '*.{json,webmanifest,tsx,ts,html}'
```

Expected: no hits in `public/` manifests.

- [ ] **Step 3: Commit**

```bash
git add public/manifest.json public/site.webmanifest
git commit -m "$(cat <<'EOF'
fix: align PWA theme_color with canonical brand celeste

EOF
)"
```

---

### Task 3: Fix Publish CTA contrast (P0)

**Files:** `lib/publish-cta-styles.ts`

- [ ] **Step 1: Rewrite `publishCta` to use semantic tokens**

```ts
/** CTA Publicar: warm fill + dark ink (AA/AAA). Identity yellow stays; text is never brand-blue. */
export const publishCta = {
  iconColor: 'var(--bs-fg-on-warm)',
  labelColor: 'var(--bs-fg-on-warm)',
  background:
    'linear-gradient(145deg, var(--bs-color-sol-300) 0%, var(--bs-publish-bg) 50%, var(--bs-color-sol-500) 100%)',
  backgroundActive:
    'linear-gradient(145deg, var(--bs-color-sol-400) 0%, var(--bs-color-sol-500) 55%, var(--bs-color-sol-600) 100%)',
  shadow: '0 6px 18px color-mix(in srgb, var(--bs-publish-bg) 45%, transparent)',
  shadowActive:
    '0 6px 20px color-mix(in srgb, var(--bs-publish-bg) 55%, transparent), 0 0 0 3px color-mix(in srgb, var(--bs-action) 25%, transparent)',
} as const;
```

If `--bs-color-sol-*` names differ in `tokens.css`, use the actual generated names (`rg 'sol-400' packages/tokens/dist/tokens.css`). Fallback acceptable for one cycle:

```ts
background: 'linear-gradient(145deg, #FFD06A 0%, var(--bs-publish-bg) 50%, #F2A81F 100%)',
```

with eslint-disable + TODO to move gradient stops into tokens in a follow-up PR.

- [ ] **Step 2: Verify contrast**

```bash
node -e "import { hex } from 'wcag-contrast'; console.log(hex('#10242B','#FFC24A'))"
# expect >= 4.5 (actually ~11)
```

- [ ] **Step 3: Manual smoke** — open home, inspect Publicar button: ink dark on yellow, not celeste.

- [ ] **Step 4: Commit**

```bash
git add lib/publish-cta-styles.ts
git commit -m "$(cat <<'EOF'
fix: make Publish CTA meet WCAG contrast with on-warm ink

EOF
)"
```

---

### Task 4: Unify category theme source

**Files:** `lib/categoria-theme.ts`

- [ ] **Step 1: Replace `CATEGORIA_THEME` values** to match `packages/tokens/src/semantic/category.json` exactly:

| Cat | accent (fg) | placeholderBg | placeholderBgDark |
|-----|-------------|-----------------|-------------------|
| empleos | `#0F766E` | `#F0FDFA` | `#042F2E` |
| inmuebles | `#047857` | `#ECFDF5` | `#022C22` |
| vehiculos | `#C2410C` | `#FFF7ED` | `#431407` |
| servicios | `#A16207` | `#FFFBEB` | `#422006` |
| productos | `#BE123C` | `#FFF1F2` | `#4C0519` |
| eventos | `#7E22CE` | `#FAF5FF` | `#3B0764` |
| negocios | `#4F46E5` | `#EEF2FF` | `#1E1B4B` |
| comunidad | `#A21CAF` | `#FDF4FF` | `#4A044E` |

- [ ] **Step 2: Prefer reading from generated tokens** if easy:

```ts
import { categories } from '@buscadis/tokens';
// accent: categories.empleos, etc. — placeholders still from local map until tokens export them
```

Minimum: hardcode matching hexes + comment `// synced with packages/tokens/src/semantic/category.json`.

- [ ] **Step 3: Commit**

```bash
git add lib/categoria-theme.ts
git commit -m "$(cat <<'EOF'
fix: sync categoria theme accents with @buscadis/tokens

EOF
)"
```

---

### Task 5: Kill deprecated pink / electric / sky hexes (critical paths)

**Files:**  
`components/catalog/SortableCategoryStrip.tsx`  
`components/profile/ProfileStoryHighlights.tsx`  
`components/business/public/BusinessCatalogTab.tsx`  
`components/BentoCard.tsx`  
`components/ai/ListingCard.tsx` (category map)  
`lib/qr/presets.ts` (pink stop → sol)

- [ ] **Step 1: Replace `#ec4899` fallbacks** with `var(--bs-identity-warm)` or `#FFC24A`.

- [ ] **Step 2: `BentoCard`** — `bg-electric-500 shadow-glow-electric` → `bg-adis-600` or `bg-bs-action`.

- [ ] **Step 3: Grep gate**

```bash
rg -n 'ec4899|bg-electric|glow-electric|38bdf8' components lib --glob '*.{tsx,ts,css}'
```

Fix remaining product UI hits (leave docs alone).

- [ ] **Step 4: Commit**

```bash
git add components lib
git commit -m "$(cat <<'EOF'
refactor: remove deprecated pink/electric accents from product UI

EOF
)"
```

---

### Task 6: Header touch targets ≥44px

**Files:** `components/HeaderIconButton.tsx`, possibly `components/Header.tsx`

- [ ] **Step 1: Change button box** from `h-9 w-9` (36px) to `h-11 w-11` (44px). Keep visual icon ~18–20px centered.

- [ ] **Step 2: Active accent for primary actions** use `var(--bs-action)` not identity for text-on-tint if contrast requires it; identity OK for decorative tint only.

- [ ] **Step 3: Badge on yellow** already uses dark text — keep `text-[#1e293b]` → prefer `text-[var(--bs-fg-on-warm)]`.

- [ ] **Step 4: Commit**

```bash
git add components/HeaderIconButton.tsx components/Header.tsx
git commit -m "$(cat <<'EOF'
fix: raise header icon hit targets to 44px WCAG minimum

EOF
)"
```

---

### Task 7: Optimize logo asset

**Files:** `public/logo.svg` (and Header if it points to PNG)

- [ ] **Step 1: Measure**

```bash
wc -c public/logo.svg public/logo.png
```

- [ ] **Step 2: Optimize SVG**

```bash
npx --yes svgo public/logo.svg -o public/logo.svg --multipass
# or export a clean SVG from logo.png if SVG is a scanned/bloated path dump
wc -c public/logo.svg
```

If still >15KB: keep `logo.png` for header (`<Image>`), store optimized SVG as `logo-mark.svg` for icons/PWA; document in README of public/.

- [ ] **Step 3: Ensure Header uses the lightest asset that remains sharp at 48px height.**

- [ ] **Step 4: Commit**

```bash
git add public/logo.svg public/logo-mark.svg components/Header.tsx 2>/dev/null || true
git commit -m "$(cat <<'EOF'
perf: shrink brand logo asset under LCP budget

EOF
)"
```

---

### Task 8: Align marketplace design spec hexes + roadmap status

**Files:** `docs/MARKETPLACE-DESIGN-SPEC.md` (brand table only), roadmap

- [ ] **Step 1: Replace `#38bdf8` / `#fbbf24` in the brand token table** with `#53ACC5` / `#FFC24A` and note action = `#2A7C94`.

- [ ] **Step 2: Mark Sprint 2 done in roadmap table.**

- [ ] **Step 3: Commit**

```bash
git add docs/
git commit -m "$(cat <<'EOF'
docs: freeze marketplace spec brand hexes to production tokens

EOF
)"
```

---

### Task 9: Verification gate (DoD)

- [ ] **Step 1: Automated**

```bash
npm run tokens:build   # still 0 violations
rg -n '38bdf8' public/manifest.json public/site.webmanifest   # no matches
node -e "import { hex } from 'wcag-contrast'; console.log(hex('#10242B','#FFC24A'))"  # >= 4.5
wc -c public/logo.svg  # prefer < 15360
```

- [ ] **Step 2: Manual checklist**

- [ ] CTA Publicar: dark ink on yellow (home + mobile nav)
- [ ] Header icons: ≥44×44 tap area
- [ ] Theme toggle light/dark still works (`.light-mode` force light = same tokens as `:root`)
- [ ] Category chips: empleos teal, negocios indigo, vehiculos orange (not brand-celeste)
- [ ] No pink story rings

- [ ] **Step 3: Final commit only if leftover fixes** — then update roadmap status to ✅.

---

## Out of scope (do NOT do in Sprint 2)

- Creating `@buscadis/ui` / Radix Button (Sprint 3)
- SSR / fixing `Cargando…` for crawlers (Sprint 6 — can parallel later)
- Lucide migration of full Icons.tsx (Sprint 3)
- Storefront tenant contract (Sprint 8)
- Deleting legacy `--brand-*` aliases

## Rollback

All changes are CSS/token consumption + assets. Revert commits per-task. Tokens package untouched unless category JSON needs a fix (unlikely).

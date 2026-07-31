# Hybrid Flyer Covers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give every ad without a photo a professional flyer cover — live template picker at publish, export to a real 1080×1080 image on submit, SVG fallback for legacy empty ads.

**Architecture:** Shared `FlyerCanvas` (SVG) driven by template id + config + listing content. Publish exports the canvas to JPEG and uploads via `/api/upload-image`. Feed/modal use stored URL first; if missing, render the same SVG from `privateData` + title.

**Tech Stack:** React SVG, existing `/api/upload-image` + sharp pipeline, `privateData` on `adisos`, category tokens from `lib/categoria-theme.ts`, display helpers from `lib/adiso-display.ts`. Export via `html-to-image` (add dependency) or native SVG→canvas if simpler.

## Global Constraints

- Do not edit the plan/spec files unless asked.
- Photos remain optional; if user adds real photos, those win over flyer.
- Default template auto-selected when publishing with zero photos (no empty cards).
- Avoid AI-cliché palettes (generic purple gradients / cream+terracotta); use category accents.
- Commit only when the user asks.

## File map

| File | Responsibility |
|------|----------------|
| `lib/flyer/types.ts` | Types: template id, config, content |
| `lib/flyer/templates.ts` | 8 template defs + category defaults |
| `lib/flyer/layout.ts` | Truncate, price/location lines |
| `lib/flyer/export-client.ts` | DOM node → blob → upload helper |
| `components/flyer/FlyerCanvas.tsx` | SVG renderer (preview + export root) |
| `components/flyer/FlyerTemplatePicker.tsx` | Carousel + edit controls |
| `components/publish/PublishPhotoZone.tsx` | Show picker when `images.length === 0` |
| Publish studio / free-publish / chat skip | Call export before save |
| `components/AdisoCard.tsx` | Prefer image else FlyerCanvas fallback |
| `lib/seo/og-image.ts` | Prefer cover URL |
| `types/index.ts` | Optional typed privateData flyer keys (doc only if Record stays loose) |

---

### Task 1: Flyer types + templates + layout helpers

**Files:**
- Create `lib/flyer/types.ts`
- Create `lib/flyer/templates.ts`
- Create `lib/flyer/layout.ts`

- [ ] **Step 1:** Add types:

```ts
export type FlyerTemplateId =
  | 'bold-type' | 'diagonal-band' | 'minimal-cream' | 'marketplace-tag'
  | 'gradient-dusk' | 'split' | 'urgent' | 'negocio';

export type FlyerConfig = {
  primary?: string;
  secondary?: string;
  align?: 'left' | 'center';
  badge?: string;
  showPrice?: boolean;
  showLocation?: boolean;
  showCategory?: boolean;
  titleScale?: 's' | 'm' | 'l';
};

export type FlyerContent = {
  title: string;
  priceLabel?: string | null;
  locationLabel?: string | null;
  categoryLabel?: string | null;
  categoria?: string;
};
```

- [ ] **Step 2:** Define `FLYER_TEMPLATES` array with `id`, `label`, `defaultConfig` partials; `getDefaultFlyerConfig(categoria)` merging `getCategoriaThemeTokens`.
- [ ] **Step 3:** `layout.ts`: `truncateFlyerTitle(title, max)`, `buildFlyerContent(adisoOrDraft)` using `toDisplayTitle`, `formatPrecioDisplay`, `formatUbicacionCorta`, `getCategoriaLabel`.
- [ ] **Step 4:** Sanity-check imports compile (`npx tsc --noEmit` filtered to these files / project).

---

### Task 2: FlyerCanvas SVG renderer (8 layouts)

**Files:**
- Create `components/flyer/FlyerCanvas.tsx`

- [ ] **Step 1:** Props: `templateId`, `config`, `content`, `className?`, `exportId?` (for html-to-image root).
- [ ] **Step 2:** Implement all 8 visual variants in one component (switch on `templateId`) using SVG `viewBox="0 0 1080 1080"`.
- [ ] **Step 3:** Respect config: colors, align, badge, showPrice/Location/Category, titleScale font sizes.
- [ ] **Step 4:** Add `role="img"` and `aria-label={content.title}`.
- [ ] **Step 5:** Manual check: story-less — temporarily render in a page or Storybook-free console; or unit-smoke by importing in picker next task.

---

### Task 3: FlyerTemplatePicker UI

**Files:**
- Create `components/flyer/FlyerTemplatePicker.tsx`

- [ ] **Step 1:** Horizontal scroll of 8 mini `FlyerCanvas` thumbs; selecting sets `templateId`.
- [ ] **Step 2:** Large live preview of current selection.
- [ ] **Step 3:** Edit panel: color inputs (primary/secondary), align toggle, badge input, three checkboxes, title scale segmented control.
- [ ] **Step 4:** Props: `content`, `templateId`, `config`, `onChange({ templateId, config })`.
- [ ] **Step 5:** Visual pass on mobile width (~320px).

---

### Task 4: Export client (SVG → JPEG → upload)

**Files:**
- Create `lib/flyer/export-client.ts`
- Add dep `html-to-image` if needed (`npm i html-to-image`)

- [ ] **Step 1:** `exportFlyerToBlob(node: HTMLElement): Promise<Blob>` — pixelRatio for 1080 output.
- [ ] **Step 2:** `uploadFlyerBlob(blob, accessToken?): Promise<string | null>` — FormData to `/api/upload-image`.
- [ ] **Step 3:** `exportAndUploadFlyer(node): Promise<string | null>` combining both; swallow errors → `null`.
- [ ] **Step 4:** Verify upload returns public URL in local/dev.

---

### Task 5: Wire PublishPhotoZone + studio publish

**Files:**
- Modify `components/publish/PublishPhotoZone.tsx`
- Modify studio parent that owns draft images (find via grep `PublishPhotoZone`)
- Modify free/paid publish submit paths (`lib/publish/free-publish.ts`, studio submit)

- [ ] **Step 1:** When `images.length === 0`, render `FlyerTemplatePicker` below “Agregar foto”.
- [ ] **Step 2:** Lift flyer state (`templateId`, `config`) into publish draft / parent.
- [ ] **Step 3:** On submit with empty images: render offscreen/hidden export `FlyerCanvas` → `exportAndUploadFlyer` → set as first image URL; set `privateData.coverSource='template'`, `flyerTemplateId`, `flyerConfig`, `coverUrl`.
- [ ] **Step 4:** If export fails, still publish and keep flyer metadata for SVG fallback; toast soft warning.
- [ ] **Step 5:** If user adds a real photo, hide picker (or keep collapsed); do not overwrite user photos with flyer.

---

### Task 6: Chat publish “sin foto” path

**Files:**
- `components/publish/*Chat*` / `chat-steps` (grep “Continuar sin foto”)

- [ ] **Step 1:** When continuing without photo, auto-assign default template + export on final submit (same as studio).
- [ ] **Step 2:** Optional compact template row (3 thumbs) if UX allows without blocking chat flow.

---

### Task 7: AdisoCard + Modal fallback

**Files:**
- Modify `components/AdisoCard.tsx`
- Modify `components/ModalAdiso.tsx` (gallery empty branch)
- Optionally `PublishPreviewCard.tsx`, `SimilarAdisos.tsx`

- [ ] **Step 1:** Card: if no `imagenUrl`, render `FlyerCanvas` with content from adiso + `privateData.flyer*` (default template if missing).
- [ ] **Step 2:** Modal: if gallery empty, show FlyerCanvas as hero instead of skipping media.
- [ ] **Step 3:** Ensure overlays (time, location, badges) still work on top of flyer.

---

### Task 8: OG resolve + smoke test

**Files:**
- Modify `lib/seo/og-image.ts`

- [ ] **Step 1:** `resolveAdisoOgImage` — if `privateData.coverUrl` or first gallery URL, use it; else default.
- [ ] **Step 2:** Manual QA checklist:
  - Publish without photo → card shows flyer → Mensajes/share uses image URL when exported.
  - Switch templates + colors → preview updates.
  - Publish with real photo → no flyer forced.
  - Old ad without images → SVG fallback, not empty icon-only (or flyer replaces icon).
- [ ] **Step 3:** Mark plan todos complete; do not commit unless user asks.

---

## Testing notes

- Prefer local `npm run dev`: create free ad with title only, no photos.
- Confirm Storage URL in network tab after submit.
- Truncate stress: 120-char title still fits template.
- Category `empleos` vs `productos` default colors differ.

# Hybrid Flyer Covers for Adisos (Design Spec)

**Date:** 2026-07-31  
**Status:** Approved by product owner  
**Goal:** Ads without photos get professional, Canva-like flyer covers generated from listing text — live-editable templates at publish time, exported to a real image on submit.

---

## Problem

Ads without `imagenesUrls` render as a flat category color + icon. The feed looks empty; share/OG falls back to a generic site image. Photos are optional in publish, so many listings ship with no visual.

## Decision

**Hybrid (approved):**

1. **Live preview** in publish (React/SVG) — pick template + edit colors/text instantly.
2. **Rasterize on publish** (1080×1080 JPEG/PNG) → upload via existing `/api/upload-image` → store as first image.
3. **Legacy ads** without a stored cover: client-side SVG fallback using the same templates (no backfill batch in v1).

## User experience

### When
- Publish Studio / photo zone when `images.length === 0` (or user chooses “Usar portada generada”).
- Chat publish “Continuar sin foto” → offer template picker instead of bare skip when possible.

### Flow
1. User enters title (and optional price, location, category).
2. Sees **template carousel** (8 designs) with live preview filled from draft fields.
3. Optional **Edit** panel: primary/secondary color, title align, badge text, toggles (price / location / category), title scale S/M/L.
4. On publish: export canvas → upload → `imagenesUrls = [coverUrl]`; persist flyer metadata in `privateData`.
5. Card / modal / OG use the real image like any photo.

### Editable fields (v1)
| Field | Notes |
|-------|--------|
| `flyerTemplateId` | One of 8 templates |
| Primary / secondary color | Defaults from category theme |
| Title alignment | left \| center |
| Badge / overlay text | Optional short string (e.g. “¡Nuevo!”, “Se alquila”) |
| `showPrice` | boolean |
| `showLocation` | boolean |
| `showCategory` | boolean |
| `titleScale` | `s` \| `m` \| `l` |

Title/price/location/category **content** comes from the ad draft (single source of truth), not duplicated in flyer config.

## Templates (v1)

1. `bold-type` — large type on solid category color  
2. `diagonal-band` — diagonal color band + title overlay  
3. `minimal-cream` — light ground, price emphasis  
4. `marketplace-tag` — category pill + centered title  
5. `gradient-dusk` — dark gradient + white title  
6. `split` — half color / half type  
7. `urgent` — frame + price hero (when price exists; else bold title)  
8. `negocio` — clean professional card (services / jobs friendly)

Defaults: category accent from `lib/categoria-theme.ts`.

## Data model

```ts
// privateData extensions (no DB migration)
{
  coverSource: 'template' | 'user' | 'ai';
  flyerTemplateId: string;
  flyerConfig: {
    primary?: string;
    secondary?: string;
    align?: 'left' | 'center';
    badge?: string;
    showPrice?: boolean;
    showLocation?: boolean;
    showCategory?: boolean;
    titleScale?: 's' | 'm' | 'l';
  };
  coverUrl?: string; // same as imagenesUrls[0] when template-exported
}
```

If the user later adds a real photo, real photos take precedence; flyer metadata may remain for “regenerate cover” later (out of scope).

## Technical approach

### Shared render model
- `lib/flyer/types.ts` — `FlyerTemplateId`, `FlyerConfig`, `FlyerContent`
- `lib/flyer/templates.ts` — template metadata (id, label, default config)
- `lib/flyer/layout.ts` — pure layout helpers (truncate title, format price)
- `components/flyer/FlyerCanvas.tsx` — SVG (or DOM) renderer used for preview **and** export root

### Export
- Client: `html-to-image` / `modern-screenshot` on the preview node at 1080×1080, or draw via OffscreenCanvas.
- Prefer **no new heavy deps** if `canvas`/`html2canvas` already available; otherwise add `html-to-image` (small).
- Upload with existing `POST /api/upload-image` (`x-upload-type: adisos`).
- On failure: still allow publish with SVG-only fallback + toast; do not block publish forever.

### Feed / modal / OG
- `AdisoCard`: if no user image, prefer `imagenesUrls[0]` (after export) else `<FlyerCanvas>` fallback from title + `privateData.flyer*`.
- `ModalAdiso` / landing: treat cover as gallery[0].
- `resolveAdisoOgImage`: use cover URL before default OG; SVG fallback does not help OG — only exported URL.

### Publish integration
- Extend `PublishPhotoZone` (or sibling `FlyerCoverPicker`) when empty.
- Wire Studio + free/paid publish paths so export runs **before** insert when `images.length === 0` and a template is selected (auto-select default template if user never opened picker).
- Default: auto-apply `bold-type` (or category-mapped default) so “skip photo” still gets a cover.

## Out of scope (v1)

- Full Canva drag editor  
- Custom uploaded fonts  
- Batch re-export of historical ads to Storage  
- AI-generated illustrations  
- Video / stories covers  

## Success criteria

- New ad published without photos always has a non-empty visual (exported image or SVG fallback).  
- User can switch among 8 templates and see live updates.  
- Exported cover shares correctly (WhatsApp / OG when URL exists).  
- Cards look intentional, not “empty placeholder”.  
- Brand / category colors remain coherent unless user overrides.

## Open implementation notes

- Use `toDisplayTitle` / `formatPrecioDisplay` for text consistency.  
- Truncate long titles (~60–80 chars) with ellipsis in flyer layout.  
- Keep SVG accessible: `role="img"` + `aria-label` with title.  
- Avoid purple-on-white / cream-serif AI clichés; templates should feel marketplace-local and category-driven.

# Perfil Vivo — Sprint 0 Foundation Design (P01)

**Date:** 2026-08-08  
**Status:** Approved (program execution)  
**Depends on:** [Master Program](./2026-08-08-perfil-vivo-master-program-design.md)  
**Source:** `04`, `05`, `07`, `08`, Sprint 0 in `11`

## Goal

Ship the **blocking foundation**: TypeScript + Zod contracts from `07`, chrome/brand tokens and `derivarTema()` from `05`, an empty `RenderizadorModulos` that paints a profile from `ConfigModulo[]`, a parallel public route `/v/[slug]`, and CI gates for contrast + Lighthouse budgets from `08`.

DoD (from `11`): a test profile renders with **5 empty modules**, **LCP &lt; 1.2 s**, **0 contrast errors**, **CI green**.

## Architecture

```
packages/perfil-vivo/          # contract + theme + module renderer (no DB)
  src/types.ts                 # Arquetipo, TipoModulo, Negocio, ConfigModulo, …
  src/schemas.ts               # Zod validators
  src/tema/derivar-tema.ts     # OKLCH seed → --mk-* vars, AA enforced
  src/tema/chrome.css          # --sf-*, --tx-*, --bd-*, semantic, chicha
  src/modulos/contrato.ts      # ModuloMeta + empty-state policy
  src/modulos/registry.tsx     # tipo → component
  src/modulos/RenderizadorModulos.tsx
  src/modulos/shells/*         # empty shells for 5 Sprint-0 modules
  src/fixtures/demo-retail.ts
  src/bridge/from-business-profile.ts  # minimal adapter (optional fields only)
  scripts/verify-tema-contrast.mjs     # 20 seed colors

app/v/[slug]/page.tsx           # SSR profile using package + fixture|bridge
middleware.ts                  # /v/@slug → /v/slug rewrite
.lighthouserc.cjs              # budgets from 08 (fail on regression)
```

Existing `/@slug` / `/negocio/[slug]` **unchanged**. No cutover in Sprint 0.

## Module contract (Sprint 0 subset)

Five modules rendered for the demo (all empty / invitation policy for public = **hide content, show intentional empty chrome only where fixed**):

| tipo | Fixed? | Public empty behavior (Sprint 0) |
|------|--------|----------------------------------|
| `hero` | yes | Always render identity shell (name + meta placeholders from fixture) |
| `metricas` | yes | Show “En Buscadis desde …” when no verified metrics |
| `estado` | yes | Show closed/unknown strip from fixture hours if present; else muted “Horario no publicado” |
| `acciones` | yes | Primary + secondary slots as disabled/skeleton labels if no channels |
| `catalogo` | no | **Do not render** if `minDatos` not met (public rule from `04`) |

`RenderizadorModulos` filters by `visible`, plan, and `minDatos`, then sorts by `orden` within archetype defaults for `retail`.

## Theme

- Chrome tokens exactly as `05` §2 (light + `[data-theme="dark"]`).
- Brand via `derivarTema(semillaHex, modo)` returning `--mk-accion`, `--mk-accion-hover`, `--mk-sobre`, `--mk-suave`, `--mk-texto`, `--mk-borde`.
- Contrast: `wcagContrast(accion, sobre) >= 4.5`; adjust seed lightness if needed and keep AA.
- Verify script runs **20 seeds** (8 rubro suggestions from `05` + 12 edge cases: neon, near-black, near-white, pure red/green/blue, gray).

## Route & data

- `GET /v/demo` → fixture `demo-retail` (no DB required).
- `GET /v/[slug]` → if slug is `demo`, fixture; else attempt bridge from existing `business_profiles` by slug; if missing, `notFound()`.
- Middleware: `/v/@{slug}` rewrites to `/v/{slug}` (mirror of `/@` pattern).
- `robots`: `noindex` on `/v/*` until P03 cutover (avoid duplicate SEO).

## Performance / CI

| Gate | Threshold |
|------|-----------|
| LCP (lab, mobile) | &lt; 1.2 s on `/v/demo` |
| JS transfer (perfil) | &lt; 180 KB |
| CLS | &lt; 0.05 |
| Contrast script | 0 failures across 20 seeds |

Lighthouse CI config asserts these on `/v/demo`. Full 08 matrix can tighten in later sprints; Sprint 0 must not regress the demo.

## Typography (foundation only)

CSS variables for `--ff-display`, `--ff-ui`, `--ff-data` and type scale tokens from `05` §4. Sprint 0 may use system stacks as **fallback** if self-hosted font files are not yet wired; variables must exist so components never hardcode font families. Font file wiring can complete in P02 without API change.

## Out of scope (Sprint 0)

- Real WhatsApp handoff `/r/{token}`
- Catalog data, reviews, QR, editor
- Archetypes beyond Retail defaults for ordering
- Dark-mode user toggle UI (tokens present; fixture uses light)
- JSON-LD beyond a minimal stub optional for demo

## Acceptance checklist

- [ ] Package `@buscadis/perfil-vivo` importable from the Next app
- [ ] `/v/demo` paints 5-module stack (catalog omitted when empty)
- [ ] `derivarTema` + contrast script green for 20 seeds
- [ ] Lighthouse CI config present and runnable against `/v/demo`
- [ ] Canonical `/@slug` behavior unchanged
- [ ] `/v/*` is `noindex`

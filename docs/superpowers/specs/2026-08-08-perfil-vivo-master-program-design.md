# Perfil Vivo — Master Program Design

**Date:** 2026-08-08  
**Status:** Approved  
**Source of truth:** [`docs/tarjetadigitalbuscadis/`](../../tarjetadigitalbuscadis/)  
**Product name (internal):** Perfil Vivo · **Customer name:** perfil de negocio en Buscadis

## Problem

Buscadis already ships a multi-tenant business storefront (`/@slug` → `/negocio/[slug]`) with catalog, WhatsApp CTAs, QR, vCard, and a basic editor. Moodboard mockups and the current shell optimize for looking full, not for converting empty-day-1 businesses on mid-range phones over Cusco 4G.

The `tarjetadigitalbuscadis` package specifies a different product: a modular, indexable, living business profile with hard performance budgets, verified trust, measured handoffs, and six structural archetypes — not eight color variants of the same layout.

## Goals

1. Build the Perfil Vivo so every paragraph of the spec package is implemented effectively, not cosmetically.
2. Grow via word-of-mouth: the profile itself is the marketing surface.
3. Preserve the existing storefront until each wave’s DoD is met, then cut over safely.

## Non-goals (this program)

- Copying mockups as pixel-perfect UI when they contradict `01` D1–D14.
- Shipping SPA-only profiles, vanity metrics, QR inside the public profile, or dark-pattern social proof.
- Post-core backlog in sprint 0–7: reservations calendar, Yape checkout, loyalty, offline PWA, multi-branch, i18n, WA Business API.

## Locked decisions

| Decision | Choice |
|----------|--------|
| Approach | Hybrid: new foundation + module-by-module migration |
| Surface during migration | Parallel `/v/[slug]` (alias `/v/@slug` via rewrite) until Sprint 1 DoD |
| Cutover | Opt-in businesses move from `/v` → canonical `/@slug` (P03) |
| Spec authority | `docs/tarjetadigitalbuscadis/*`; mockups are moodboard only |
| Plan cadence | One design spec + one implementation plan per wave; no next wave without DoD |

## Program map (P00–P18)

| ID | Plan | Source docs | Demonstrable delivery |
|----|------|-------------|----------------------|
| P00 | Master Program | `00`–`02`, `11` | This blueprint + program rules |
| P01 | Sprint 0 — Foundation | `04`, `05`, `07`, `08` | `/v/demo` with 5 empty modules, theme engine, Lighthouse CI |
| P02 | Sprint 1 — Retail core | `04` A, `06` §1–4,§7,§12–15, handoff | Real Retail profile on `/v/{slug}`, `/r/{token}` |
| P03 | Canonical cutover | `08`, middleware | Flag + SEO-safe redirect for opted-in |
| P04 | Editor + onboarding | `06` §17, Sprint 2 | Owner builds profile &lt;15 min on phone |
| P05 | Hero + Metrics + Live state | `06` §1–3 | Distinctive live strip (median response) |
| P06 | Actions + sticky bar + handoff | `06` §4, `09` | One primary action; contextual WA |
| P07 | Catalog / Services + sheet | `06` §7, D13 | Peek carousel 148–164px; product sheet |
| P08 | Location + Hours + Payments | `06` §12–14 | Comparable info, no horizontal scroll |
| P09 | Channels + Share (QR in panel) | `06` §15–16, D10 | QR only in owner panel; vCard B2B menu |
| P10 | Reviews + post-contact capture | `06` §8 | Distribution, reply, one-question link |
| P11 | Promo + Gallery + Team + FAQ… | `06` §9–11,§18–22 | Support modules with correct empty behavior |
| P12 | Completeness + panel invites | `06` §17, `04` | Visitor never sees “aún no hay…” |
| P13 | Verification 3 levels | D11, `06` §1 | Public criteria + explain sheet |
| P14 | Analytics + panel + WA report | `09` | Owner understands first report alone |
| P15 | Six archetypes + six demos | `04` A–F | Visibly distinct profiles |
| P16 | Living content | `06` §5,§11 | Promo auto-expires; highlight → Deals |
| P17 | SEO/AEO + ADIS AI | `08`, `06` §23 | Indexable product; AI without inventing stock |
| P18 | GTM, pricing, viral loops | `10` | Packs + print kit + sales script |

## Program rules

1. Global DoD from `11`: four states, AA contrast, 44px targets, keyboard, `prefers-reduced-motion`, perf budget, analytics events, real devices, copy from `02`.
2. LCP &lt; 1.8s beats any feature (D9). Sprint 0 demo target: LCP &lt; 1.2s.
3. Max two components per implementation session (`06`).
4. Empty-state first (D3).
5. Adapt existing data; do not paint the old shell to fake compliance.
6. Each plan yields: `docs/superpowers/specs/*` + `docs/superpowers/plans/*` + checkable DoD.

## Reuse vs new

| Reuse / adapt | New Perfil Vivo contract |
|---------------|--------------------------|
| `business_profiles`, catalog APIs, `/mi-negocio` | Zod types from `07`, `Arquetipo`, `TipoModulo` |
| `@buscadis/storefront-kit` | `derivarTema()` OKLCH + chrome tokens from `05` |
| QR studio | Removed from public profile (D10) |
| Reviews API | Distribution, owner reply, capture flow |
| WhatsApp CTAs | `/r/{token}` measured handoff (D7) |
| `@buscadis/profile-engine` | `RenderizadorModulos` + stack from `04` |

## Success metrics (program-level)

- A new empty Retail profile looks intentional on day 1.
- First action visible without scroll on 375×667.
- Shared WA preview correct; handoffs measurable.
- Businesses pay monthly because something changes (live state, promos, analytics) — not because of a static link-in-bio.

## Next

**Done.** See [`2026-08-08-perfil-vivo-master-closeout.md`](./2026-08-08-perfil-vivo-master-closeout.md). Ops: activate `PERFIL_VIVO_HARD_CUTOVER=1` when cron reports ready.

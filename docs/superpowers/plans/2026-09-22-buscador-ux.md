# Buscador UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Una sola lupa, barra densa-limpia, flujos submit/historial/zero-results/analytics según `docs/superpowers/specs/2026-09-22-buscador-ux-design.md`.

**Architecture:** Chrome en `Buscador`; orquestación en `MarketplaceSearchComposer`; recientes en `lib/search/recent-searches.ts`; populares vía suggest API con `q` vacío; zero-results propaga `alternativeQueries` desde home.

**Tech Stack:** Next.js App Router, React client components, localStorage, `trackSearchEvent`.

## Global Constraints

- Home permanece `searchOnly`.
- Nunca lupa izquierda si hay CTA primario.
- Embudo no vive dentro de `Buscador` en home.
- Auto-submit en voz y visual tras resultado OK.
- Máx 8 recientes en localStorage.

---

### Task 1: Spec + plan docs

- [x] Spec en `docs/superpowers/specs/2026-09-22-buscador-ux-design.md`
- [x] Este plan

---

### Task 2: recent-searches + popular suggest

**Files:**
- Create: `lib/search/recent-searches.ts`
- Modify: `lib/search/suggest.ts`, `app/api/search/suggest/route.ts`

- [x] Implement get/add/remove/clear (max 8, key `buscadis:recent-searches`)
- [x] Allow empty `q` → return popular queries from `search_query_popularity`

---

### Task 3: Chrome Buscador

**Files:**
- Modify: `components/Buscador.tsx`

- [x] No `FaSearch` when `showPrimaryAction`
- [x] Clear (X) when value non-empty
- [x] Stop rendering filter funnel inside bar (keep props for API compat but no UI, or remove usage)
- [x] Props: `onModalityQuery` for voice/visual auto-submit handoff
- [x] A11y: aria-expanded/controls on field when provided

---

### Task 4: Composer + dropdown flows

**Files:**
- Modify: `components/search/MarketplaceSearchComposer.tsx`
- Modify: `components/search/SearchSuggestionsDropdown.tsx`
- Modify: `components/search/useSearchSuggestions.ts`

- [x] Query select → submit + analytics
- [x] Voice/visual → fill + submit
- [x] Empty focus → recent + popular
- [x] Impression analytics
- [x] Add recent on successful submit

---

### Task 5: Home toolbar filter + zero results

**Files:**
- Modify: `components/HomePageClient.tsx`
- Modify: `components/BrowseEmptyState.tsx`

- [x] Filter toggle button next to count pill
- [x] Remove showFilterToggle from composer
- [x] Capture `alternativeQueries`; pass to empty state; track zero_results
- [x] Chips to re-run alternative queries

---

### Task 6: Design-system note

**Files:**
- Modify: `docs/design-system-improve-renew/08-COMPONENTES-DE-DOMINIO.md` § SearchComposer

- [x] Update anatomy to single lupa + filters outside + empty-focus states

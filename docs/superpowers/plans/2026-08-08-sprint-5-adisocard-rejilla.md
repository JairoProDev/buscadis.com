# Sprint 5 — AdisoCard + rejilla Implementation Plan

> **For agentic workers:** Implement task-by-task. Checkboxes track progress.

**Goal:** Rebuild `AdisoCard` with fixed anatomy (`grid` | `list` | `feed`), Tailwind rejilla per doc 09, remove styled-jsx from listing chrome, restore scroll/filters on back.

**Architecture:** Domain card stays in `components/`; grid layout via Tailwind utility classes (no styled-jsx). Filters already URL-backed on home; scroll Y + `visibleCount` + `vista` via `sessionStorage`.

**Tech Stack:** Next.js client components, Tailwind, `@buscadis/ui` Badge, existing `lib/adiso-display` + `lib/social-proof`.

## Global Constraints

- Tokens via `--bs-*` / legacy aliases; no new hex in components
- Single prop `vista`, no boolean soup
- Price never empty → "A convenir" in muted
- Max one status badge; category accent = 3px bar
- Title always 2-line reserved height

---

### Task 1: Grilla Tailwind + NavbarMobile without styled-jsx

- [x] `GrillaAdisos`: columns 2/3/4/5 + gaps; `withPanel` → 4 cols at xl
- [x] `NavbarMobile`: drop `<style jsx>`; Tailwind active scale on CTA

### Task 2: AdisoCard anatomy rebuild

- [x] Media 4:3 (list 96px); accent bar; badge; body title/price/meta/signal
- [x] States: paused opacity, destacado border `sol-400`

### Task 3: Scroll restore

- [x] `lib/listing-scroll-restore.ts` + wire `HomePageClient`

### Task 4: Docs + commit

- [x] Roadmap / doc 12 → S5 ✅

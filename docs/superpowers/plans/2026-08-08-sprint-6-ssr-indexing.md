# Sprint 6 — SSR + indexación Implementation Plan

> **For agentic workers:** Checkboxes track progress.

**Goal:** Titles/prices (and JSON-LD) in initial HTML on home, category, adiso detail, and business profile; crawlable `<a>` pagination; curl smoke.

**Architecture:** Keep SPA shells; add Server Components that fetch data and emit crawlable HTML + JSON-LD beside/around clients. No full HomePageClient rewrite.

**Tech Stack:** Next.js App Router RSC, existing supabase/business fetchers, schema.org JSON-LD.

## Global Constraints

- Prefer `/a/{id}/{slug}` canonical URLs via `getAdisoUrl`
- Smoke fails if body is only loading copy
- Do not break client modal deep-links on `/`

---

### Task 1: JSON-LD + crawlable list primitives
### Task 2: Wire `/a`, `/`, `/categoria`, `/negocio`
### Task 3: Smoke script + docs

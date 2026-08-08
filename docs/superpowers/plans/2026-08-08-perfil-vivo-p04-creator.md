# P04 Experiencia creador — Implementation Plan

> **For agentic workers:** Implement task-by-task. Steps use checkbox syntax.

**Goal:** 6-step mobile-first onboarding → `/v` preview + WA self-send + §17 one-next-task meter.

**Architecture:** New `CreadorOnboarding` wizard on `/mi-negocio/crear`; early draft via `createBusinessViaAPI`; patches via `saveBusinessViaAPI`; completeness via `completitud-vivo` scored for Perfil Vivo modules; adiso door maps listing → profile; catalog step uses photo upload + price confirm.

**Tech Stack:** Next.js App Router, existing business/catalog APIs, `@buscadis/perfil-vivo` preview URL.

## Global Constraints

- Copy: Spanish Peru, zero jargon (`16` §2)
- Touch targets ≥56px in creator; text ≥17px
- One question per screen; always “hacerlo después”
- Preview emotional destination = `/v/{slug}`
- Prefer API routes over raw Supabase inserts

---

## File map

| File | Role |
|------|------|
| `lib/business/completitud-vivo.ts` | Score + single next task (benefit copy) |
| `components/business/creator/CreadorOnboarding.tsx` | 6-step shell |
| `components/business/creator/Pasos/*.tsx` | Step UIs |
| `components/business/creator/CompletitudMeter.tsx` | §17 UI |
| `lib/business/adiso-a-perfil.ts` | Prefill from adiso |
| `app/api/business/from-adiso/route.ts` | Conversion API |
| `app/mi-negocio/crear/page.tsx` | Mount wizard |
| `components/business/editor/EditorProgressWidget.tsx` | Wire §17 |

---

### Task 1: Completitud vivo + meter

- [x] Add `completitud-vivo.ts` with fields that affect `/v` and `siguienteTarea()` benefit copy
- [x] Add `CompletitudMeter` (bar + % + one CTA)
- [x] Wire into `EditorProgressWidget` / editor hubs header

### Task 2: Wizard shell + steps 1–4

- [x] `CreadorOnboarding` state machine + autosave
- [x] Steps: rubro, identidad, ubicación, horario
- [x] Replace `/mi-negocio/crear` primary UX

### Task 3: Step 5 catalog photos + prices

- [x] Multi-photo pick → upload → draft products → price keypad
- [x] Persist via catalog API

### Task 4: Step 6 + WA + puerta aviso

- [x] Preview link `/v`, publish soft, `wa.me` self-send
- [x] `from-adiso` API + door UI
- [x] Track onboarding events

### Task 5: Smoke

- [x] Manual path: crear → steps → `/v` → WA URL
- [x] Completitud meter visible in editor

# Perfil Vivo Sprint 1 Retail Nucleus Implementation Plan

> **For agentic workers:** Execute task-by-task. Checkboxes track progress.

**Goal:** Full Retail Perfil Vivo on `/v/demo` with measured `/r/{token}` handoffs.

**Architecture:** Extend `@buscadis/perfil-vivo` with product/horario/estado types, rich fixture, filled modules, HMAC handoff tokens; add `app/r/[token]/route.ts`.

**Tech Stack:** Next.js App Router, TypeScript, Zod, Web Crypto / Node crypto HMAC.

**Spec:** [`docs/superpowers/specs/2026-08-08-perfil-vivo-sprint-1-retail-design.md`](../specs/2026-08-08-perfil-vivo-sprint-1-retail-design.md)

## Global Constraints

- No Google Maps iframe on `/v`
- All external CTAs via `/r/{token}`
- Price always visible (D13)
- Card product width ≥156px with peek
- Copy per `02` (Spanish Peru)
- `/v/*` remains noindex until P03

---

### Task 1: Types + payload + horario/estado helpers

**Files:** extend `types.ts`, `schemas.ts`; create `estado/calcular-estado.ts`, `data/payload.ts`

- Producto, Horario, EstadoVivo, MetricasVerificadas, MetodoPago, PerfilPayload
- `calcularEstadoVivo(horario, now)` for America/Lima

### Task 2: Handoff token + `/r/[token]` route

**Files:** `packages/perfil-vivo/src/handoff/*`, `app/r/[token]/route.ts`

- `crearTokenHandoff`, `verificarTokenHandoff`, `destinoDesdeToken`
- Route: verify → log → 302

### Task 3: Filled modules + registry + PerfilVivoRoot

Hero, Metricas, Estado, Acciones, Catalogo+Sheet, UbicacionHorario, Pago, Canales

### Task 4: Rich demo fixture + page JSON-LD + bridge products stub

Upgrade `demo-retail` with 4 products, hours, payments, networks

### Task 5: Verify smoke

`/v/demo` HTML contains prices + JSON-LD; `/r/...` redirects; empty catalog still hidden

# Perfil Vivo Sprint 0 Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `@buscadis/perfil-vivo` (types, Zod, `derivarTema`, chrome tokens, `RenderizadorModulos`) and `/v/demo` with empty Retail shells, contrast verification, and Lighthouse CI — without changing `/@slug`.

**Architecture:** New workspace package holds the Perfil Vivo contract and renderer. Next.js route `app/v/[slug]` consumes the package with a Retail fixture. Middleware rewrites `/v/@slug` → `/v/slug`. Existing storefront stays untouched.

**Tech Stack:** Next.js 15 App Router, TypeScript, Zod, culori, wcag-contrast, npm workspaces.

**Spec:** [`docs/superpowers/specs/2026-08-08-perfil-vivo-sprint-0-foundation-design.md`](../specs/2026-08-08-perfil-vivo-sprint-0-foundation-design.md)

## Global Constraints

- LCP on `/v/demo` target &lt; 1.2 s; never ship critical JS libs on this route
- Chrome colors only from `05`; brand only via `derivarTema`
- Public empty modules: hide non-fixed modules without `minDatos`
- `/v/*` must be `noindex`
- Do not modify `/negocio/[slug]` behavior
- Copy in Spanish (Peru), short verbs per `02`

---

### Task 1: Package scaffold + core types + Zod

**Files:**
- Create: `packages/perfil-vivo/package.json`
- Create: `packages/perfil-vivo/src/types.ts`
- Create: `packages/perfil-vivo/src/schemas.ts`
- Create: `packages/perfil-vivo/src/index.ts`
- Create: `packages/perfil-vivo/scripts/verify-types.mjs` (smoke import)
- Modify: `package.json` (root dependency `@buscadis/perfil-vivo`)
- Modify: `tsconfig.json` (paths)

**Interfaces:**
- Produces: `Arquetipo`, `Plan`, `TipoModulo`, `ConfigModulo`, `Negocio` (Sprint 0 subset), `parseNegocio()`, `parseConfigModulo()`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "@buscadis/perfil-vivo",
  "version": "0.1.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./chrome.css": "./src/tema/chrome.css"
  },
  "scripts": {
    "verify:tema": "node ./scripts/verify-tema-contrast.mjs",
    "verify:types": "node ./scripts/verify-types.mjs"
  },
  "dependencies": {
    "culori": "^4.0.2",
    "wcag-contrast": "^3.0.0",
    "zod": "^3.24.1"
  },
  "peerDependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  },
  "devDependencies": {
    "typescript": "^5.9.3"
  }
}
```

- [ ] **Step 2: Write types.ts (Sprint 0 subset from 07)**

```ts
export type Arquetipo = 'retail' | 'cita' | 'comida' | 'profesional' | 'alto_ticket' | 'local';
export type Plan = 'free' | 'pro' | 'max';
export type NivelVerificacion = 0 | 1 | 2 | 3;
export type TipoModulo =
  | 'hero' | 'metricas' | 'estado' | 'acciones'
  | 'novedades' | 'categorias' | 'catalogo' | 'servicios' | 'promocion' | 'resenas'
  | 'galeria' | 'publicaciones' | 'ubicacion' | 'horario' | 'pago' | 'canales'
  | 'nosotros' | 'faq' | 'equipo' | 'certificaciones' | 'documentos' | 'ia';

export interface ConfigModulo {
  tipo: TipoModulo;
  visible: boolean;
  orden: number;
  titulo?: string;
}

export interface Negocio {
  id: string;
  slug: string;
  nombre: string;
  eslogan?: string;
  categoria: { id: string; nombre: string };
  arquetipo: Arquetipo;
  plan: Plan;
  estado: 'activo' | 'pausado' | 'suspendido' | 'vencido';
  identidad: {
    logoUrl?: string;
    portadaUrl?: string;
    colorSemilla: string;
    tema: 'claro' | 'oscuro' | 'auto';
    formaCards: 'suave' | 'marcado';
  };
  contacto: {
    whatsapp?: string;
    telefono?: string;
    email?: string;
    web?: string;
    redes: { tipo: string; url: string; activa: boolean }[];
  };
  ubicacion?: {
    direccion: string;
    distrito: string;
    provincia: string;
    departamento: string;
    lat: number;
    lng: number;
    mostrarDireccionExacta: boolean;
  };
  verificacion: { nivel: NivelVerificacion; fecha?: string };
  metricasDeclaradas: { icono: string; valor: string; etiqueta: string }[];
  modulos: ConfigModulo[];
  creadoEn: string;
  actualizadoEn: string;
}
```

- [ ] **Step 3: Write Zod schemas mirroring those types; export parse helpers**

- [ ] **Step 4: Wire root package.json + tsconfig paths; run `npm install` in workspace**

- [ ] **Step 5: Smoke: `npm run verify:types --workspace=@buscadis/perfil-vivo`**

---

### Task 2: `derivarTema` + chrome CSS + contrast script

**Files:**
- Create: `packages/perfil-vivo/src/tema/derivar-tema.ts`
- Create: `packages/perfil-vivo/src/tema/chrome.css`
- Create: `packages/perfil-vivo/src/tema/apply-tema.ts`
- Create: `packages/perfil-vivo/scripts/verify-tema-contrast.mjs`
- Modify: `packages/perfil-vivo/src/index.ts`

**Interfaces:**
- Consumes: culori, wcag-contrast
- Produces: `derivarTema(semillaHex, modo) => Record&lt;string, string&gt;`, `temaToStyle(vars)`, chrome CSS file

- [ ] **Step 1: Implement `derivarTema` exactly per `05` §3** (OKLCH clamp, AA on-action text)

- [ ] **Step 2: Add chrome.css with light + `[data-theme="dark"]` tokens from `05` §2 and type/spacing tokens from §4–5**

- [ ] **Step 3: Write verify script with 20 seeds; exit 1 if any accion/sobreAccion contrast &lt; 4.5**

Seeds must include: `#1F4FD8`, `#C7401A`, `#7A2FBF`, `#0B7C8C`, `#1B3A6B`, `#1E7A3E`, `#0E2A47`, `#B0186B`, `#00FF00`, `#FF0000`, `#0000FF`, `#000000`, `#FFFFFF`, `#111111`, `#EEEEEE`, `#FF00FF`, `#808080`, `#FFA500`, `#00CED1`, `#8B4513`.

- [ ] **Step 4: Run `npm run verify:tema --workspace=@buscadis/perfil-vivo` — expect exit 0**

---

### Task 3: Module registry + RenderizadorModulos + empty shells

**Files:**
- Create: `packages/perfil-vivo/src/modulos/contrato.ts`
- Create: `packages/perfil-vivo/src/modulos/orden-arquetipo.ts`
- Create: `packages/perfil-vivo/src/modulos/shells/HeroShell.tsx`
- Create: `packages/perfil-vivo/src/modulos/shells/MetricasShell.tsx`
- Create: `packages/perfil-vivo/src/modulos/shells/EstadoShell.tsx`
- Create: `packages/perfil-vivo/src/modulos/shells/AccionesShell.tsx`
- Create: `packages/perfil-vivo/src/modulos/shells/CatalogoShell.tsx`
- Create: `packages/perfil-vivo/src/modulos/registry.tsx`
- Create: `packages/perfil-vivo/src/modulos/RenderizadorModulos.tsx`
- Create: `packages/perfil-vivo/src/modulos/PerfilVivoRoot.tsx`
- Modify: `packages/perfil-vivo/src/index.ts`

**Interfaces:**
- Consumes: `Negocio`, `ConfigModulo`, `derivarTema`
- Produces: `RenderizadorModulos({ negocio, datosModulo? })`, `PerfilVivoRoot({ negocio })`

- [ ] **Step 1: Define `MODULO_META` with `minDatos`, `fijo`, `planMin` for at least the five Sprint 0 tipos**

- [ ] **Step 2: Retail default order from `04` A; `resolverModulos(negocio)` filters hidden / under-min / plan**

For Sprint 0 fixture with zero products: `catalogo` must be filtered out. Fixed modules always included when `visible`.

- [ ] **Step 3: Empty shells — intentional, not “Aún no hay…” for visitors**

- Hero: portada placeholder using `--mk-suave` + name + `Categoría · Distrito`
- Metricas: `En Buscadis desde {mes año}`
- Estado: muted live strip
- Acciones: primary button labeled for Retail (“Escribir por WhatsApp”) disabled or inert if no number; still layout-complete for LCP structure
- Catalogo: only used when minDatos met — shell for future; not shown on demo empty

- [ ] **Step 4: `RenderizadorModulos` maps resolved list → registry components inside a single-column stack with 32px gap**

- [ ] **Step 5: `PerfilVivoRoot` applies chrome class, `data-theme`, inline style from `derivarTema`, sticky action bar placeholder (empty height 64px) so first-screen geometry matches D2

---

### Task 4: Demo fixture + optional bridge

**Files:**
- Create: `packages/perfil-vivo/src/fixtures/demo-retail.ts`
- Create: `packages/perfil-vivo/src/bridge/from-business-profile.ts`
- Modify: `packages/perfil-vivo/src/index.ts`

**Interfaces:**
- Produces: `DEMO_RETAIL_NEGOCIO: Negocio`, `negocioFromBusinessProfile(row: unknown): Negocio | null`

- [ ] **Step 1: Fixture slug `demo`, nombre `Ferretería Demo Quival`, arquetipo `retail`, color `#1F4FD8`, Wanchaq/Cusco, modulos config for five tipos, `creadoEn` fixed ISO**

- [ ] **Step 2: Bridge maps known `BusinessProfile` fields when present (`slug`, `name`, `theme`/`brand_color`, location); returns null if insufficient — no throw**

---

### Task 5: Next.js route `/v/[slug]` + middleware alias

**Files:**
- Create: `app/v/[slug]/page.tsx`
- Create: `app/v/[slug]/layout.tsx`
- Create: `app/v/layout.tsx` (optional shared)
- Modify: `middleware.ts` — add `/v/@slug` rewrite
- Modify: root styles import path if needed for chrome.css

**Interfaces:**
- Consumes: `PerfilVivoRoot`, `DEMO_RETAIL_NEGOCIO`, `negocioFromBusinessProfile`

- [ ] **Step 1: `layout.tsx` imports `@buscadis/perfil-vivo/chrome.css`; metadata robots noindex**

- [ ] **Step 2: `page.tsx` — if slug===`demo` use fixture; else try load business profile via existing lib and bridge; else `notFound()`**

Use existing server data helpers if available (`getBusinessBySlug` or equivalent). If none found quickly, Sprint 0 may only support `demo` + notFound for others — document in page comment.

- [ ] **Step 3: Middleware rewrite `/v/@X` → `/v/X`**

- [ ] **Step 4: Manual check: `curl -sI localhost:3000/v/demo` returns 200; `/v/@demo` rewrites; `/@` still works

---

### Task 6: Lighthouse CI + npm scripts + verify smoke

**Files:**
- Create: `.lighthouserc.cjs`
- Modify: root `package.json` scripts: `verify:perfil-vivo`, `lhci:perfil-vivo`

- [ ] **Step 1: Add `.lighthouserc.cjs` asserting categories/performance budgets for URL `/v/demo` (LCP &lt; 1200ms via assertion)**

Example assertions:
```js
module.exports = {
  ci: {
    collect: { url: ['http://127.0.0.1:3000/v/demo'], numberOfRuns: 1 },
    assert: {
      assertions: {
        'largest-contentful-paint': ['error', { maxNumericValue: 1200 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.05 }],
        'total-byte-weight': ['warn', { maxNumericValue: 600000 }],
      },
    },
  },
};
```

- [ ] **Step 2: Script `verify:perfil-vivo` runs tema + types verify**

- [ ] **Step 3: Run verifies; fix until green. LHCI may be documented as `npx @lhci/cli autorun` when server is up — if LHCI cannot run in this environment, keep config + a note in plan DoD and ensure page is SSR-light.**

---

## DoD checklist (Sprint 0)

- [ ] `/v/demo` renders Perfil Vivo foundation with fixed empty shells
- [ ] Catalog module absent when empty
- [ ] `npm run verify:tema --workspace=@buscadis/perfil-vivo` exits 0
- [ ] `/v/*` noindex; `/@slug` unchanged
- [ ] `.lighthouserc.cjs` present
- [ ] Specs linked from this plan

## Spec coverage

| Spec requirement | Task |
|------------------|------|
| Types + Zod from 07 | T1 |
| derivarTema + chrome tokens 05 | T2 |
| RenderizadorModulos + 5 modules | T3 |
| Fixture + bridge | T4 |
| `/v` route + `/v/@` rewrite | T5 |
| Lighthouse CI + contrast CI | T2, T6 |
| noindex / no cutover | T5 |

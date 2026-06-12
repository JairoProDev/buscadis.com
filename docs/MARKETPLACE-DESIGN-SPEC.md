# Buscadis Marketplace — Design Spec (Figma-style)

> **Versión:** 1.0 · **Fecha:** 2026-05-26 · **Estado:** Draft para implementación  
> **Alcance:** Home / Buscar · Cards · Toolbar · Sidebar · Mobile  
> **Implementación actual:** `AdisoCard.tsx`, `GrillaAdisos.tsx`, `app/page.tsx`, `Header.tsx`, `ModalAdiso.tsx`

---

## ¿Qué es esto?

Un **design spec estilo Figma** es la documentación que normalmente vive junto a los frames en Figma (o en Dev Mode): tokens, medidas, estados, anatomía de componentes y reglas de comportamiento. No reemplaza Figma para exploración visual, pero **sí es la fuente de verdad para desarrollo** cuando quieres que diseño y código hablen el mismo idioma.

Este documento define el **estado objetivo (Target)** y marca **gaps vs. hoy (Current)** para priorizar cambios.

---

## 1. Principios de diseño

| # | Principio | Significado práctico |
|---|-----------|----------------------|
| 1 | **Contenido primero** | La foto/título/precio del anuncio dominan; chrome (categorías, stats) se compacta al scroll. |
| 2 | **Escaneable en 2 s** | En móvil el usuario debe entender qué es, dónde y cuánto cuesta sin abrir detalle. |
| 3 | **Una señal social por card** | Máximo un badge (vistas *o* interesados *o* nuevo), no tres a la vez. |
| 4 | **Fotos > iconos** | El placeholder de categoría es fallback discreto, no protagonista. |
| 5 | **Confianza honesta** | Métricas reales o ninguna; no inflar vistas históricas. |
| 6 | **Touch-first** | Targets ≥ 44×44 px; acciones críticas siempre visibles en móvil. |

---

## 2. Design tokens

### 2.1 Color — Marca (sin cambios)

| Token | Light | Dark | Uso |
|-------|-------|------|-----|
| `--brand-blue` | `#38bdf8` | `#38bdf8` | CTA, links, estado activo |
| `--brand-yellow` | `#fbbf24` | `#fbbf24` | Destacados, alertas suaves |
| `--text-primary` | `#0f172a` | `#f8fafc` | Títulos, cuerpo principal |
| `--text-secondary` | `#475569` | `#94a3b8` | Metadata, descripciones |
| `--text-tertiary` | `#94a3b8` | `#64748b` | Hints, placeholders |
| `--bg-primary` | `#ffffff` | `#0f172a` | Superficies cards, header |
| `--bg-secondary` | `#fdfdfd` | `#0b1120` | Fondo página |
| `--border-color` | `rgba(0,0,0,0.06)` | `rgba(255,255,255,0.08)` | Bordes cards |

### 2.2 Color — Categoría (nuevo sistema)

**Regla:** el color de categoría vive en un **acento de 3px** (borde izquierdo o chip), **no** en fondo de media completo.

| Categoría | Acento | Fondo placeholder (light) | Fondo placeholder (dark) |
|-----------|--------|----------------------------|--------------------------|
| empleos | `#64748b` | `#f8fafc` | `#1e293b` |
| inmuebles | `#059669` | `#ecfdf5` | `#064e3b` |
| vehiculos | `#0284c7` | `#f0f9ff` | `#0c4a6e` |
| servicios | `#d97706` | `#fffbeb` | `#78350f` |
| productos | `#e11d48` | `#fff1f2` | `#881337` |
| eventos | `#7c3aed` | `#f5f3ff` | `#4c1d95` |
| negocios | `#475569` | `#f8fafc` | `#1e293b` |
| comunidad | `#0891b2` | `#ecfeff` | `#164e63` |

### 2.3 Tipografía

| Rol | Size (mobile) | Size (desktop) | Weight | Line-height | Transform |
|-----|---------------|----------------|--------|-------------|-----------|
| **Card title** | 14px | 15px | 600 | 1.25 | none (sentence case) |
| **Card meta** | 12px | 12px | 500 | 1.3 | none |
| **Card price** | 14px | 15px | 700 | 1.2 | none |
| **Description** | 13px | 13px | 400 | 1.45 | none · max 2 lines |
| **Badge** | 11px | 11px | 600 | 1 | none |
| **Toolbar count** | 14px | 14px | 600 | 1 | none |
| **Section label** | 11px | 11px | 600 | 1.2 | uppercase · tracking 0.04em |

**Font stack:** `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif` (ya en `globals.css`).

### 2.4 Espaciado (escala 4px)

| Token | Valor | Uso típico |
|-------|-------|------------|
| `space-1` | 4px | Gap icono-texto |
| `space-2` | 8px | Padding interno chips |
| `space-3` | 12px | Padding card content |
| `space-4` | 16px | Gap grid móvil |
| `space-5` | 20px | Padding main horizontal |
| `space-6` | 24px | Gap grid desktop |
| `space-8` | 32px | Separación secciones |

### 2.5 Radio y sombra

| Elemento | Radius | Shadow (light) |
|----------|--------|----------------|
| Card | 16px | `0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)` |
| Card hover | 16px | `0 8px 24px rgba(0,0,0,0.08)` |
| Card selected | 16px | `ring 2px #38bdf8` · sin scale |
| Pill / chip | 999px | none |
| Button icon | 12px | none |
| Search bar | 999px | `0 4px 20px rgba(0,0,0,0.06)` |
| Sidebar panel | 24px 0 0 24px | `-8px 0 32px rgba(0,0,0,0.08)` |

### 2.6 Breakpoints

| Nombre | Min-width | Columnas grid | Sidebar |
|--------|-----------|---------------|---------|
| `xs` | 0 | 2 | overlay / sheet |
| `sm` | 480px | 2 | overlay |
| `md` | 768px | auto-fill min 200px | fixed 420px |
| `lg` | 1024px | auto-fill min 220px | fixed 420px |
| `xl` | 1280px | auto-fill min 240px | fixed 420px |

---

## 3. Layout — Home / Buscar

### 3.1 Anatomía (desktop)

```
┌─────────────────────────────────────────────────────────────┬──────────┐
│ HEADER 72px — logo · ubicación · nav · utilidades           │          │
├─────────────────────────────────────────────────────────────┤          │
│ CATEGORY BAR 88px — scroll horizontal · 8 categorías        │ SIDEBAR  │
├─────────────────────────────────────────────────────────────┤ 420px    │
│ MAIN (max-width: calc(100% - sidebar))                      │ fixed    │
│   ┌─────────────────────────────────────────────────────┐   │          │
│   │ SEARCH 56px                                         │   │ Detalle  │
│   └─────────────────────────────────────────────────────┘   │ adiso    │
│   TOOLBAR 48px — count · pulse · sort · view toggle       │          │
│   GRID gap 24px                                           │          │
│   [Card] [Card] [Card] [Card]                             │          │
│   ... infinite scroll sentinel                            │          │
└─────────────────────────────────────────────────────────────┴──────────┘
```

### 3.2 Anatomía (mobile)

```
┌─────────────────────────┐
│ HEADER 72px (compact)   │
├─────────────────────────┤
│ CATEGORIES ~72px        │
├─────────────────────────┤
│ SEARCH 52px             │
├─────────────────────────┤
│ TOOLBAR ~44px (compact) │
├─────────────────────────┤
│ GRID 2 cols · gap 12px  │
│ [Card] [Card]           │
│ [Card] [Card]           │
├─────────────────────────┤
│ BOTTOM NAV 64px + safe  │
└─────────────────────────┘
```

**Target:** al scroll > 80px, category bar + search colapsan a barra sticky de 56px (solo búsqueda + chip ubicación).

---

## 4. Componente: AdisoCard

**Archivo:** `components/AdisoCard.tsx`  
**Props:** `adiso`, `onClick`, `estaSeleccionado`, `isDesktop`, `vista`

### 4.1 Anatomía (target — paquete pequeño+)

```
┌──────────────────────────────────────┐
│ ▌ 3px accent (categoría)             │
│ ┌──────────────────────────────────┐ │
│ │  MEDIA  aspect-ratio 4:3         │ │
│ │  · foto cover O placeholder 32px │ │
│ │  ┌ chip ubicación (bg black/50)  │ │
│ │  └ precio (si existe)      ♥  ···│ │
│ └──────────────────────────────────┘ │
│  PADDING 12px                        │
│  Título (2 líneas max)               │
│  Descripción (1 línea móvil / 2 d.)  │
│  ─────────────────────────────────   │
│  128 vistas · hace 2 d               │
└──────────────────────────────────────┘
```

### 4.2 Variantes por paquete

| Paquete | Grid span (desktop) | Media | Imágenes max | Notas UI |
|---------|---------------------|-------|--------------|----------|
| miniatura | 1×1 | Sí — franja 72px + icono 24px | 0 | **Current:** sin media. **Target:** tile mínimo visual. |
| pequeño | 1×2 | 4:3 | 1 | Default recomendado para productos. |
| mediano | 2×2 | 4:3 | 3 | Indicador `+2 fotos` si hay más. |
| grande | 2×4 | 16:9 | 5 | Descripción visible en card. |
| gigante | 4×4 | 16:9 | 10 | Solo destacados / campañas. |

### 4.3 Estados

| Estado | Visual | Comportamiento |
|--------|--------|----------------|
| **Default** | shadow-sm, border subtle | Click → abrir sidebar / sheet |
| **Hover** (desktop) | shadow-md, translateY -2px | Sin scale |
| **Selected** | ring 2px brand-blue | Scroll into view solo si fuera de viewport |
| **Focus** | outline 2px offset 2px | Keyboard Enter/Space |
| **Loading image** | skeleton pulse en media | blur placeholder opcional |
| **No image** | fondo `bg-secondary`, icono 32px centrado, opacity 0.5 | Nunca icono 64px |
| **Favorite** | ♥ filled red | toggle local + sync API |
| **Hidden** | no render | “No me interesa” |

### 4.4 Reglas de contenido

- **Título:** `line-clamp-2`, sin `uppercase`, sin truncar con `..` en UI (sanitizar en datos).
- **Ubicación:** formato corto `Distrito, Depto` · pill `bg-black/55 text-white text-xs px-2 py-0.5 rounded-full`.
- **Precio:** si no hay precio → no mostrar “Contactar” en card; mostrar chip categoría o nada.
- **WhatsApp en descripción:** strip regex al render si contacto vacío.
- **Badges:** máximo 1 visible. Prioridad: Destacado > Interesados > Vistas.

### 4.5 Gaps vs. código actual

| Issue | Current | Target |
|-------|---------|--------|
| Título | `uppercase`, 11px miniatura | sentence case, 14px min |
| Sin foto | Icono 64px | Icono 32px + patrón sutil |
| Miniatura | Sin bloque media | Franja 72px con acento |
| Ubicación | `text-white/90` sobre pastel | Pill oscuro semitransparente |
| Hover | `scale-[1.02]` + sombra grande | translateY -2px solo |
| Acciones móvil | opacity 0 hasta long-press | ♥ visible siempre; ⋯ en long-press |
| Descripción móvil | oculta en grid | 1 línea `line-clamp-1` |

---

## 5. Componente: GrillaAdisos

**Archivo:** `components/GrillaAdisos.tsx`

| Propiedad | Current | Target |
|-----------|---------|--------|
| Mobile columns | 2 fijas | 2 fijas |
| Desktop | `minmax(225px, 1fr)` | `minmax(200px, 1fr)` con sidebar; `minmax(240px)` sin sidebar |
| Gap | 12px / 20px | 12px / 24px |
| dense flow | sí | **evaluar quitar** para ritmo uniforme en browse |
| Infinite scroll | sentinel + spinner | + 4 skeleton cards |
| Vista list | thumbnail 120px | thumbnail 96px cuadrado, ratio fijo |
| Vista feed | max 600px | max 480px móvil, 560px desktop |

---

## 6. Componente: Toolbar (page)

**Archivo:** `app/page.tsx` (~línea 1021)

### 6.1 Anatomía target

```
[ (N) adisos en Cusco ✕ ]  [ pulse opcional ]     [ Ordenar ▼ ] [ ⊞ ⊡ ☰ ]
```

### 6.2 Especificación

| Elemento | Altura | Comportamiento |
|----------|--------|----------------|
| Count pill | 36px | Número en círculo brand-blue; label contextual con filtro |
| Pulse | 32px | Ocultar si `withActivity === 0`; sin emoji, icono SVG |
| Sort | 40px | Desktop: dropdown. **Mobile: bottom sheet** |
| View toggle | 40px | 3 modos; ocultar Feed hasta pulido |
| Share search | 32px | Solo desktop o dentro de menú ⋯ |

### 6.3 Chips de filtro activo (nuevo)

Cuando `categoria !== todos` o `filtroUbicacion` o `busqueda`:

```
[ Inmuebles ✕ ] [ Cusco ✕ ] [ "departamento" ✕ ] [ Limpiar todo ]
```

---

## 7. Componente: Header

**Altura fija:** 72px · **z-index:** 1000

| Zona | Contenido | Mobile |
|------|-----------|--------|
| Left | Logo + ubicación (click → filtro) | Logo icon-only < 380px |
| Center | Nav 5 items (solo desktop) | — |
| Right | theme, notif, messages, avatar, menú | máx 3 iconos visibles |

**Gap:** corregir truncado “Buscad” — `min-width: 0` solo en ubicación, no en logo.

---

## 8. Componente: Sidebar / Detalle

**Archivo:** `ModalAdiso.tsx` · **Ancho:** 420px · **Top:** 72px

### 8.1 Orden de contenido (target)

1. Header: “Detalle” + compartir + favorito + cerrar  
2. **Galería** (carousel si >1 imagen)  
3. **Título** (H2, 20px)  
4. **Descripción** (cuerpo 15px)  
5. **Metadata card:** categoría · ubicación · precio  
6. **Señales:** vistas / interesados (sin fecha/hora por defecto)  
7. **CTA sticky bottom:** WhatsApp — label por categoría  

### 8.2 CTA por categoría

| Categoría | Label CTA |
|-----------|-----------|
| empleos | Postular / Consultar empleo |
| inmuebles | Agendar visita |
| vehiculos | Consultar vehículo |
| productos | Consultar disponibilidad |
| servicios | Solicitar servicio |
| default | Contactar por WhatsApp |

---

## 9. Category bar

| Propiedad | Valor |
|-----------|-------|
| Altura total | 88px |
| Icon container | 48×48, radius 16px |
| Gap items | 24px desktop, 16px mobile |
| Activo | fondo brand-blue, icono blanco, label brand-blue weight 700 |
| Inactivo | fondo bg-primary, icono text-secondary |
| Sticky | `top: 72px`, `z-index: 900`, backdrop blur |

---

## 10. Accesibilidad (mínimos)

| Criterio | Requisito |
|----------|-----------|
| Contraste texto | ≥ 4.5:1 cuerpo, ≥ 3:1 grande |
| Touch target | ≥ 44×44 px |
| Focus visible | ring 2px brand-blue, offset 2px |
| Motion | `prefers-reduced-motion`: sin translate/scale |
| Screen reader | card `aria-label="Ver {titulo}"`; selected `aria-current` |
| Imágenes | `alt={titulo}`; decorativas `alt=""` |

---

## 11. Datos y contenido (fuera de Figma, crítico para UI)

| Regla | Acción |
|-------|--------|
| Históricos sin foto | Browse default: `es_historico = false` o tab “Archivo” |
| Vistas sintéticas | No mostrar badge si fuente = import batch |
| Fechas iguales | Orden secundario por `created_at` real |
| Descripciones rotas | Sanitizar “WhatsApp: .”, “..” al import y render |

---

## 12. Roadmap de implementación

### P0 — Esta sprint (impacto visual inmediato)
- [ ] AdisoCard: quitar uppercase, subir tipografía, pill ubicación
- [ ] Placeholder icono 32px, miniatura con franja visual
- [ ] Hover/selected sin scale agresivo
- [ ] Toolbar: pulse sin emoji, sort bottom sheet móvil
- [ ] Ocultar botones búsqueda voz/cámara (hasta existir)
- [ ] Sanitizar descripciones en render

### P1 — Siguiente sprint
- [ ] Chips filtros activos
- [ ] Category bar sticky
- [ ] Sidebar: orden contenido, CTA por categoría, ocultar fecha
- [ ] Dark mode: fondos categoría menos saturados
- [ ] Skeleton cards en infinite scroll

### P2 — Producto
- [ ] Filtro “solo con fotos”
- [ ] Separar browse activo / archivo
- [ ] Galería multi-imagen en sidebar
- [ ] Virtualización lista larga

---

## 13. Referencia de archivos

| Componente | Archivo |
|------------|---------|
| Card | `components/AdisoCard.tsx` |
| Grid | `components/GrillaAdisos.tsx` |
| Home | `app/page.tsx` |
| Header | `components/Header.tsx` |
| Detalle | `components/ModalAdiso.tsx` |
| Sidebar shell | `components/SidebarDesktop.tsx` |
| Tokens CSS | `app/globals.css` |
| Paquetes | `types/index.ts` → `PAQUETES` |
| Señales sociales | `lib/social-proof.ts` |

---

## 14. Cómo usar este spec

1. **Diseñador:** crear frames en Figma alineados a secciones 4–9 (usar tokens §2).
2. **Dev:** cada PR referencia ítems del roadmap §12; no mezclar P0 con P2.
3. **QA:** checklist por estado §4.3 y accesibilidad §10.
4. **Producto:** validar reglas de datos §11 antes de pulir más la UI.

---

*Documento vivo. Actualizar versión al cerrar cada sprint de diseño.*

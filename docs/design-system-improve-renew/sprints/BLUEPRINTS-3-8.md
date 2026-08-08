# Blueprints — Sprints 3 a 8

> Resúmenes ejecutables. El detalle task-by-task se escribe al abrir cada sprint (como Sprint 2).  
> No empezar hasta cerrar el criterio de done del sprint anterior (salvo S6 en paralelo tras S2).

---

## Sprint 3 — `@buscadis/ui` primitivas tanda 1

**Por qué ahora:** sin Button/Input/Icon tipados, cada fix de a11y se reescribe 265 veces.

| Entrega | Notas |
|---------|--------|
| Package `packages/ui` | peer: react, dep: `@buscadis/tokens`, radix, cva, clsx |
| `Button` | variants: primary/secondary/ghost/danger/publish · sizes sm/md/lg · loading |
| `IconButton` | reemplaza HeaderIconButton |
| `Icon` | Lucide only; registry; sizes 16/20/24/32; ESLint ban react-icons outside registry |
| `Input`, `Textarea`, `Select` | estados focus/error/disabled |
| Storybook 8 | addon-a11y; viewport 360 |
| Archivo Variable | `next/font/local` solo display |

**Migrar:** Header, AuthModal, publish chat input bar.  
**Done:** esos tres usan `@buscadis/ui`; Storybook CI axe clean en esas historias.

---

## Sprint 4 — Primitivas tanda 2

| Entrega | Notas |
|---------|--------|
| Modal / Sheet / Drawer | Radix Dialog + Vaul o Radix |
| Badge, Chip, Avatar | |
| Skeleton, Spinner, EmptyState | sustituyen clases sueltas |
| Toast | un solo sistema |

**Done:** ningún `fixed inset-0 z-[9999]` modal inventado en features; Toast único.

---

## Sprint 5 — AdisoCard + rejilla

| Entrega | Notas |
|---------|--------|
| `AdisoCard` anatomía fija | title/meta/price/media/badge — 1 señal social |
| Vistas `grid` \| `list` \| `feed` | prop variante, no boolean soup |
| Grid tokens | 2/3/4/5 cols; gaps space-3/4 |
| Quitar styled-jsx | GrillaAdisos / NavbarMobile |
| Restore scroll + filtros | sessionStorage o URL state |

**Done:** 3 usuarios recuperan precio+ubicación en ≤5s; sin styled-jsx en listing.

---

## Sprint 6 — SSR + indexación (P0 negocio)

| Entrega | Notas |
|---------|--------|
| Home / listado / detalle / negocio | RSC + data in initial HTML |
| Pagination `<a rel>` | además de infinite scroll |
| JSON-LD Product/Offer/LocalBusiness | |
| Smoke `curl` en CI | falla si solo “Cargando…” |

**Done:** 4 rutas con contenido real sin JS; Search Console indexing up.  
**Puede correr en paralelo con S3–S5.**

---

## Sprint 7 — Chrome + composer

| Entrega | Notas |
|---------|--------|
| Header 56 mobile / 64 desktop | |
| Bottom nav 56 + safe-area | |
| Composer teclado | roles, focus trap en publish mode |
| Category bar | colores S2 |
| Filters | CSS transitions; Framer solo si imprescindible |

**Done:** chrome permanente móvil ≤112px (DevTools).

---

## Sprint 8 — Storefront kit

| Entrega | Notas |
|---------|--------|
| `@buscadis/storefront-kit` | |
| Contrato 5 vars tenant | seed/mode/radius/density/accent |
| `derivarTemaTenant()` | OKLCH clamp + AA |
| Presets como semillas | renombrar cyberpunk→nocturno |
| Dejar de pisar `--bg-*` globales | |

**Done:** tema neón + negro legibles; marketplace shell intacto.

---

## Orden de apertura de planes detallados

1. Al cerrar S2 → escribir `YYYY-MM-DD-sprint-3-ui-primitives.md`  
2. Si SEO es prioridad absoluta → abrir plan S6 en paralelo  
3. No abrir S8 hasta existir primitivas (S3–S4)

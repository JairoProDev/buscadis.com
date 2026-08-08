# Design System Migration — Roadmap

> **Estado:** Sprint 1 ✅ · Sprint 2 🔜 · Sprints 3–8 planificados  
> **Fuente de verdad de diseño:** `docs/design-system-improve-renew/`  
> **Fuente de verdad de tokens:** `packages/tokens/`  
> **Actualizado:** 2026-08-08

---

## Principio de orden

> Primero lo que, si está mal, obliga a rehacer.  
> Sprint 1 = cimientos. Sin tokens, cualquier rediseño de pantalla se pudre.

---

## Tablero

| Sprint | Nombre | Estado | Plan detallado | Criterio de done |
|--------|--------|--------|----------------|------------------|
| **1** | Fundación `@buscadis/tokens` | ✅ Hecho (`ea4f2c0`) | — | 4 artifacts + contrast 0 violaciones |
| **2** | P0 marca + accesibilidad | 🟡 En progreso | [sprint-2](./2026-08-08-sprint-2-brand-a11y.md) | CTA AA, PWA alineada, logo <15KB, cats unificadas, touch ≥44 |
| **3** | Primitivas tanda 1 | 📋 Blueprint | [abajo §3](#sprint-3--primitivas-tanda-1) | Header/Auth/Publish usan Button/Input/Icon |
| **4** | Primitivas tanda 2 | 📋 Blueprint | [abajo §4](#sprint-4--primitivas-tanda-2) | Cero modales ad-hoc |
| **5** | AdisoCard + rejilla | 📋 Blueprint | [abajo §5](#sprint-5--adisocard--rejilla) | 3 vistas + scroll restore |
| **6** | SSR + indexación | 📋 Blueprint | [abajo §6](#sprint-6--ssr--indexación) | `curl` con contenido real en 4 rutas |
| **7** | Chrome + composer | 📋 Blueprint | [abajo §7](#sprint-7--chrome--composer) | Chrome móvil 112px |
| **8** | Storefront kit | 📋 Blueprint | [abajo §8](#sprint-8--storefront-kit) | Tenant extremo legible |

---

## Dependencias (no saltar)

```
S1 tokens ──► S2 P0 a11y/marca ──► S3 primitivas-1 ──► S4 primitivas-2
                     │                      │
                     │                      └─► S5 AdisoCard
                     │                      └─► S7 chrome (usa primitivas)
                     └─► S6 SSR (puede ir en paralelo tras S2, no bloquea S3)
S4 + S2 ──► S8 storefront kit
```

**Paralelizable tras S2:** S6 (SSR) puede avanzar en paralelo con S3–S5 si hay capacidad — es el mayor impacto de negocio (SEO).

---

## Métricas — medir ANTES de S2

| Métrica | Cómo medir hoy | Meta post-migración |
|---------|----------------|---------------------|
| Contraste CTA Publicar | script/culori | ≥4.5:1 |
| Hex literales en `components/` | `rg '#[0-9a-fA-F]{6}' components \| wc -l` | 0 |
| Peso `logo.svg` | `wc -c` | <15 KB |
| Chrome móvil (header+nav) | DevTools | 112px |
| Rutas con HTML de contenido | `curl -s URL \| grep -i precio` | 4 críticas |
| LCP home 4G | Lighthouse / CrUX | <1.8s |

Script sugerido (correr y pegar en este doc):

```bash
echo "logo.svg bytes: $(wc -c < public/logo.svg)"
echo "hex in components: $(rg -o '#[0-9a-fA-F]{3,8}' components --glob '*.{tsx,ts}' | wc -l)"
echo "ec4899 hits: $(rg -l 'ec4899' --glob '*.{tsx,ts,css}' | wc -l)"
echo "38bdf8 hits: $(rg -l '38bdf8' --glob '*.{tsx,ts,json,webmanifest,css}' | wc -l)"
curl -sL https://buscadis.com | head -c 2000
```

---

## Sprint 3 — Primitivas tanda 1

**Goal:** Button, IconButton, Icon (Lucide registry), Input, Textarea, Select + Storybook mínimo.

**Paquete nuevo:** `packages/ui` (`@buscadis/ui`) — Radix + CVA, consume `@buscadis/tokens`.

**Migrar primero:** `Header`, `AuthModal`, publish form.

**No hacer aún:** modales genéricos (eso es S4).

**Done:** 0 botones ad-hoc en Header/Auth/Publish; historias Storybook con addon-a11y.

---

## Sprint 4 — Primitivas tanda 2

**Goal:** Modal/Sheet, Drawer, Badge, Chip, Avatar, Skeleton, Spinner, EmptyState, Toast.

**Done:** grep de `fixed inset-0` / modales custom baja a wrappers del kit; Toast único.

---

## Sprint 5 — AdisoCard + rejilla

**Goal:** Reconstruir card con anatomía fija (grid/list/feed); quitar styled-jsx; rejilla de doc 09; restore scroll/filtros.

**Done:** prueba informal 5s (precio+ubicación); sin styled-jsx en Grilla/Card.

---

## Sprint 6 — SSR + indexación

**Goal:** Home, listado, detalle adiso, perfil negocio = Server Components con datos en HTML; paginación con `<a>`; JSON-LD.

**Done:** `curl` sin JS muestra títulos/precios; Search Console empieza a ver URLs.

**Nota:** esto es P0 de negocio (N1), no de “belleza”. Si el equipo es 1 persona, **considerar S6 en paralelo con S3**.

---

## Sprint 7 — Chrome + composer

**Goal:** Header 56/64, nav 56, composer a11y teclado, categorías con colores nuevos, filtros a CSS (menos Framer).

**Done:** chrome permanente móvil ≤112px.

---

## Sprint 8 — Storefront kit

**Goal:** `@buscadis/storefront-kit`; contrato tenant (5 vars); presets como semillas; dejar de pisar `--bg-*` globales.

**Done:** seed neón/negro sigue AA sin intervención.

---

## Backlog transversal (cualquier sprint)

| Ítem | Pri | Notas |
|------|-----|-------|
| Codemod `hex-to-token` | P1 | Tras S2 |
| Codemod `tailwind-gray-to-semantic` | P1 | Tras S3 |
| Codemod `react-icons-to-lucide` | P1 | En S3 con Icon |
| CI: contrast + eslint colors en PR | P0 | Enganchar en S2 |
| Baseline Lighthouse | P0 | Antes de afirmar mejoras |
| Archivo Variable (display) | P1 | Tipografía doc 05 — puede ir en S3 |
| Eliminar alias legacy `--brand-*` | P2 | Tras migración >80% componentes |

---

## Cómo usar este roadmap con agentes

1. Abrir el plan del sprint activo.  
2. Ejecutar task-by-task (checkbox).  
3. Un commit por task o por grupo lógico pequeño.  
4. No empezar el siguiente sprint hasta el criterio de done.  
5. Actualizar la tabla de estado de este archivo al cerrar.

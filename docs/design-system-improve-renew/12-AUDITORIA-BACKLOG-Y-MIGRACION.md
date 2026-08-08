# 12 — Auditoría, backlog y migración

> Actualiza el archivo 09 de la extracción original. La leyenda de prioridad cambia: **P0** bloquea o rompe accesibilidad/negocio · **P1** deuda visible · **P2** higiene.

---

## 1. Hallazgos P0 (nuevos y heredados)

| # | Hallazgo | Impacto | Acción |
|---|---|---|---|
| **N1** | El shell no se renderiza en servidor: buscadis.com entrega `Cargando…` | SEO y AEO nulos; ningún aviso indexable | Migrar rutas clave a Server Components con datos en el HTML |
| **N2** | Blanco sobre `#53acc5` ≈ 2.3:1 | Falla AA; botones ilegibles con sol | Separar identidad (`adis-400`) de acción (`adis-600`) |
| **N3** | CTA Publicar: celeste sobre amarillo ≈ 1.5:1 | El botón más importante del producto es inaccesible | Texto tinta `#10242B` sobre el amarillo |
| **N4** | `logo.svg` de ~3 MB | Penaliza LCP en toda sesión | Optimizar a <15 KB |
| B1 | Brand blue `#53acc5` vs `#38bdf8` en spec y PWA | Marca rota entre producto e instalación | Congelar `#53acc5`; actualizar manifests |
| B2 | Brand yellow `#ffc24a` vs `#fbbf24` | Idem | Congelar `#ffc24a` |
| B3 | Categorías divergentes CSS vs TS (`empleos`, `negocios`) | Acentos incorrectos según feature | Fuente única TS que genera CSS vars |
| **N5** | Sin capa semántica de tokens | Causa raíz de casi toda la deuda | Paquete de tokens en 3 capas |

## 2. Hallazgos P1

| # | Hallazgo | Acción |
|---|---|---|
| B4 | `.light-mode` ≠ `:root` | Unificar; eliminar `.light-mode` |
| B5 | Fuentes declaradas y no cargadas + `!important` | Decisión de `05`: system + Archivo |
| B6 | Tailwind "Luminous Void" paralelo | Eliminar; migrar `BentoCard` |
| B7 | `--brand-blue` vs `--brand-color` | Prefijo `--bs-` y contrato de tenant |
| B8 | Fallback rosa `#ec4899` | Eliminar; fallback = `sol-400` |
| B12 | `slate/zinc/gray` hardcodeados en features | Codemod a tokens semánticos |
| **N6** | `backdrop-filter: blur(40px)` sin degradación | Limitar a 2 superficies; sustituto sólido |
| **N7** | `background-attachment: fixed` en el mesh | Gradiente estático |
| **N8** | Framer Motion en filtros | Migrar a transiciones CSS |
| **N9** | 3 familias de íconos + 25 imports fuera del registry | Migrar a Lucide + regla de ESLint |
| **N10** | Props booleanas acumuladas (`compact`/`embedded`/`isDesktop`) | Prop de variante + contexto de densidad |
| **N11** | Scroll infinito sin enlaces de paginación | Añadir paginación real para crawlers |
| **N12** | Vuelta al listado pierde scroll y filtros | Restaurar estado en la navegación |

## 3. Hallazgos P2

B9 (skip-link con color legacy) · B10 (placeholders oscuros de categoría colapsados) · B11 y **N13** (objetivos táctiles de 40px en header) · X3 (`logov2` sin política) · X5 (alias legacy sin documentar) · X7 (`styled-jsx` aislado) · **N14** (texto de 10–11px en métricas de perfil) · **N15** (`.text-gradient` azul→violeta contradice la regla anti-morado).

---

## 4. Lo que se elimina

Paleta Tailwind "Luminous Void" completa y sus `glow-*`. Utilidades `.text-gradient` y `.mesh-gradient` violeta. `.light-mode`. Declaraciones de fuentes fantasma. Spacing custom `18` y `88–144`. Alias `--color-secondary` y `--accent-color` (con puente de un ciclo). `styled-jsx` local. Hex `#38bdf8`, `#fbbf24`, `#ec4899`, `#3b82f6` en cualquier lugar del repo.

---

## 5. Plan de migración — 8 sprints

**El orden es por riesgo, no por dificultad.** Primero lo que, si está mal, obliga a rehacer.

### Sprint 1 · Fundación de tokens ✅
Crear `@buscadis/tokens` con las tres capas, el pipeline de Style Dictionary, la generación de rampas en OKLCH y el verificador de contraste. Generar el preset de Tailwind. **Sin tocar ningún componente todavía.**
*Terminado cuando:* `npm run tokens:build` produce las cuatro salidas y el verificador de contraste corre en CI.  
**Hecho:** 2026-08-08 · commit `ea4f2c0` · contrast gate 24/24 OK.

### Sprint 2 · Correcciones P0 de marca y accesibilidad ✅
Congelar la marca; aplicar la separación identidad/acción; corregir el CTA Publicar; unificar `.light-mode`; unificar categorías; optimizar el logo; corregir objetivos táctiles del header.  
**Plan:** `docs/superpowers/plans/2026-08-08-sprint-2-brand-a11y.md` · **Roadmap:** `docs/superpowers/plans/2026-08-08-design-system-roadmap.md`  
**Hecho:** 2026-08-08 · commit `f9d2ed9` · CTA 9.98:1 · PWA `#53ACC5` · logo-mark 3.9KB · header 44px · 0× `ec4899`/`38bdf8` en UI.
*Terminado cuando:* cero pares en uso por debajo del mínimo de contraste y el logo pesa menos de 15 KB.

### Sprint 3 · Primitivas, tanda 1 ✅
Button, IconButton, Icon (con migración a Lucide), Input, Textarea, Select. Storybook montado con addon de accesibilidad.  
**Hecho:** 2026-08-08 · `@buscadis/ui` · HeaderIconButton→IconButton · AuthModal · BotonPublicar `variant="publish"`.
*Terminado cuando:* el header, el modal de autenticación y el formulario de publicar usan las primitivas nuevas.

### Sprint 4 · Primitivas, tanda 2
Modal/Sheet, Drawer, Badge, Chip, Avatar, Skeleton, Spinner, EmptyState, Toast.
*Terminado cuando:* no queda ningún modal implementado a mano en el repo.

### Sprint 5 · AdisoCard y rejilla
Reconstruir `AdisoCard` con anatomía fija y tres vistas; eliminar `styled-jsx`; aplicar la rejilla de `09`; restaurar scroll y filtros al volver.
*Terminado cuando:* una prueba de cinco segundos con tres personas recupera precio y ubicación.

### Sprint 6 · Renderizado en servidor e indexación
Migrar home, listado, detalle de aviso y perfil de negocio a Server Components con datos en el HTML. Añadir paginación con enlaces. JSON-LD.
*Terminado cuando:* `curl` de las cuatro rutas devuelve contenido real y Search Console empieza a indexar avisos.

### Sprint 7 · Chrome y composer
Header a 56/64, nav inferior a 56, composer con estados completos y accesible por teclado, barra de categorías con los colores nuevos, filtros migrados a CSS.
*Terminado cuando:* el chrome permanente en móvil baja de 136px a 112px.

### Sprint 8 · Storefront kit
Separar el kit, implementar el contrato de tema de tenant, migrar los presets, eliminar la sobrescritura de variables globales.
*Terminado cuando:* un tema de negocio con un color extremo (verde neón, negro) sigue siendo legible sin intervención manual.

---

## 6. Codemods necesarios

| Codemod | Qué hace | Riesgo |
|---|---|---|
| `hex-to-token` | Reemplaza literales conocidos por `var(--bs-*)` | Bajo (mapa cerrado) |
| `tailwind-gray-to-semantic` | `text-slate-600` → `text-fg-muted`, etc. | Medio: revisar caso por caso |
| `react-icons-to-lucide` | Migra imports con tabla de equivalencias | Medio: algunos íconos no tienen par exacto |
| `button-consolidation` | Detecta botones ad-hoc y los marca para revisión | Solo reporta, no modifica |

Los tres primeros se ejecutan con revisión manual del diff, nunca a ciegas.

---

## 7. Cómo medimos que la migración funcionó

| Métrica | Hoy (estimado) | Meta |
|---|---|---|
| Pares de contraste que fallan | varios, incluido el CTA principal | 0 |
| Componentes de botón distintos | decenas | 1 con 5 variantes |
| Valores de color literales en `components/` | cientos | 0 |
| Rutas con contenido en el HTML del servidor | 0 | 4 críticas |
| Chrome permanente en móvil | ~136px | 112px |
| Peso del logo | ~3 MB | <15 KB |
| LCP en 4G (home) | sin medir | <1.8 s |
| Componentes con historia en Storybook | 0 | 18 primitivas + 9 de dominio |

**Antes de empezar, mide.** Sin la línea base de hoy no vas a poder demostrar —ni a ti mismo ni a un inversor— que el trabajo sirvió.

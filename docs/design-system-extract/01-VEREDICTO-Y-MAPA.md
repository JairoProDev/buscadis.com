# 01 — Veredicto y mapa del estado actual

## ¿Tenemos un sistema de diseño?

**No.** No hay:

- Paquete `@buscadis/design-system` o carpeta `design-system/`
- Storybook / Chromatic / Ladle
- Primitivas tipadas con variantes (`Button`, `Input`, `Dialog`) vía CVA / Radix / shadcn
- Tokens sincronizados Figma ↔ código
- Un solo vocabulario de color/espacio usado de punta a punta

**Sí hay** (fragmentos útiles):

| Capa | Qué es | Madurez |
|------|--------|---------|
| Tokens CSS de marca | `:root` en `app/globals.css` | Media — usados en chrome marketplace |
| Utilidades de marca | `.brand-*`, `.glass-card`, mesh | Media — bien pensadas, locales |
| Tailwind extend | “Luminous Void” + animaciones | Baja adopción en producto |
| Registry de íconos | `components/Icons.tsx` | Media — incompleto (bypass frecuente) |
| Theming global | `light` / `dark` / `auto` | Media-alta |
| Theming por negocio | CSS vars `--brand-color`, skins | Media — segundo sistema |
| Specs escritos | Marketplace + Header redesign | Aspiracional / parcialmente divergente |
| Componentes de producto | ~265 `.tsx` custom | Alto volumen, baja estandarización |

## Stack UI

| Pieza | Valor |
|-------|--------|
| Framework | Next.js 15 (App Router) + React 18 |
| Estilos | Tailwind CSS 3.4 + un único `globals.css` |
| Utilidad de clases | `cn()` = `clsx` + `tailwind-merge` (`lib/utils.ts`) |
| Motion | Framer Motion 12 + `MotionProvider` |
| Íconos | `react-icons` (FA / MD / FC) + SVGs custom |
| Mapas | Leaflet |
| DnD | `@dnd-kit` |
| Monorepo UI | **No** — workspace solo para `@buscadis/profile-engine` (lógica/skins) |

## Arquitectura visual (mental model)

```
┌─────────────────────────────────────────────────────────────┐
│  MARKETPLACE SHELL                                          │
│  tokens: --brand-blue / --brand-yellow / --bg-* / --text-*  │
│  Header 72px · search composer · grid adisos · bottom nav   │
├─────────────────────────────────────────────────────────────┤
│  PRODUCT FEATURES (publish, chat, stories, filters, deals)  │
│  mezcla: CSS vars + Tailwind slate/zinc/gray ad-hoc         │
├─────────────────────────────────────────────────────────────┤
│  BUSINESS STOREFRONTS (multi-tenant)                        │
│  tokens: --brand-color / --brand-accent / --bp-*            │
│  presets: executive · minimal · organic · cyberpunk         │
├─────────────────────────────────────────────────────────────┤
│  SISTEMA PARALELO (casi muerto en UI)                       │
│  Tailwind: obsidian / graphite / platinum / electric / amber│
│  fonts: --font-geist-sans / --font-outfit (no cargadas)     │
└─────────────────────────────────────────────────────────────┘
```

## Principios ya documentados (marketplace)

De `docs/MARKETPLACE-DESIGN-SPEC.md` — útiles como norte, aunque tokens del spec no coincidan con CSS:

1. Contenido primero  
2. Escaneable en 2 s  
3. Una señal social por card  
4. Fotos > iconos  
5. Confianza honesta  
6. Touch-first (≥ 44×44)

De `docs/HEADER-SIDEBAR-REDESIGN.md`:

- Marca estricta: turquesa `#53acc5` + amarillo `#ffc24a`
- Prohibición de gradientes purple/pink/rainbow no autorizados
- Logo prominente (48px), chrome sobrio

## Qué se puede reutilizar vs. qué conviene rehacer

| Reutilizar / evolucionar | Rehacer desde cero (recomendado) |
|--------------------------|----------------------------------|
| Identidad de marca (celeste + amarillo + mesh) | Primitivas Button / Input / Select / Modal |
| Escala de spacing 4px (`--space-*`) | Unificación de color (una sola fuente) |
| Categorías (8) como semántica de producto | Tipografía (cargar fuentes o abrazar system) |
| Dark mode structure | Paleta Tailwind “Luminous Void” o eliminarla |
| Skins de negocio (idea de presets) | Icon pipeline unificado |
| Spec de anatomía de cards / layout home | Storybook + tokens package |

## Siguiente paso sugerido (fuera de este extract)

1. Auditoría con [09-INCONSISTENCIAS-AUDITORIA.md](./09-INCONSISTENCIAS-AUDITORIA.md)  
2. Decidir: **evolucionar** tokens actuales o **nuevo DS** con migración  
3. Congelar una sola fuente de marca (`#53acc5` vs `#38bdf8`)  
4. Extraer primitivas + tokens a paquete independiente

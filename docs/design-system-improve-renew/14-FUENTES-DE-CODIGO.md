# 14 — Fuentes de código y destino

> Actualiza el archivo 10 de la extracción. Ahora cada fuente tiene un destino declarado.

---

## Tokens y tema

| Hoy | Destino |
|---|---|
| `app/globals.css` (tokens `:root`, `.dark-mode`, `.light-mode`) | Se reduce a importar `@buscadis/tokens/tokens.css` + utilidades `.brand-*`. `.light-mode` se elimina |
| `tailwind.config.ts` (theme extend, Luminous Void, plugins) | Se reemplaza por `presets: [require('@buscadis/tokens/tailwind-preset')]`. Luminous Void y `glow-*` se eliminan |
| `lib/categoria-theme.ts` | Se convierte en la **única** fuente de categorías; genera las CSS vars en build |
| `--cat-*` en globals | Generado, no editado |
| `lib/publish-cta-styles.ts` | Pasa a ser la variante `publish` de `Button`; el texto cambia a tinta |
| `lib/business/theme-css-vars.ts` | Se reescribe como el contrato cerrado de `04 §5`; deja de sobrescribir tokens globales |
| `lib/business/theme-tokens.ts` | Presets como semillas del contrato; `cyberpunk` → `nocturno` |
| `packages/profile-engine/src/registry/skins.ts` | Consume `@buscadis/storefront-kit` |
| `lib/utils.ts` (`cn()`) | Se conserva tal cual |
| `app/layout.tsx` | Script anti-FOUC se conserva; se quita el `!important` tipográfico; se añade `next/font/local` para Archivo |

## Componentes con destino

| Hoy | Destino |
|---|---|
| `components/Header.tsx` | `@buscadis/marketplace-kit` · altura 56/64, íconos a 44px |
| `components/HeaderIconButton.tsx` | Se reemplaza por `IconButton` del kit |
| `components/NavbarMobile.tsx` | Kit · 56px, etiquetas visibles, fija |
| `components/GrillaAdisos.tsx` | Kit · sin `styled-jsx`, rejilla de `09 §2` |
| `components/AdisoCard.tsx` | Kit · anatomía fija, prop `view` |
| `components/UnifiedSearchComposer.tsx`, `Buscador.tsx`, `ComposerModeToggle.tsx` | Kit · un solo `SearchComposer` |
| `components/Icons.tsx` | Se reescribe sobre Lucide; se prohíben imports directos |
| `components/Toast.tsx`, `LoadingSpinner.tsx` | Se reemplazan por primitivas |
| `components/BentoCard.tsx` | Migrar fuera de `electric-*` o eliminar |
| `components/MotionProvider.tsx` | Se conserva; se reduce su superficie de uso |
| `components/filters/*` | Kit · migrar de Framer Motion a CSS |
| `components/business/**` | `@buscadis/storefront-kit` |
| `components/profile/**` | Revisar solapamiento con `business/public/**` — probable duplicación |
| Modales sueltos (varios) | Todos a `Modal`/`Sheet` |

## Assets

| Hoy | Acción |
|---|---|
| `public/logo.svg` (~3 MB) | Optimizar a <15 KB y pasar a ser el logo del header |
| `public/logo.png`, `logov2.*` | Archivar los no usados |
| `public/manifest.json`, `site.webmanifest` | `theme_color: #53ACC5` |
| `public/og-image.jpg` | Generación dinámica por ruta |
| `public/og/categories/*.png` | Regenerar con los colores nuevos |
| `public/qr/buscadis-finder-mark.svg` | Elevar a asset de sistema con zona de resguardo documentada |
| `public/cristalimag/`, `public/villachaco/` | Mantener como tenants de demostración en Storybook |

## Docs a derogar o actualizar

| Doc | Acción |
|---|---|
| `docs/MARKETPLACE-DESIGN-SPEC.md` | Actualizar hex a marca real; conservar la anatomía de tarjetas y los principios |
| `docs/HEADER-SIDEBAR-REDESIGN.md` | Absorbido por `08` y `09`; archivar |
| `docs/BUSINESS-EDITOR-REDESIGN.md` | Reemplazado por `buscadis-perfil-vivo/16-EXPERIENCIA-CREADOR.md` |
| `docs/BUSINESS-PAGE-EVOLUTION-MASTERPLAN.md` | Reemplazado por el paquete `buscadis-perfil-vivo` |
| Carpeta de extracción del 2026-08-07 | Se conserva como registro histórico; deja de ser normativa |

## Dependencias

**Añadir:** `@radix-ui/react-*` (solo las usadas), `class-variance-authority`, `lucide-react`, `style-dictionary`, `culori`, `@storybook/*`, `size-limit`, `@lhci/cli`.
**Quitar:** `react-icons` (tras el codemod), `@emotion/is-prop-valid` si deja de hacer falta, `styled-jsx` implícito.
**Revisar:** `framer-motion` — se conserva, pero su uso baja de ~30 componentes a los que tienen gesto o física.

---

## Cómo regenerar este mapa

1. `npm run tokens:build` y comparar `dist/` con `globals.css`.
2. Reinventariar `components/**` y marcar cada archivo con su destino (kit, feature, eliminar).
3. Buscar hex literales: `rg '#[0-9a-fA-F]{6}' components/ app/ | grep -v tokens`.
4. Buscar imports de íconos fuera del registry.
5. Actualizar `12-AUDITORIA-BACKLOG-Y-MIGRACION.md` con lo que quedó.

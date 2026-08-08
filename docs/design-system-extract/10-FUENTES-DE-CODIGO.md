# 10 — Fuentes de código (mapa canónico)

Rutas absolutas del workspace. Usar esto para clonar tokens, auditar o migrar.

---

## Tokens y tema

| Qué | Path |
|-----|------|
| Tokens CSS + utilidades brand + dark + a11y motion | `app/globals.css` |
| Tailwind theme extend + plugins glass/glow | `tailwind.config.ts` |
| PostCSS | `postcss.config.js` |
| Categorías runtime | `lib/categoria-theme.ts` |
| CTA publicar | `lib/publish-cta-styles.ts` |
| Theme vars negocio | `lib/business/theme-css-vars.ts` |
| Presets negocio | `lib/business/theme-tokens.ts` |
| Skins profile-engine | `packages/profile-engine/src/registry/skins.ts` |
| `cn()` | `lib/utils.ts` |
| Layout root / FOUC theme script | `app/layout.tsx` |

---

## Motion / tema UI

| Qué | Path |
|-----|------|
| Spring global | `components/MotionProvider.tsx` |
| Toggle tema | `components/ThemeToggle.tsx` |

---

## Chrome marketplace (archivos clave)

| Qué | Path |
|-----|------|
| Header | `components/Header.tsx` |
| Header buttons / popovers | `components/HeaderIconButton.tsx`, `HeaderPopoverPanel.tsx` |
| Bottom nav | `components/NavbarMobile.tsx` |
| Sidebars | `components/SidebarDesktop.tsx`, `LeftSidebar.tsx`, `ModalNavegacionMobile.tsx` |
| Home shell | `components/HomePageClient.tsx` |
| Grid + card | `components/GrillaAdisos.tsx`, `AdisoCard.tsx` |
| Search composer | `components/UnifiedSearchComposer.tsx`, `Buscador.tsx`, `ComposerModeToggle.tsx` |
| Icons registry | `components/Icons.tsx` |

---

## Docs de diseño existentes

| Doc | Path | Relación con extract |
|-----|------|----------------------|
| Spec marketplace (objetivo) | `docs/MARKETPLACE-DESIGN-SPEC.md` | Hex divergen; anatomía útil |
| Header/Sidebar redesign | `docs/HEADER-SIDEBAR-REDESIGN.md` | Marca `#53acc5` / `#ffc24a` |
| Business editor | `docs/BUSINESS-EDITOR-REDESIGN.md` | UX editor |
| Business evolution | `docs/BUSINESS-PAGE-EVOLUTION-MASTERPLAN.md` | Storefront |
| Catalog design specs | `docs/superpowers/specs/*-design.md` | Features |

---

## Assets públicos

| Qué | Path |
|-----|------|
| Logos | `public/logo.png`, `logo.svg`, `logov2.*` |
| Favicons / PWA icons | `public/favicon*`, `apple-touch-icon.png`, `android-chrome-*` |
| Manifests | `public/manifest.json`, `site.webmanifest` |
| OG | `public/og-image.jpg`, `public/og/categories/` |
| QR mark | `public/qr/buscadis-finder-mark.svg` |
| Demos | `public/cristalimag/`, `public/villachaco/` |

---

## Dependencias UI (package.json)

Relevantes al DS:

- `tailwindcss`, `postcss`, `autoprefixer`
- `clsx`, `tailwind-merge`
- `framer-motion`
- `react-icons`
- `leaflet` (+ CSS import en globals)
- `@dnd-kit/*`
- `qr-code-styling`
- `@emotion/is-prop-valid` (helper FM, no Emotion styling)

**Ausentes:** `@radix-ui/*`, `class-variance-authority`, `lucide-react`, Storybook.

---

## Cómo regenerar / extender este extract

1. Diff `app/globals.css` y `tailwind.config.ts`  
2. Re-scan `components/**` inventory  
3. Diff `lib/categoria-theme.ts` vs `--cat-*`  
4. Revisar manifests PWA  
5. Actualizar [09-INCONSISTENCIAS-AUDITORIA.md](./09-INCONSISTENCIAS-AUDITORIA.md)

Fecha de esta extracción: **2026-08-07**.

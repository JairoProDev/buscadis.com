# 05 — Inventario de componentes

## Modelo actual

- **~265** archivos `.tsx` bajo `components/` (+ algunos en `app/mi-negocio/components/`)
- **Custom** — no shadcn, no Radix UI kit, no MUI, no CVA
- Patrón: Tailwind + `cn()` + props ad-hoc (`compact`, `embedded`, `vista`, `isDesktop`)
- Algunos `styled-jsx` locales (`GrillaAdisos`, `NavbarMobile`)
- **No hay** carpeta `components/ui/` de primitivas reutilizables

---

## Primitivas que NO existen (gap fuerte)

| Primitiva esperada en un DS | Hoy |
|-----------------------------|-----|
| Button (variants/sizes) | Estilos duplicados por pantalla |
| Input / Textarea / Select | Ad-hoc |
| Dialog / Modal base | Varios modales independientes |
| Toast / Snackbar | `Toast.tsx` (feature, no sistema) |
| Badge / Chip | Ad-hoc + filtros |
| Card base | `AdisoCard` es de dominio, no primitiva |
| Avatar | Embebido en UserMenu / profiles |
| Tabs | Por feature |
| Dropdown / Popover | Header popovers custom |
| Spinner | `LoadingSpinner.tsx` |
| Skeleton | clases `.skeleton-shimmer` + componentes |

---

## Chrome marketplace (raíz `components/`)

| Componente | Rol de diseño |
|------------|---------------|
| `Header.tsx` | Top bar 72px, logo, theme, popovers; setea `--header-height` |
| `HeaderIconButton.tsx` | Botón icono header |
| `HeaderPopoverPanel.tsx` | Panel popover |
| `NavbarMobile.tsx` | Bottom nav ~64px + safe area |
| `SidebarDesktop.tsx` / `LeftSidebar.tsx` | Navegación lateral |
| `ModalNavegacionMobile.tsx` | Nav sheet mobile |
| `ThemeToggle.tsx` | light / auto / dark |
| `Buscador.tsx` / `UnifiedSearchComposer.tsx` / `ComposerModeToggle.tsx` | Composer buscar/publicar |
| `GrillaAdisos.tsx` / `AdisoCard.tsx` | Grid + card anuncio |
| `SkeletonAdiso(s).tsx` | Loading listings |
| `ModalAdiso.tsx` / `SimilarAdisos.tsx` | Detalle |
| `FiltrosCategoria.tsx` / `FiltroUbicacion.tsx` / `Ordenamiento.tsx` | Filtros |
| `AuthModal.tsx` / `UserMenu.tsx` / `UserProfile.tsx` | Auth/cuenta |
| `Toast.tsx` / `LoadingSpinner.tsx` / `ErrorBoundary.tsx` | Feedback |
| `StoriesBar.tsx` / `StoryViewer.tsx` / `StoryUploadModal.tsx` | Stories |
| `ChatDock.tsx` / `ChatWindow.tsx` / `MessagesPopover.tsx` / `NotificationsPopover.tsx` | Messaging |
| `ChatbotIA*.tsx` / `FloatingChatbot.tsx` | AI chat |
| `FormularioPublicar.tsx` / `BotonPublicar.tsx` / `PublishSidebarFlow.tsx` | Publish |
| `Icons.tsx` | Registry de íconos |
| `MotionProvider.tsx` | Spring global |
| `BentoCard.tsx` | Card bento (usa electric Tailwind) |
| `BrowseEmptyState.tsx` / `FeedbackButton.tsx` | Empty / feedback |
| `MapaInteractivo.tsx` / `SelectorUbicacion.tsx` / `LocationPrompt.tsx` | Location |
| `LanguageSelector.tsx` / `Breadcrumbs.tsx` / `VerificationBadge.tsx` | Misc chrome |
| `HomePageClient.tsx` | Shell home |

---

## Por dominio (carpetas)

### `adiso/`
Landing pública de anuncio (`AdisoLandingPage`).

### `ai/`
`DraftListingCard`, `ListingCard`, `ErrorCard`, `SkeletonComponents`.

### `analytics/`
Scripts, cookie consent, insights (poco visual de marca).

### `auth/`
Google One Tap/GIS, KYC uploader, onboarding, referral.

### `business/` (+ `builder/`, `editor/`, `public/`, `qr/`)
Sistema visual más grande después del marketplace:

- Editor: chrome, top bar, progress, inline fields, category manager
- Public: `BusinessProfileShell`, `StorefrontChrome`, heroes (`HeroMinimal`, `HeroBento`, `HeroSplit`), tabs (catalog/info/reviews), cart drawer, highlights, links
- QR studio: preview + modal
- Builder: block inspector, layout/style editor, chat editor

Theming por CSS vars de tenant.

### `catalog/`
Product modal, sortable list/strip, gallery, sector selector, trash, sort control.

### `chat/`
`ChatSearchPicks`.

### `deals/`
Clips feed, overlays, publish wizard, metrics, live rails, boost.

### `envios/`
`DeliveryPointField` (mapa + pin marca).

### `filters/`
Panel, chips, presets, sort, progress, radius, section cards — uso intenso de Framer Motion.

### `flyer/`
Canvas + template picker.

### `home/`
`BusinessDirectorySection`, `ParaTiSection`.

### `icons/`
`QrMinimalIcon.tsx` (SVG custom).

### `location/`
Combobox, picker, country flag.

### `profile/`
Hub completo: chrome, hero overlap, tabs, metrics, sticky CTA, verification, grids, empty states.

### `profiling/`
Progressive prompt modal.

### `publish/`
Chat wizard studio: previews, tiers, checkout, photo zone, magic input, reach lines, UI helpers (`publish-ui.ts`).

### `pwa/`
Install prompt, offline, pull-to-refresh.

### `search/`
Marketplace composer pieces, command palette, suggestions.

### `stories/`
Create / archive / upload / metrics cards.

### `trust/`
`TrustBadge`, `SellerReputationCard`.

---

## Variantes / props recurrentes (no tipadas como DS)

| Prop / patrón | Significado |
|---------------|------------|
| `vista: 'grid' \| 'list' \| 'feed'` | Layout de listados |
| `compact` / `embedded` | Densidad / contexto embebido |
| `isDesktop` | Branch layout |
| Heroes business | Minimal / Bento / Split vía renderer |

---

## Qué documentar al migrar a un DS nuevo

**Candidatos a design tokens + componentes de dominio (no solo primitivas):**

1. `AdisoCard` (anatomía grid/list/feed)  
2. Search composer (buscar ↔ publicar)  
3. Header + mobile bottom nav  
4. Category chip / accent bar  
5. Publish CTA yellow  
6. Business hero variants + storefront chrome  
7. Filter panel / chips  
8. Story ring  
9. Trust badges  

**Candidatos a primitivas genéricas (construir primero):**

Button, IconButton, Input, Textarea, Select, Checkbox, Switch, Modal, Drawer, Popover, Tooltip, Toast, Badge, Avatar, Tabs, Skeleton, Spinner, EmptyState.

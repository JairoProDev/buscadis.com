# 06 — Layout y patrones de UI

## Breakpoints

| Fuente | Definición |
|--------|------------|
| Tailwind config | **Defaults** (sin `screens` custom) |
| Uso real en app | `md` 768 · `lg` 1024 · `xl` 1280 |
| Spec marketplace | añade `sm: 480px` — **no está en Tailwind** |

Hooks: `useMediaQuery('(min-width: 768px)')` en varios sitios.

---

## Chrome fijo

| Elemento | Medida | Notas |
|----------|--------|-------|
| Header | **72px** | `--header-height`; puede ir a `0` |
| Logo header | **48px** altura | Doc redesign |
| Header icon buttons | a menudo **40×40** | Spec pide ≥44×44 |
| Mobile bottom nav | **~64px + safe-area** | `NavbarMobile`; hide-on-scroll |
| Sticky search | `top: var(--header-height, 72px)` | z-index alto; baja con modal open |
| Category bar (spec) | ~88px desktop / ~72 mobile | |
| Search control (spec) | 56px desktop / 52 mobile | |
| Toolbar (spec) | ~48 / ~44 | |

Z-index notes (globals):

- Sticky search ~900, header ~1000  
- Con `body.buscadis-modal-open` se fuerza sticky/header a z-index 1

---

## Grids y anchos

### Listados (`GrillaAdisos`)

| Viewport | Columnas | Gap |
|----------|----------|-----|
| Mobile | 2 | `--space-3` (12) |
| ≥768 | 3 | `--space-4` |
| ≥1024 | 4 | |
| ≥1280 | 5 | |
| Feed mode | max-width **480px** | |

### Contenedores frecuentes (no hay `<Container>` compartido)

| Contexto | max-width típico |
|----------|------------------|
| Home search | `max-w-2xl` |
| Profile chrome | `max-w-[960px]` |
| Business public | `max-w-6xl` / secciones `max-w-lg` |
| Editor sidebar open | `md:ml-[400px]` |
| Detail sidebar (spec) | **420px** fixed |

Padding horizontal frecuente: `px-4` / `--space-5` (20px) en spec.

---

## Anatomía Home (spec — objetivo)

### Desktop
```
HEADER 72
CATEGORY BAR
MAIN + SEARCH + TOOLBAR + GRID     | SIDEBAR detalle 420px
```

### Mobile
```
HEADER → CATEGORIES → SEARCH → TOOLBAR → GRID 2col → BOTTOM NAV
```

Implementación actual sigue esta intención con variaciones (composer unificado buscar/publicar, drawers).

---

## Superficies / utilidades de marca (globals)

| Clase | Uso |
|-------|-----|
| `.brand-mesh-bg` | Página / sección con mesh |
| `.brand-mesh-glass` | Panel glass + mesh soft |
| `.brand-mesh-strip` | Franja horizontal toolbar |
| `.brand-category-tile` | Tile de categoría |
| `.brand-header-sheen` | Header |
| `.brand-nav-sheen` | Bottom / nav |
| `.brand-pill-glass` | Pills |
| `.brand-search-shell` | Contenedor buscador |
| `.brand-search-glow` | Borde conic animado blue↔yellow |
| `.brand-tint-surface` / `.brand-yellow-tint-surface` | Tints |
| `.glass-card` | Glassmorphism blur 40px |
| `.composer-mode-*` | Alternador buscar/publicar |
| `.skeleton-shimmer` | Loading wave |
| `.no-scrollbar` | Ocultar scrollbar |
| `.skip-link` | A11y |

Dark overrides específicos para varias de estas clases.

---

## Patrones de interacción documentados

1. **Composer dual:** buscar ↔ publicar (pill animado + glow distinto en publish)  
2. **Category accent:** 3px, no fondo completo de media  
3. **Una señal social por card** (spec)  
4. **Touch-first** ≥44×44 (parcialmente incumplido en header 40px)  
5. **Hide-on-scroll** bottom nav  
6. **Theme cycle** light → auto → dark  
7. **Business density:** compact `0.5rem` / comfortable `1rem` gap  

---

## Motion en layout

- Spring global: stiffness 260, damping 20, mass 1  
- Prefer-reduced-motion: kill casi total de animaciones/transitions  
- Theme change: clase `html.theme-transitioning` (~280ms)

Detalle completo: [08-MOTION-Y-THEMING.md](./08-MOTION-Y-THEMING.md).

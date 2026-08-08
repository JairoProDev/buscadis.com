# 04 — Color y marca

## Identidad oficial (código + Header redesign)

| Rol | Hex light | Hex dark | Token |
|-----|-----------|----------|-------|
| Primario (celeste / turquesa) | `#53acc5` | `#6ec0d8` | `--brand-blue` |
| Secundario (amarillo) | `#ffc24a` | `#ffd06a` | `--brand-yellow` |

Reglas históricas (`HEADER-SIDEBAR-REDESIGN.md`):

- Respetar estrictamente estos dos colores de marca
- Evitar gradientes purple/pink/rainbow no autorizados
- Hover con `--hover-bg`, no colores permanentes chillones
- Badge de notificación: `#ef4444` (único rojo “sistema” citado ahí)

### CTA Publicar (firma visual)

- Fondo: gradiente amarillo (`#ffd76a` → brand yellow → `#ffb830`)
- Texto/ícono: brand blue
- Fuente: `lib/publish-cta-styles.ts`

### Atmósfera

- Body: `background-color: var(--bg-secondary)` + `background-image: var(--brand-mesh)` fixed
- Utilidades: `.brand-mesh-bg`, `.brand-header-sheen`, `.brand-nav-sheen`, `.brand-category-tile`, `.brand-search-glow`, etc.

---

## Conflicto de marca (crítico para auditoría)

| Fuente | Blue | Yellow |
|--------|------|--------|
| `globals.css` + Header doc | `#53acc5` | `#ffc24a` |
| `MARKETPLACE-DESIGN-SPEC.md` | `#38bdf8` | `#fbbf24` |
| `manifest.json` / `site.webmanifest` `theme_color` | `#38bdf8` | — |
| Tailwind `electric-500` | `#3b82f6` | — |
| Tailwind `amber-400/500` | — | `#fbbf24` / `#f59e0b` |

**Decisión pendiente del equipo:** congelar un hex canónico de marca y alinear PWA + specs + Tailwind.

---

## Neutrales / superficies

Ver tabla completa en [02-TOKENS.md](./02-TOKENS.md). Resumen conceptual:

- Light: blanco → off-white → slate-50-ish (`#f1f5f9`)
- Dark: `#13171d` canvas → `#1c2229` surface → `#283038` elevated
- Text: slate-900-ish → slate-600 → slate-400 (light); near-white → muted blue-gray (dark)

En features (business/catalog/admin) aparece mucho **Tailwind raw**: `slate-*`, `zinc-*`, `gray-*`, a menudo con `dark:` — paralelo a CSS vars.

---

## Semántica de categorías (8)

Producto marketplace = 8 categorías con acento (regla: **borde/chip 3px**, no flood de fondo).

Colores “de consenso” (coinciden CSS + TS):

- inmuebles `#059669`, vehiculos `#0284c7`, servicios `#d97706`
- productos `#e11d48`, eventos `#7c3aed`, comunidad `#0891b2`

Conflictos:

| Cat | CSS `--cat-*` | TS runtime |
|-----|---------------|------------|
| empleos | `#64748b` | `#0f766e` |
| negocios | `#475569` | `#1d4ed8` |

OG category images: `public/og/categories/{empleos,inmuebles,...}.png`

---

## Theming multi-tenant (negocios)

Cada perfil de negocio puede definir:

- `theme_color` → `--brand-color`
- `theme_accent_color` → `--brand-accent` (fallback `#ffc24a`; algunos classNames usan fallback `#ec4899` ⚠️)
- `theme_mode` light/dark
- `theme_preset`: executive | minimal | organic | cyberpunk (+ `buscadis_default` en engine)

Esto es un **segundo design system** scoped al storefront, no al shell marketplace.

---

## Focus y accesibilidad de color

```css
*:focus-visible {
  outline: 2px solid var(--brand-blue);
  outline-offset: 2px;
}
```

Skip link: fondo brand-blue, texto blanco; shadow hardcodeada con `rgba(56, 189, 248, …)` (= `#38bdf8`, no `#53acc5`).

---

## Assets de marca

| Archivo | Uso |
|---------|-----|
| `/logo.png` | Header (altura ~48px según doc) |
| `/logo.svg` | Vector (archivo grande) |
| `/logov2.png`, `/logov2.svg` | Variante v2 |
| Favicons + android-chrome | PWA |
| `/og-image.jpg` | Open Graph default |
| `/qr/buscadis-finder-mark.svg` | Marca QR |

Demos tenant: `public/cristalimag/`, `public/villachaco/` (fotos + logos).

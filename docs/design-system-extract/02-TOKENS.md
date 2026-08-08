# 02 — Design tokens (valores reales en código)

**Fuente canónica de producción:** `app/globals.css`  
**Fuente paralela (Tailwind):** `tailwind.config.ts`  
**Fuente runtime categorías (TS):** `lib/categoria-theme.ts`  
**Fuente negocio:** `lib/business/theme-css-vars.ts`, `lib/business/theme-tokens.ts`

---

## 1. Marca (marketplace)

### Light (`:root`)

| Token | Valor | Notas |
|-------|-------|-------|
| `--brand-blue` | `#53acc5` | Celeste logo oficial |
| `--brand-yellow` | `#ffc24a` | Amarillo logo oficial |
| `--brand-primary-rgb` | `83, 172, 197` | Para rgba |
| `--brand-yellow-rgb` | `255, 194, 74` | Para rgba |
| `--color-secondary` | → `--brand-yellow` | Alias legacy |
| `--accent-color` | → `--brand-blue` | Alias legacy |

### Dark (`.dark-mode` / `html.dark` / `prefers-color-scheme`)

| Token | Valor |
|-------|-------|
| `--brand-blue` | `#6ec0d8` |
| `--brand-yellow` | `#ffd06a` |

### Mesh de marca

| Token | Uso |
|-------|-----|
| `--brand-mesh` | Fondo página (radiales celeste↔amarillo) |
| `--brand-mesh-soft` | Versión suave para paneles |

---

## 2. Texto

### Light (`:root`)

| Token | Valor |
|-------|-------|
| `--text-primary` | `#0f172a` |
| `--text-secondary` | `#475569` |
| `--text-tertiary` | `#94a3b8` |

### Dark

| Token | Valor |
|-------|-------|
| `--text-primary` | `#edf1f5` |
| `--text-secondary` | `#9dabb8` |
| `--text-tertiary` | `#6f7d8c` |

### `.light-mode` (forzado — **diverge de `:root`**)

| Token | Valor | Comparación `:root` |
|-------|-------|---------------------|
| `--text-primary` | `#050505` | ≠ `#0f172a` |
| `--text-secondary` | `#65676b` | ≠ `#475569` |
| `--text-tertiary` | `#b0b3b8` | ≠ `#94a3b8` |
| `--bg-secondary` | `#f0f2f5` | ≠ `#fdfdfd` |
| `--bg-tertiary` | `#e4e6eb` | ≠ `#f1f5f9` |
| `--border-color` | `#ced0d4` | ≠ `rgba(0,0,0,0.04)` |

> Hallazgo: `.light-mode` parece paleta “Facebook-like” residual; no es idéntica a `:root`.

---

## 3. Fondos y superficies

### Light

| Token | Valor |
|-------|-------|
| `--bg-primary` | `#ffffff` |
| `--bg-secondary` | `#fdfdfd` |
| `--bg-tertiary` | `#f1f5f9` |
| `--glass-bg` | `rgba(255,255,255,0.7)` |
| `--glass-border` | `rgba(255,255,255,0.5)` |

### Dark (elevación: canvas más oscuro → cards más claras)

| Token | Valor | Rol |
|-------|-------|-----|
| `--bg-secondary` | `#13171d` | Canvas página |
| `--bg-primary` | `#1c2229` | Superficies / cards |
| `--bg-tertiary` | `#283038` | Elevación / tertiary |
| `--glass-bg` | `rgba(28,34,41,0.88)` | |

### Bordes e interacción (light)

| Token | Valor |
|-------|-------|
| `--border-color` | `rgba(0,0,0,0.04)` |
| `--border-subtle` | `rgba(0,0,0,0.02)` |
| `--hover-bg` | `rgba(brand-blue, 0.08)` |
| `--hover-bg-yellow` | `rgba(brand-yellow, 0.12)` |

### Bordes e interacción (dark)

| Token | Valor |
|-------|-------|
| `--border-color` | `rgba(255,255,255,0.10)` |
| `--border-subtle` | `rgba(255,255,255,0.06)` |
| `--hover-bg` | `rgba(brand-blue, 0.14)` |
| `--hover-bg-yellow` | `rgba(brand-yellow, 0.16)` |

---

## 4. Sombras

| Token | Light (resumen) |
|-------|-----------------|
| `--shadow-sm` | `0 1px 3px rgba(0,0,0,0.02)` |
| `--shadow-md` | soft dual shadow 0.03 |
| `--shadow-lg` | tinted brand-blue |
| `--shadow-hover` | tinted brand-blue fuerte |
| `--card-shadow` | `0 1px 3px …, 0 4px 12px …` |
| `--card-shadow-hover` | `0 8px 24px rgba(0,0,0,0.08)` |
| `--popover-shadow` | `0 16px 48px rgba(15,23,42,0.12)` |
| `--shadow-up` | `0 -4px 16px rgba(0,0,0,0.04)` |
| `--focus-ring` | `0 0 0 2px var(--brand-blue)` |

Dark redefine todas las sombras con opacidades más altas + a veces `1px` hairline blanco.

---

## 5. Spacing (CSS)

Escala base **4px**:

| Token | px |
|-------|-----|
| `--space-1` | 4 |
| `--space-2` | 8 |
| `--space-3` | 12 |
| `--space-4` | 16 |
| `--space-5` | 20 |
| `--space-6` | 24 |
| `--space-8` | 32 |

**No existe** `--space-7` ni `--space-9+` en CSS.  
Tailwind añade spacing custom: `18`, `88`–`144` (rem grandes) — poco relacionado con esta escala.

---

## 6. Radius

| Origen | Token / key | Valor |
|--------|-------------|-------|
| CSS | `--card-radius` | `16px` |
| Tailwind | `sm` … `3xl` | `0.25rem` → `2rem` |
| Negocio | sharp / rounded / pill | `0px` / `0.75rem` / `1.5rem` |

---

## 7. Categorías — dos fuentes

### CSS (`--cat-*` en globals)

| Cat | Color |
|-----|-------|
| empleos | `#64748b` |
| inmuebles | `#059669` |
| vehiculos | `#0284c7` |
| servicios | `#d97706` |
| productos | `#e11d48` |
| eventos | `#7c3aed` |
| negocios | `#475569` |
| comunidad | `#0891b2` |

### TypeScript (`lib/categoria-theme.ts`) — **usado en cards/mapas**

| Cat | accent | placeholder light | placeholder dark |
|-----|--------|-------------------|------------------|
| empleos | `#0f766e` ⚠️ | `#f0fdfa` | `#283038` |
| inmuebles | `#059669` | `#ecfdf5` | `#283038` |
| vehiculos | `#0284c7` | `#f0f9ff` | `#283038` |
| servicios | `#d97706` | `#fffbeb` | `#283038` |
| productos | `#e11d48` | `#fff1f2` | `#283038` |
| eventos | `#7c3aed` | `#f5f3ff` | `#283038` |
| negocios | `#1d4ed8` ⚠️ | `#eff6ff` | `#283038` |
| comunidad | `#0891b2` | `#ecfeff` | `#283038` |

⚠️ Divergencias críticas: **empleos** y **negocios**.  
Dark placeholders colapsados a un solo `#283038` (spec pedía por categoría).

---

## 8. Tokens de negocio (storefront)

Inyectados por `buildBusinessThemeVars()`:

| Token | Rol |
|-------|-----|
| `--brand-color` | Primario del tenant |
| `--brand-accent` | Secundario (default `#ffc24a`) |
| `--bp-surface` / `--bp-surface-elevated` | Superficies perfil |
| `--bp-text` / `--bp-text-muted` | Texto perfil |
| `--bp-border` | Borde |
| `--bp-radius` / `--theme-radius` | Radio según skin |
| `--bp-density-gap` | `0.5rem` compact / `1rem` comfortable |

También sobrescribe `--bg-*`, `--text-*`, `--border-*` del scope del perfil.

### Presets (`THEME_TOKEN_PRESETS` / `STYLE_SKINS`)

| Preset | Color | Mode | Font | Radius | Density | Accent |
|--------|-------|------|------|--------|---------|--------|
| buscadis_default (engine) | `#53acc5` | light | sans | rounded | comfortable | solid |
| executive | `#1e3a5f` | light | sans | rounded | comfortable | solid |
| minimal | `#171717` | light | serif | sharp | compact | outline |
| organic | `#2d6a4f` | light | sans | pill | comfortable | gradient |
| cyberpunk | `#a855f7` | dark | display | rounded | comfortable | gradient |

---

## 9. CTA Publicar (`lib/publish-cta-styles.ts`)

| Prop | Valor |
|------|-------|
| Fondo | `linear-gradient(145deg, #ffd76a → var(--brand-yellow) → #ffb830)` |
| Label / icono | `var(--brand-blue)` |
| Shadow | tinted yellow |

---

## 10. Runtime layout

| Token | Set by | Valores |
|-------|--------|---------|
| `--header-height` | `Header.tsx` | `72px` o `0px` |
| Scrollbar | globals | `--scrollbar-thumb`, `--scrollbar-track` |

---

## 11. Tailwind “Luminous Void” (paralelo)

Escalas completas 50–950 (o 900):

- `obsidian` — dark foundation  
- `graphite` — secondary surfaces  
- `platinum` — text/light  
- `electric` — accent (`500: #3b82f6`)  
- `amber` — secondary (`500: #f59e0b`)

Box shadows: `glow-sm` … `glow-xl`, `glow-electric`, `glow-amber`, `inner-glow*`.  
Plugins: `.glass`, `.glass-light`, `.glass-heavy`, `.text-gradient` (blue→violet), `.mesh-gradient`, `.noise`.

**Adopción en producto:** muy baja (ej. `BentoCard` con `bg-electric-500`). El producto real usa CSS vars de marca.

---

## 12. Valores aspiracionales (NO producción)

`docs/MARKETPLACE-DESIGN-SPEC.md` y PWA manifests:

| Concepto | Spec / manifest | Código (`:root`) |
|----------|-----------------|------------------|
| Brand blue | `#38bdf8` | `#53acc5` |
| Brand yellow | `#fbbf24` | `#ffc24a` |
| Dark canvas | `#0b1120` / `#0f172a` | `#13171d` / `#1c2229` |
| PWA `theme_color` | `#38bdf8` | — |

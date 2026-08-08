# 03 — Tipografía

## Estado real (runtime)

**Fuente aplicada:** system UI stack, forzada con `!important` en `html, body, :root`:

```
system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
"Helvetica Neue", Arial, sans-serif
```

`body` también declara:

```
-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif
```

| Propiedad | Valor |
|-----------|-------|
| Line-height body | `1.6` |
| Smoothing | antialiased / grayscale |
| Inputs / buttons | `font-family: inherit` |

**No hay** `next/font`, Google Fonts ni `@font-face` en `app/layout.tsx`.

---

## Declarado pero no cargado (Tailwind)

```ts
fontFamily: {
  sans: ['var(--font-geist-sans)', 'Inter', 'system-ui', ...],
  display: ['var(--font-outfit)', 'Inter', 'system-ui', ...],
}
```

`--font-geist-sans` y `--font-outfit` **no existen** en el DOM → cae a Inter (si el SO la tiene) o system-ui.

Skins de negocio mapean:

| Token skin | Clase Tailwind |
|------------|----------------|
| `sans` | `font-sans` |
| `serif` | `font-serif` (Tailwind default serif — no custom) |
| `display` | `font-sans tracking-tight` |

---

## Escala de tamaños (Tailwind extend)

Cada step incluye letter-spacing óptico:

| Key | Size | Line-height | Letter-spacing |
|-----|------|-------------|----------------|
| xs | 0.75rem (12px) | 1rem | 0.01em |
| sm | 0.875rem (14px) | 1.25rem | 0.01em |
| base | 1rem (16px) | 1.5rem | 0 |
| lg | 1.125rem (18px) | 1.75rem | -0.01em |
| xl | 1.25rem (20px) | 1.75rem | -0.01em |
| 2xl | 1.5rem (24px) | 2rem | -0.02em |
| 3xl | 1.875rem (30px) | 2.25rem | -0.02em |
| 4xl | 2.25rem (36px) | 2.5rem | -0.03em |
| 5xl | 3rem (48px) | 1 | -0.03em |
| 6xl | 3.75rem (60px) | 1 | -0.04em |

Feature: `fontFeatureSettings.tabular: "tnum"` (precios).

---

## Roles tipográficos de producto (spec marketplace)

Definidos en `docs/MARKETPLACE-DESIGN-SPEC.md` — **objetivo**, no enforcement automático:

| Rol | Mobile | Desktop | Weight | LH | Extra |
|-----|--------|---------|--------|-----|-------|
| Card title | 14px | 15px | 600 | 1.25 | sentence case |
| Card meta | 12px | 12px | 500 | 1.3 | |
| Card price | 14px | 15px | 700 | 1.2 | |
| Description | 13px | 13px | 400 | 1.45 | max 2 lines |
| Badge | 11px | 11px | 600 | 1 | |
| Toolbar count | 14px | 14px | 600 | 1 | |
| Section label | 11px | 11px | 600 | 1.2 | uppercase, tracking 0.04em |

El spec asume stack system (alineado con runtime real).

---

## Implicaciones para un DS nuevo

1. Decidir: **system-first** (rápido, nativo, actual) vs **brand fonts** (Geist/Outfit u otras).  
2. Si se eligen fonts custom: cargarlas con `next/font` y quitar el `!important` del system stack.  
3. Formalizar type roles (Display / Title / Body / Meta / Price / Label) como tokens, no solo clases ad-hoc.  
4. Mantener `tnum` para precios.

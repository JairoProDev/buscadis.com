# 08 — Motion y theming

## Theming global

| Pieza | Detalle |
|-------|---------|
| Tailwind | `darkMode: 'class'` |
| Clases en `<html>` | `dark` + `dark-mode`; forzar light: `light-mode` |
| Preferencia | `localStorage.theme` = `light` \| `dark` \| `auto` |
| FOUC | Script inline en `app/layout.tsx` |
| UI | `ThemeToggle` + ciclo en Header |
| System | `@media (prefers-color-scheme: dark)` en CSS + listener JS |
| Transición | `withThemeTransition` + `html.theme-transitioning` (~0.28s bg/color/border/shadow) |
| meta theme-color | light `#ffffff`, dark `#13171d` |

### Tres caminos light (cuidado)

1. `:root` (default light tokens “modern”)  
2. `.light-mode` (tokens tipo Facebook — **valores distintos**)  
3. Negocio light vía `buildBusinessThemeVars` (`--bg-secondary: #f8fafc`, etc.)

### Theming de negocio

Independiente del tema global del marketplace: `theme_mode` + preset pueden forzar light/dark dentro del storefront.

---

## Motion — Framer Motion

**Provider:** `components/MotionProvider.tsx`

```ts
transition: {
  type: 'spring',
  stiffness: 260,
  damping: 20,
  mass: 1,
}
```

~30 archivos de componentes usan Framer Motion (filters, modals, composer, deals, etc.).

---

## Animaciones Tailwind (config)

| Nombre | Uso típico |
|--------|------------|
| `float` | 3s ease-in-out translateY |
| `glow-pulse` | opacity pulse |
| `shimmer` | translateX -100→100 |
| `slide-up/down/left/right` | 0.4s cubic-bezier(0.16,1,0.3,1) |
| `fade-in` | 0.3s |
| `scale-in` | 0.2s |

Easings: `bounce-in`, `smooth`.  
Durations extra: `400`, `600`.

---

## Keyframes / CSS en globals

| Animación | Rol |
|-----------|-----|
| `spin` | Spinner |
| `story-ring-pulse` | Anillo stories |
| `story-heart-pop` | Like burst |
| `skeleton-wave` | Shimmer loading |
| `search-glow-rotate` | Conic border buscador (`@property --search-glow-angle`) |

Dark: `.brand-search-glow` desactiva rotación y usa linear-gradient estático.

---

## Accesibilidad de motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

También reduce transitions del composer / search glow.

---

## Tokens de motion sugeridos para un DS nuevo

| Token | Valor actual de referencia |
|-------|----------------------------|
| `spring.default` | 260 / 20 / 1 |
| `duration.fast` | 200ms |
| `duration.normal` | 280–300ms |
| `duration.slow` | 400–600ms |
| `ease.smooth` | `cubic-bezier(0.16, 1, 0.3, 1)` |
| `ease.composer` | `cubic-bezier(0.34, 1.2, 0.64, 1)` |
| `reduced-motion` | hard disable (o soft: solo opacity) |

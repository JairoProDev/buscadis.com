# 09 — Auditoría: bueno / malo / optimizar / falta / demás

Checklist listo para workshop. Cada ítem está anclado en evidencia de código (ver [10-FUENTES-DE-CODIGO.md](./10-FUENTES-DE-CODIGO.md)).

Leyenda de prioridad sugerida: **P0** bloquea un DS serio · **P1** deuda visible · **P2** higiene.

---

## Lo bueno (conservar / evolucionar)

| # | Hallazgo | Por qué vale | Acción sugerida |
|---|----------|--------------|-----------------|
| G1 | Marca clara celeste + amarillo en CSS + mesh | Identidad reconocible, no purple-genérico | Congelar como tokens oficiales |
| G2 | Escala spacing 4px (`--space-*`) | Base sólida tipográfica/layout | Completar escala (7, 9, 10, 12…) |
| G3 | Dark mode estructural (canvas < surface < elevated) | Buena lógica de elevación | Documentar como surface levels |
| G4 | Utilidades `.brand-*` cohesivas | Lenguaje visual de shell | Migrar a paquete de tokens/utilities |
| G5 | Composer buscar/publicar + CTA amarillo | Firma de producto | Elevar a componente de DS de dominio |
| G6 | 8 categorías semánticas | Modelo de negocio = UI | Unificar hex CSS↔TS |
| G7 | Registry `Icons.tsx` | Camino a icon system | Completar + prohibir imports directos |
| G8 | Spec marketplace (principios + anatomía cards) | Norte de producto bueno | Actualizar hex a marca real |
| G9 | `prefers-reduced-motion` agresivo | A11y motion | Mantener policy |
| G10 | Skins de negocio (presets) | Multi-tenant bien planteado | Separar “Marketplace DS” vs “Storefront DS” |
| G11 | `cn()` + Tailwind | Stack moderno | Seguir |
| G12 | Spring MotionProvider único | Consistencia motion | Formalizar tokens motion |

---

## Lo malo / inconsistente (arreglar antes o al nacer el DS)

| # | Hallazgo | Impacto | Pri |
|---|----------|---------|-----|
| B1 | Brand blue: `#53acc5` (CSS) vs `#38bdf8` (spec + PWA) | Marca rota entre producto y install | **P0** |
| B2 | Brand yellow: `#ffc24a` vs `#fbbf24` (spec) | Idem | **P0** |
| B3 | Categorías empleos/negocios distintos CSS vs TS | Acentos incorrectos según feature | **P0** |
| B4 | `.light-mode` ≠ `:root` light | Dos “lights” distintos | **P1** |
| B5 | Fonts Geist/Outfit declaradas, nunca cargadas + `!important` system | Tipografía “fantasma” | **P1** |
| B6 | Tailwind Luminous Void paralelo casi sin uso | Confusión para el equipo | **P1** |
| B7 | `--brand-blue` (shell) vs `--brand-color` (negocio) | Naming mental split | **P1** |
| B8 | Fallback accent rosa `#ec4899` en algunos perfiles | Rompe amarillo de marca | **P1** |
| B9 | Skip-link shadow usa rgba(56,189,248) | Color legacy sky | **P2** |
| B10 | Dark placeholders de categoría todos `#283038` | Spec pedía por-cat | **P2** |
| B11 | Touch targets header 40px vs spec 44px | A11y | **P2** |
| B12 | Mezcla `slate/zinc/gray` hardcodeado vs CSS vars | Imposible tematizar features | **P1** |

---

## Lo que está de más (candidatos a eliminar o archivar)

| # | Qué | Por qué |
|---|-----|---------|
| X1 | Paleta Tailwind obsidian/graphite/platinum/electric (si se adopta marca CSS) | Segundo sistema muerto |
| X2 | Plugin utilities `.text-gradient` blue→violet, `.mesh-gradient` violet | Choca con regla anti-purple |
| X3 | `logo.svg` ~3MB sin optimizar + `logov2*` sin política clara | Ruido de assets |
| X4 | Spec marketplace con hex incorrectos (o el CSS — hay que elegir) | Documentación contradictoria |
| X5 | Alias legacy `--color-secondary` / `--accent-color` sin doc | Deuda naming |
| X6 | Imports directos `react-icons` fuera del registry | Fragmentación |
| X7 | styled-jsx aislado en 1–2 componentes | Segundo canal CSS |

---

## Lo que falta construir (para un DS profesional)

### Fundamentos
- [ ] Paquete de tokens único (JSON/CSS/TS) versionado  
- [ ] Tipografía decidida y cargada (o system formalizado)  
- [ ] Escala de color semántica: `bg`, `fg`, `border`, `accent`, `danger`, `success`, `warning`  
- [ ] Surface levels documentados (0 canvas → 3 popover)  
- [ ] Radius / shadow / focus tokens unificados  
- [ ] Breakpoints custom alineados al producto (`sm:480` si se quiere)

### Primitivas UI
- [ ] Button, IconButton, Input, Textarea, Select, Checkbox, Switch  
- [ ] Modal, Drawer, Popover, Tooltip, DropdownMenu  
- [ ] Toast system, Badge, Avatar, Tabs, Skeleton, Spinner, EmptyState  
- [ ] Link / Text styles

### Dominio Buscadis
- [ ] AdisoCard (grid/list/feed) como componente de sistema  
- [ ] CategoryAccent / CategoryChip  
- [ ] SearchComposer  
- [ ] PublishCta  
- [ ] AppHeader / MobileTabBar  
- [ ] StorefrontKit (hero variants + chrome) separado del marketplace kit

### Tooling
- [ ] Storybook (o equivalente)  
- [ ] Visual regression  
- [ ] Lint: no hex sueltos / no `react-icons` fuera de registry  
- [ ] Figma library ↔ tokens sync  
- [ ] Guía de contribución DS

---

## Lo que se puede optimizar (sin rehacer todo)

| # | Optimización | Esfuerzo | Valor |
|---|--------------|----------|-------|
| O1 | Unificar categorías en un solo módulo TS → genera CSS vars | Bajo | Alto |
| O2 | Alinear PWA `theme_color` a `#53acc5` (o al hex final) | Bajo | Alto |
| O3 | Actualizar `MARKETPLACE-DESIGN-SPEC.md` hex a producción | Bajo | Alto |
| O4 | Eliminar o cablear Luminous Void (decidir) | Medio | Alto |
| O5 | Cargar fonts o limpiar `fontFamily` Tailwind | Bajo | Medio |
| O6 | Unificar `.light-mode` con `:root` | Bajo | Medio |
| O7 | Comprimir logos SVG/PNG | Bajo | Medio |
| O8 | Extraer `Button`/`Input` mínimos usados en Header/Auth/Publish | Medio | Alto |
| O9 | ESLint rule: ban `from 'react-icons/*'` excepto Icons.tsx | Bajo | Medio |
| O10 | Mapear `glow-*` Tailwind a tokens CSS o viceversa | Medio | Bajo |

---

## Matriz rápida: ¿evolucionar o crear otro DS?

| Pregunta | Señal en Buscadis |
|----------|-------------------|
| ¿Hay identidad visual clara? | **Sí** — celeste/amarillo/mesh |
| ¿Hay tokens únicos? | **Parcial** — CSS bueno, Tailwind paralelo |
| ¿Hay primitivas? | **No** |
| ¿Hay cobertura Storybook? | **No** |
| ¿Specs = código? | **No** |
| ¿Multi-marca / white-label? | **Sí** (negocios) → conviene **Marketplace DS + Storefront theme API** |

**Recomendación de extracto:**  
Usar esta carpeta como **baseline factual**. Construir el DS profesional **en otro lado** con:

1. Tokens canónicos derivados de `globals.css` (no del spec desactualizado)  
2. Primitivas nuevas  
3. Componentes de dominio migrados uno a uno  
4. Storefront theming como capa encima (presets ya existen)

---

## Agenda sugerida de auditoría (2–3 sesiones)

1. **Sesión marca:** congelar hex, PWA, OG, logos (P0 B1–B2)  
2. **Sesión fundamentos:** tipografía, surfaces, categorías (B3–B6)  
3. **Sesión inventario:** priorizar primitivas vs dominio (sección “falta”)  
4. **Kickoff DS externo:** repo/paquete, Figma, owners

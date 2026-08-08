# Extracción del sistema de diseño — Buscadis

> **Fecha de extracción:** 2026-08-07  
> **Propósito:** Documentar el estado real del diseño en código para auditoría y para construir (o reemplazar) un design system profesional fuera de este repo.  
> **Veredicto en una línea:** No existe un design system formal; existen tokens CSS, una config Tailwind paralela, ~265 componentes custom y docs aspiracionales que divergen del código.

---

## Cómo usar esta carpeta

| Doc | Qué responde | Audiencia |
|-----|--------------|-----------|
| [01-VEREDICTO-Y-MAPA.md](./01-VEREDICTO-Y-MAPA.md) | ¿Tenemos DS? Fuentes de verdad, stack, mapa mental | Producto + diseño + eng |
| [02-TOKENS.md](./02-TOKENS.md) | Valores exactos: color, espacio, sombra, radio, categorías | Diseño + eng |
| [03-TIPOGRAFIA.md](./03-TIPOGRAFIA.md) | Fuentes reales vs declaradas, escalas, roles tipográficos | Diseño |
| [04-COLOR-Y-MARCA.md](./04-COLOR-Y-MARCA.md) | Marca, dark mode, categorías, presets de negocio, PWA | Diseño + marca |
| [05-COMPONENTES.md](./05-COMPONENTES.md) | Inventario de UI por dominio, lo que falta como primitivas | Eng + diseño |
| [06-LAYOUT-Y-PATRONES.md](./06-LAYOUT-Y-PATRONES.md) | Chrome, grids, breakpoints, superficies de marca | Diseño + eng |
| [07-ICONOGRAFIA-Y-ASSETS.md](./07-ICONOGRAFIA-Y-ASSETS.md) | Íconos, logos, favicons, OG, demos | Diseño |
| [08-MOTION-Y-THEMING.md](./08-MOTION-Y-THEMING.md) | Framer Motion, keyframes, tema light/auto/dark | Eng + diseño |
| [09-INCONSISTENCIAS-AUDITORIA.md](./09-INCONSISTENCIAS-AUDITORIA.md) | Lo bueno / malo / sobra / falta / optimizar — checklist | Auditoría |
| [10-FUENTES-DE-CODIGO.md](./10-FUENTES-DE-CODIGO.md) | Paths canónicos para clonar o migrar | Eng |

Docs previos relacionados (no reemplazados):

- `docs/MARKETPLACE-DESIGN-SPEC.md` — spec **objetivo** (valores distintos a producción)
- `docs/HEADER-SIDEBAR-REDESIGN.md` — reglas de marca `#53acc5` / `#ffc24a`
- `docs/BUSINESS-EDITOR-REDESIGN.md`, `docs/BUSINESS-PAGE-EVOLUTION-MASTERPLAN.md`

---

## Regla de oro para el equipo

**Código > docs aspiracionales.**  
La verdad de producción está en `app/globals.css` + componentes.  
`MARKETPLACE-DESIGN-SPEC.md` y `tailwind.config.ts` (“Luminous Void”) son sistemas paralelos / no consolidados.

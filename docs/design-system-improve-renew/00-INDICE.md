# Sistema de Diseño Buscadis — v1.0

> **Reemplaza** la carpeta de extracción del 2026-08-07. Aquella era una auditoría del estado real; esta es la definición del estado objetivo, con cada decisión argumentada.
> **Regla de oro anterior:** "código > docs aspiracionales".
> **Regla de oro nueva:** "**tokens > todo**". El código y los docs se derivan del paquete de tokens. Si divergen, el token gana y el código se corrige.

---

## Qué cambia respecto de la extracción

| Antes | Ahora |
|---|---|
| Dos sistemas de color paralelos (CSS vars + Tailwind "Luminous Void") | Uno solo, generado desde `@buscadis/tokens` |
| Tres modos claros distintos (`:root`, `.light-mode`, negocio) | Un modo claro, un modo oscuro, y una capa de tema de tenant |
| Marca sin rampa, usada como color de acción | Rampa completa; identidad y acción separadas |
| Categorías con dos fuentes en conflicto | Una fuente TS que genera las CSS vars |
| Fuentes declaradas y nunca cargadas | Decisión tomada y cargada: system-first + una display |
| 3 familias de íconos mezcladas | Una familia, tamaños tipados |
| Sin primitivas | 18 primitivas con API de variantes |
| Sin gobernanza | Paquete versionado, Storybook, lint, CI de contraste |

---

## Los 15 documentos

| # | Archivo | Responde |
|---|---|---|
| 01 | `01-VEREDICTO-Y-DECISIONES.md` | Diagnóstico y las 24 decisiones fundacionales con su argumento |
| 02 | `02-PRINCIPIOS-INVESTIGACION-Y-USUARIOS.md` | Para quién diseñamos, cómo se comportan, qué leyes de UX aplican |
| 03 | `03-TOKENS.md` | Arquitectura de tokens en 3 capas y valores completos |
| 04 | `04-COLOR-Y-MARCA.md` | Rampas, contraste, categorías, modo oscuro, tema de negocio |
| 05 | `05-TIPOGRAFIA.md` | Decisión tipográfica, escala, roles, números |
| 06 | `06-ICONOGRAFIA-Y-ASSETS.md` | Familia de íconos, tamaños, logos, imágenes |
| 07 | `07-PRIMITIVAS.md` | Las 18 primitivas y su API |
| 08 | `08-COMPONENTES-DE-DOMINIO.md` | AdisoCard, composer, CTA Publicar, chrome, storefront |
| 09 | `09-LAYOUT-Y-PATRONES.md` | Rejillas, breakpoints, densidad, z-index, navegación |
| 10 | `10-MOTION-Y-THEMING.md` | Movimiento y arquitectura de temas multi-tenant |
| 11 | `11-ARQUITECTURA-Y-GOBERNANZA.md` | Paquetes, pipeline, lint, Storybook, versionado, propiedad |
| 12 | `12-AUDITORIA-BACKLOG-Y-MIGRACION.md` | Checklist priorizado y plan de migración por sprints |
| 13 | `13-EXPERIMENTOS-Y-METRICAS.md` | Qué medimos y qué experimentos corren primero |
| 14 | `14-FUENTES-DE-CODIGO.md` | Mapa canónico actualizado y codemods |
| 15 | `15-ACCESIBILIDAD-Y-RENDIMIENTO.md` | Política verificable, presupuestos y puertas de CI |

---

## Cómo se toma una decisión de diseño en Buscadis

Cuatro preguntas, en orden. Si alguna falla, la propuesta se rechaza.

1. **¿Se puede expresar con tokens existentes?** Si necesita un valor nuevo, se justifica en un PR al paquete de tokens, no en un componente.
2. **¿Cumple contraste AA y objetivo táctil?** Verificable automáticamente, no por opinión.
3. **¿Cabe en el presupuesto de rendimiento?** JS, CSS, fuentes e imágenes tienen techo. Ver `15`.
4. **¿Mejora una métrica declarada?** Si no mejora conversión, comprensión, velocidad o accesibilidad, es preferencia personal. Se anota como hipótesis y se prueba. Ver `13`.

**Propiedad:** el sistema tiene un dueño único (tú, hasta que haya equipo). Las excepciones se documentan en el propio PR con fecha de caducidad. Una excepción sin fecha se convierte en deuda permanente.

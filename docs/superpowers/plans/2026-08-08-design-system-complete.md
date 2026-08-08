# Design system — cierre (2026-08-08)

Sprints **1–8** del plan en `docs/design-system-improve-renew/12-AUDITORIA-BACKLOG-Y-MIGRACION.md` están **cerrados**. Este note resume lo enviado y lo que queda como backlog deliberado (sin bloqueo de marca/a11y/SSR).

## Qué se envió

| Área | Entrega |
|---|---|
| Tokens | `@buscadis/tokens` (3 capas), Style Dictionary, contrast gate, preset Tailwind |
| Marca / a11y | Identidad vs acción, CTA Publicar AA, PWA `#53ACC5`, logo-mark &lt;15 KB, header touch 44px |
| Primitivas | `@buscadis/ui` (Button, Icon, inputs, Modal, Toast, feedback…) + Storybook a11y |
| Dominio | AdisoCard anatomía fija, rejilla, restore de scroll/filtros |
| SSR / SEO | Listas crawlables, JSON-LD, `smoke:ssr` en rutas críticas |
| Chrome | Header/nav → **112px** móvil (`--bs-header-height` / `--bs-nav-height`) |
| Storefront | `@buscadis/storefront-kit`, temas de tenant, `smoke:storefront` |
| Higiene | 0× `#ec4899` / `#38bdf8` / `#fbbf24` en `components/`; mesh `background-attachment: scroll`; skeletons/DealClip sin `styled-jsx` |

## Backlog diferido (no bloquea el cierre)

1. **Framer → CSS en filtros** — FilterSectionCard ya usa CSS; migración completa de Motion en filtros queda incremental.
2. **Lucide full migration** — Icon registry en `@buscadis/ui`; muchos `react-icons` / imports sueltos siguen en features (chatbots, publish, etc.).
3. **Home RSC grid hydration** — HTML crawlable listo; pulir hidratación de la grilla home sin flash/double-fetch.
4. **`components/business` → storefront-kit** — kit y contrato existen; mover superficies de negocio al paquete es un refactor aparte.
5. **Residual** — `styled-jsx` en map + chatbots; hex `#3b82f6` en unos pocos perfiles/modales; codemod `slate/zinc/gray` → tokens semánticos.

## Referencias

- Auditoría con columna de estado: `docs/design-system-improve-renew/12-AUDITORIA-BACKLOG-Y-MIGRACION.md`
- Roadmap: `docs/superpowers/plans/2026-08-08-design-system-roadmap.md`
- Planes por sprint: `docs/superpowers/plans/2026-08-08-sprint-{2..8}-*.md`

# Perfil Vivo — P04 Experiencia creador (onboarding + §17)

**Date:** 2026-08-08  
**Status:** Approved  
**Source:** `16-EXPERIENCIA-CREADOR.md`, `06` §17, Sprint 2 DoD (`11`), master P04

## Goal

Un tendero crea solo un perfil publicado y compartible en &lt;15 min (meta mediana &lt;10), lo ve como el cliente en `/v`, se lo envía por WhatsApp, y el panel lo guía con **una** siguiente acción formulada como beneficio.

## Approach

Experiencia creador completa (no panel cosmético): 6 pantallas + puertas de entrada + preview `/v` + §17. IA acelera; no es el camino principal.

## In scope

1. **Puerta 1 — Aviso Buscadis:** prefill &lt;60 s (nombre, categoría, teléfono, ubicación, fotos).
2. **6 pantallas:** qué vendes → nombre/logo → dónde → cuándo → catálogo (fotos + precio S/) → listo (preview `/v` + “Enviármelo por WhatsApp”).
3. **Preview vivo** en `/v/{slug}` (no storefront legacy como destino emocional).
4. **§17 completitud:** score alineado a lo que `/v` muestra; una sola tarea-beneficio.
5. **Autosave** vía APIs existentes; retomar sin regaño.
6. Eventos: `onboarding_paso`, `perfil_publicado`, `completitud_cambiada`.

## Out of scope (P04.1+)

Import Instagram/Google completo, modo voz end-to-end, pipeline LQIP pro, “que lo hagan por mí”, hard cutover `/@`, reordenar módulos avanzado.

## Reuse

| Piece | Verdict |
|-------|---------|
| `createBusinessViaAPI` / `saveBusinessViaAPI` | reuse |
| `computeProfileProgress` / checklist | adapt → score “vivo” + next task |
| `AiProfileBuilder` | secondary door / assist, not shell |
| Catalog `bulk_images` + `uploadProductImage` + `/api/catalog/products` | adapt |
| EditorTopBar → `/v` | reuse |
| Adiso → profile | rewrite |

## DoD

- [x] Flujo 6 pasos publica borrador visible en `/v`
- [x] Puerta aviso → preview confirmable &lt;60 s (`/api/business/from-adiso`)
- [x] Paso catálogo admite ≥10 fotos + precio
- [x] §17: una tarea-beneficio en panel (`CompletitudMeter` / `EditorProgressWidget`)
- [x] “Enviármelo por WhatsApp” con `/v/{slug}`
- [x] Eventos onboarding emitidos (`publish.step_view` / `publish.draft_update`)

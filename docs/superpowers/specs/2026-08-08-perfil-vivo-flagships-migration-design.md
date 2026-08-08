# Migración flagships → Perfil Vivo

**Date:** 2026-08-08  
**Slugs:** `quival`, `villachaco`, `agrilsur`, `cristalimag`, `buscadis`

## Qué se hizo

1. DB: `profile_layout.perfil_vivo_enabled = true` en los 5 (cutover `/@slug`).
2. Bridge: `packages/perfil-vivo/src/bridge/known-businesses.ts` (arquetipo, categoría, ubicación, WA PE).
3. Horarios: soporte array; Agrilsur/Villachaco rellenados si vacíos; Quival WA `51…` + tagline.
4. Smoke: `npx tsx scripts/smoke-perfil-vivo-flagships.ts` · HTTP 200 en `/@{slug}` · `/v/{slug}` → 308 `/@`.

## Arquetipos

| Soft | Arquetipo | Distrito | Catálogo (payload) |
|------|-----------|----------|--------------------|
| quival | retail | Wanchaq | 12 de ~514 |
| villachaco | comida | Echarate | 11 de 16 |
| agrilsur | retail | San Jerónimo | 6 de 39 |
| cristalimag | alto_ticket | Cerro Colorado | 4 de 7 |
| buscadis | retail | Surco | 3 + **8 reseñas** |

## Comparación (quién luce mejor en Perfil Vivo)

Criterios: intención día 1, CTA, catálogo útil, arquetipo distinto, confianza, ubicación/horario.

| Criterio | Mejor |
|----------|--------|
| Catálogo / conversión retail | **Quival** (volumen + peeks reales de ferretería) |
| Marca / storytelling | **Villa Chaco** (comida, chocolate/café, origen claro) |
| Arquetipo “cotizar” | **Cristalimag** (alto_ticket, Arequipa, servicios a medida) |
| Confianza / reseñas | **Buscadis** (único con reseñas hoy) |
| Identidad premium local | **Agrilsur** (destilería, oro, San Jerónimo) |

### Veredicto

- **Mejor demo de venta del Perfil Vivo (retail):** **Quival** — el perfil nuevo se siente completo: estado, catálogo denso, ubicación, FAQ derivadas, CTA WhatsApp.
- **Mejor contraste de arquetipo:** **Cristalimag** (alto_ticket) frente a Quival/Agrilsur retail.
- **Mejor historia de producto:** **Villa Chaco**.
- **Único con prueba social en vivo:** **Buscadis**.

Para pitch en mostrador: abrir **`/@quival`** primero; si el prospecto es servicio/obra, **`/@cristalimag`**.

## Nota deploy

El flag en DB ya está en prod. El enriquecimiento de bridge (arquetipos/ubicación) requiere **deploy del código** actual; hasta entonces prod puede verse con arquetipo retail genérico.

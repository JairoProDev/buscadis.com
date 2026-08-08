# Perfil Vivo Hybrid 3.0 — design freeze

**Fecha:** 2026-08-08  
**Estado:** freeze de composición (sitio compartible + red social ligera)  
**Supersede parcial:** Visual 2.0 en lo que contradiga este doc (tiles, trust, fold, QR).

## Tesis

El Perfil Vivo es *el lugar donde el negocio existe en internet*: híbrido entre perfil social y web de negocio. El dueño debe poder compartirlo con orgullo; el visitante ve oferta/contacto en &lt;5s; Google sigue entendiendo el negocio (SSR, h1, JSON-LD, anclas).

## Decisiones cerradas

| Tema | Decisión |
|------|----------|
| Acciones en fold | **3 tiles**: Llamar · Catálogo/Carta/Servicios · Llegar. Outline/marca. |
| WhatsApp | **Una** primaria saturada: solo barra sticky. No tile WA verde. |
| Trust | **Una línea** tipográfica: `★ 4.3 (4) · Responde ~8 min · …`. No rejilla `.pv-stats`. Declaradas más suaves que verificadas. |
| Estado | **Una** pastilla (abierto / hasta / responde / delivery). No duplicar en hero. |
| Hero | Portada ~210px + logo circular solapado + nombre 1 línea + ✓ opcional + eslogan 1 línea + meta `rubro • ciudad`. Sin dirección larga ni abierto en hero. |
| Fold order | `hero → metricas → estado → acciones → novedades → catálogo/servicios…` |
| Stories | Solo con datos (≥2 fotos → rings). Visor: progress, tap izq/der, CTA WA. |
| Storefront | Header `Ver los N →`; precio `--ts-precio-lg`; CTA Consultar/Pedir; sheet con `history.pushState` (back cierra). |
| Menú ⋮ | Compartir + copiar + campanita local. **Sin QR** en perfil público (D10). |
| Pie | `PieDeConfianza` (Buscadis + actualizado). |
| Root | `data-visual="3"`. |

## No negociables (siguen)

1 CTA sticky · métricas honestas · sin módulos fantasma · scroll único + anclas · SEO/AEO · handoffs `/r/{token}` · LCP · sin stats inventadas · sin bottom nav de app · QR fuera del perfil público.

## Qué no es Hybrid 3.0

- Copiar mockups dark-gold / stats inventadas pixel a pixel.
- Publicadis (dominio custom / multipágina corporativa).
- Más chips/tags/badges en el hero.

## Criterio de éxito

Dueño: “esto lo paso por WA”. Visitante: oferta o historia casi sin scrollear. Checklist QA: presumible + conversión + LCP + SEO (1 h1, JSON-LD, anclas estables) en `/v/demo`, `/v/demo-comida`, `/@quival`, `/@villachaco`.

## QA smoke (2026-08-08)

| URL | HTTP | Fold | Notas |
|-----|------|------|-------|
| `/v/demo` | 200 | trust→estado→acciones→novedades→catálogo | rings + Ver los N + `data-visual=3` |
| `/v/demo-comida` | 200 | igual (sin rings: &lt;2 fotos) | Pedir CTA |
| `/@quival` | 200 | sin novedades (sin datos) | trust + pie + 1 h1 + JSON-LD |
| `/@villachaco` | 200 | sin novedades | idem |

Checks comunes: sin QR en menú ⋮, pie Buscadis, acciones ×3, WA solo sticky.

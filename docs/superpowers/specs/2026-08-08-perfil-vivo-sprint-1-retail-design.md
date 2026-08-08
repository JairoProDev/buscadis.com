# Perfil Vivo — Sprint 1 Retail Nucleus Design (P02)

**Date:** 2026-08-08  
**Status:** Approved (continue from Master)  
**Depends on:** P01 Sprint 0 Foundation  
**Source:** `04` A, `06` §1–4,§7,§12–15, `07`, `09` handoff, Sprint 1 in `11`

## Goal

Ship a **full Retail profile** on `/v/demo` (and `/v/{slug}` via bridge when data exists): hero, metrics, live state, actions + sticky bar, featured catalog with product sheet, location/hours/payments, channels — all wired through measured handoff `/r/{token}`.

DoD (from `11` Sprint 1): real-feeling Retail profile, WhatsApp share with contextual message via `/r/`, first action visible without scroll on 375×667, LCP discipline preserved.

## Architecture

```
PerfilPayload = Negocio + productos[] + metricas? + estadoVivo + horario?
RenderizadorModulos(payload) → modules from registry
Handoff: buildHandoffUrl() → /r/{token} → 302 → wa.me|tel:|maps
```

- Token: base64url(JSON payload) + HMAC-SHA256 signature (secret `PERFIL_VIVO_HANDOFF_SECRET` or fallback for demo).
- Event log Sprint 1: server `console` + optional in-memory ring buffer; schema ready for `handoff_redirigido`.
- Catalog: SSR first 8–12 products in HTML; sheet is client (`ProductoSheet`).
- Map: static placeholder image / OSM static URL — **no Google iframe** on critical path.
- JSON-LD: `LocalBusiness` + `Product` for featured items on `/v/demo`.

## Module behavior (Retail filled)

| Module | Filled behavior |
|--------|-----------------|
| Hero | Cover 150px + logo 64 + name + category·district + verification seal (tappable stub) |
| Metricas | Verified line (rating if any / “En Buscadis desde…”) + up to 2 declared muted |
| Estado | Open/closed from horario America/Lima; pulse if open; optional response median if provided |
| Acciones | Secondary row: Call, Directions, Catalog; primary sticky WA via `/r/` |
| Catalogo | Peek carousel 156px cards, price mono, one badge max; sheet with “Preguntar por este producto” |
| Ubicacion+Horario | Stacked full width; today line + accordion week |
| Pago | Logo grid 56×36 |
| Canales | Icon row (web + redes) |

## Out of scope (P02)

- Editor/onboarding (P04), reviews capture (P10), QR in public profile, cutover P03, Redis live counters, real median from DB (fixture may supply `respuestaMedianaMin`).

## Acceptance

- [ ] `/v/demo` shows catalog (≥3 products) with prices
- [ ] WA / Call / Maps links go through `/r/{token}` and 302
- [ ] Product sheet opens without full navigation
- [ ] Horario drives estado vivo
- [ ] JSON-LD present in HTML
- [ ] Empty catalog still hides module (regression from P01)

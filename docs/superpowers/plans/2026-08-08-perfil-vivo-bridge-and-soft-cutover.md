# Perfil Vivo Soft Cutover + Bridge Implementation Notes

**Goal:** Real catalog on `/v/{slug}`, polish Retail UX, opt-in via `?vivo=1`.

## Files

- `packages/perfil-vivo/src/bridge/build-payload.ts` — hours, products, enrich
- `app/v/[slug]/page.tsx` — loads catalog via `getBusinessCatalog`
- `middleware.ts` — `/@slug?vivo=1` → `/v/slug`
- `BarraSecciones.tsx`, Hero verification sheet, Acciones icons

## Verify

```bash
curl -sS 'http://127.0.0.1:3000/v/demo' | rg 'Cemento Sol|/r/'
# Real slug (if exists):
curl -sS -o /dev/null -w '%{http_code}' 'http://127.0.0.1:3000/@some-slug?vivo=1'
```

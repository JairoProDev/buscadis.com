# Perfil Vivo — Soft Cutover P03 (opt-in)

**Date:** 2026-08-08  
**Status:** Partial — preview opt-in only  
**Depends on:** P02 Retail nucleus

## Decision

Full canonical cutover of `/@slug` → Perfil Vivo is **deferred** until real businesses look better on `/v` than on the legacy storefront (catalog bridge + polish). Premature cutover would regress production.

## Shipped in this wave

1. **Bridge real data:** `buildPerfilPayloadFromSources` maps `business_profiles` + `catalog_products` → `PerfilPayload` (horario, redes, productos, módulos Retail).
2. **Soft opt-in:** `/@slug?vivo=1` rewrites to `/v/{slug}` (middleware). Legacy `/@slug` unchanged.
3. **UX polish:** sticky section bar, verification explain sheet, icon acciones.

## Still required for hard P03

- [ ] Owner toggle `perfil_vivo_enabled` on `business_profiles`
- [ ] Middleware: if flag, rewrite `/@` → `/v` without query
- [ ] Canonical URL + `robots` index on cutover; `noindex` on `/v` duplicates OR reverse
- [ ] 308 `/v/{slug}` → `/@{slug}` after cutover for opted-in
- [ ] Analytics parity with legacy page

## How to preview a real business

```
https://buscadis.com/@{slug}?vivo=1
https://buscadis.com/v/{slug}
```

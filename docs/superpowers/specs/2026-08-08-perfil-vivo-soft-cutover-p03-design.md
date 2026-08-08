# Perfil Vivo — Soft→Hard Cutover P03

**Date:** 2026-08-08  
**Status:** Hard cutover opt-in + threshold ops shipped  
**Depends on:** P02 Retail + bridge + P11 modules

## Decision

Canonical URL stays **`/@{slug}`**. Opted-in businesses serve Perfil Vivo HTML at that URL. Preview `/v/{slug}` remains for non-opted and `demo`; opted-in get **308** `/v` → `/@`.

## Flag

Stored in `profile_layout.perfil_vivo_enabled` (no DB migration).  
Env override: `PERFIL_VIVO_ENABLED_SLUGS=slug1,slug2`.  
Hard cutover global: `PERFIL_VIVO_HARD_CUTOVER=1` (legacy público off).  
Threshold: `PERFIL_VIVO_HARD_CUTOVER_THRESHOLD=0.6` + cron `GET /api/cron/perfil-vivo-cutover-check`.

Toggle: editor → hub **Confianza** → “Perfil Vivo”.

## Behavior

| Surface | Opted-in / hard | Not opted-in |
|---------|-----------------|--------------|
| `/@slug` public | Perfil Vivo (indexable if published) | Legacy storefront |
| `/@slug?edit=true` | Legacy editor | Legacy editor |
| `/@slug?vivo=1` | rewrite `/v` (middleware) | rewrite `/v` |
| `/v/slug` | 308 → `/@slug` | Preview `noindex` |

## Edge middleware

- Cohort env / hard cutover → header `x-perfil-vivo: 1` on rewrite a `/negocio/{slug}`.
- Page sigue usando `isPerfilVivoEnabled` (hard | env | layout).

## Cohort

- Toggle por negocio en Confianza → Perfil Vivo (`profile_layout.perfil_vivo_enabled`)
- Override cohort: `PERFIL_VIVO_ENABLED_SLUGS=slug1,slug2` (no se puede apagar desde el toggle)
- `perfilVivoEnableSource(profile)` → `hard` | `env` | `layout` | `off`
- Cuando el cron diga `ready: true`, ops activa `PERFIL_VIVO_HARD_CUTOVER=1`

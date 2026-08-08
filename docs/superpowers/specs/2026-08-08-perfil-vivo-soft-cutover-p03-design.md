# Perfil Vivo — Soft→Hard Cutover P03

**Date:** 2026-08-08  
**Status:** Hard cutover opt-in shipped  
**Depends on:** P02 Retail + bridge + P11 modules

## Decision

Canonical URL stays **`/@{slug}`**. Opted-in businesses serve Perfil Vivo HTML at that URL. Preview `/v/{slug}` remains for non-opted and `demo`; opted-in get **308** `/v` → `/@`.

## Flag

Stored in `profile_layout.perfil_vivo_enabled` (no DB migration).  
Env override: `PERFIL_VIVO_ENABLED_SLUGS=slug1,slug2`.

Toggle: editor → hub **Confianza** → “Perfil Vivo”.

## Behavior

| Surface | Opted-in | Not opted-in |
|---------|----------|--------------|
| `/@slug` public | Perfil Vivo (indexable if published) | Legacy storefront |
| `/@slug?edit=true` | Legacy editor | Legacy editor |
| `/@slug?vivo=1` | rewrite `/v` (middleware) | rewrite `/v` |
| `/v/slug` | 308 → `/@slug` | Preview `noindex` |

## Still later

- Edge middleware flag without page-level branch (optional)
- Analytics parity dashboard full P14
- Remove legacy storefront when cohort &gt; threshold

## Cohort

- Toggle por negocio en Confianza → Perfil Vivo (`profile_layout.perfil_vivo_enabled`)
- Override cohort: `PERFIL_VIVO_ENABLED_SLUGS=slug1,slug2` (no se puede apagar desde el toggle)
- `perfilVivoEnableSource(profile)` → `env` | `layout` | `off`

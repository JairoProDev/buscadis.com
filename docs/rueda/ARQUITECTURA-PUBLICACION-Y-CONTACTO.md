# Arquitectura: publicación y contacto (Rueda → Buscadis)

Este documento describe el flujo **listo para operar** sin publicar masivamente hasta que el equipo lo autorice.

## Capas

| Capa | Ubicación | Rol |
|------|-----------|-----|
| PDFs | `../ads/archive/editions/` | Fuente legal/editorial |
| Páginas | `../ads/archive/pages/R####-…/` | QA por página |
| Extracción | `output/rueda/R####/avisos.json` | Catálogo local (no web) |
| Catálogos equipo | `catalogo-avisos-historico-completo.csv`, `catalogo-avisos-reciente-R2747-en-adelante.csv` | Trabajo sin PDF |
| Manifest | `data/rueda/manifest.json` | `batch_id`, fechas, archivo PDF |
| Import | `scripts/rueda/import-edition.ts` | Inserta en Supabase **inactivos** |
| Go-live | `lib/rueda/go-live.ts`, `go-live-loop.ts` | Activa según `scheduled_go_live_at` |
| Reclamo | `/reclamar/[token]` | Anunciante toma ownership |
| CRM | `lib/comercial/rueda-sync.ts` | Oportunidades comerciales |
| Contacto | `contacto-anunciantes-R####-LISTO.csv` | WhatsApp con URLs reales |

## Identificadores

- **batch_id:** `rueda-R2766-claimable-2026-10-05` (desde `fecha_inicio` del manifest).
- **import_key:** único por aviso dentro de la edición (dedupe en import).
- **claim_token:** en `private_data`; enlace `/reclamar/{token}`.

Config por defecto: `data/rueda/publish-defaults.json`.

## Pipeline por edición

```bash
# 1. Calidad
npx tsx scripts/rueda/preflight-edition.ts --edicion=R2766

# 2. Orquestación (dry-run import)
npx tsx scripts/rueda/publish-edition.ts --edicion=R2766

# 3. Producción (solo cuando el equipo apruebe)
npx tsx scripts/rueda/publish-edition.ts --edicion=R2766 --apply --start-in-minutes=60

# 4. Activación gradual (1/min por defecto)
npx tsx scripts/rueda/go-live-loop.ts --edicion=R2766
# o: RUEDA_ACTIVE_BATCH_ID=rueda-R2766-claimable-... npx tsx scripts/rueda/go-live-loop.ts
```

Tras `--apply`, `publish-edition` genera:

- `output/rueda/R2766/informe-pre-publicacion-R2766.json`
- `output/rueda/R2766/contacto-anunciantes-R2766-LISTO.csv`
- Backfill CRM vía `post-import-edition.ts`

Antes del import: `contacto-anunciantes-R####-PRE-import.csv` (URLs placeholder).

## Estado en base de datos

Cada aviso importado:

- `esta_activo: false` hasta go-live.
- `private_data.import_pipeline: rueda_claimable`
- `private_data.scheduled_go_live_at` escalonado.
- `private_data.noindex_until_claimed: true` (SEO hasta reclamo).

## Admin

- `data/rueda/active.json` — edición activa para backfill en `/admin/comercial`.
- Tras import, sincronizar oportunidades con el `batch_id` de la edición.

## Huecos conocidos

- **R2760:** sin PDF en WordPress actual; ver `publish-defaults.json` → `gaps`.
- PDFs antes renombrados con `canonicalize-recovered-editions.ts` (portada).

## Relacionado

- `PROTOCOLO.md`, `RUNBOOK-QA.md`, `SCHEMA-AVISO.md`
- `CHECKLIST-PRE-PUBLICACION.md`
- `docs/comercial/` — plantillas WhatsApp

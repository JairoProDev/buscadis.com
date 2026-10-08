# Progreso de implementación — Programa maestro Rueda

**Actualizado:** 2026-10-08

## Completado en esta fase

### Infraestructura y paths
- [x] R-0062 `lib/rueda/paths.ts` (editions, pages, output, Downloads WSL)
- [x] R-0016–R-0018 `inventory-report.ts` → `inventory.json`, `edition-gaps.json`
- [x] R-0035–R-0037 `ingest-from-downloads.ts` (+ ruta explícita Downloads)
- [x] R-0051–R-0055 `split-edition-pages.py` + `split-edition-pages.ts` (**19 ediciones R2747+** partidas)
- [x] R-0123–R-0129 Schema Zod `lib/rueda/schema.ts` + `validate-avisos.ts`
- [x] R-0146–R-0147 `import-edition.ts` + `lib/rueda/import-run.ts`
- [x] R-0148 `import-r2764.ts` → delega a import-edition
- [x] R-0020 backfill `backfill-manifest-from-disk.ts` (**159 entradas** manifest)
- [x] R-0133–R-0137 migración `057_rueda_warehouse.sql` + `load-warehouse.ts`
- [x] R-0215 `rueda-daily-check.ts`
- [x] R-0041 `try-fetch-wordpress-pdf.ts` (R2760 no recuperable en WP actual)
- [x] R-0003–R-0006 RUNBOOKs + SCHEMA + ADQUISICION-PDF
- [x] extract-edition generalizado (`resolveEditionRunContext`, `schema_version`)
- [x] go-live acepta `batchId` / `RUEDA_ACTIVE_BATCH_ID`
- [x] `status-edition.ts`
- [x] `data/rueda/active.json` + admin comercial usa batch activo
- [x] QA paths sin hardcode `/home/jairo...`
- [x] npm scripts `rueda:*` en package.json
- [x] Piloto extracción **R2766**: 398 avisos, **QG-EXTRACT pass** (100% teléfono)
- [x] **Batch R2747–R2766**: 7 906 avisos (luego ampliado)
- [x] **`batch-extract-missing` R2630+**: **68 ediciones**, **~29 587 avisos** en `MASTER-avisos.csv` (solo local, sin OpenAI)
- [x] Política `extraction-policy.ts`: OpenAI **off** por defecto
- [x] Por edición: `avisos.csv`, `avisos-enumerados.txt`, `avisos.json`
- [x] `export-master-catalog.ts`, `batch-extract-recent.ts`

### Datos
- [x] PDFs nuevos en archive desde Downloads: R2635, R2684, R2686, R2687, R2690, R2706 (nombres `R####.pdf` — renombrar en siguiente paso)
- [ ] **R2760** — confirmado: URLs WP sep/oct son otras ediciones (SHA R2757/R2765)

## Política almacenamiento (2026-10-08)

- **Pipeline PDF → JSON:** local (`ads` + `output/rueda`).
- **Supabase:** solo publicación web + CRM; warehouse `rueda_*` opcional.
- **Import masivo R2766:** pendiente de OK explícito (capa gratis).

## Pendiente prioritario (siguiente sesión)

- [x] Fechas sesión en manifest (`fix-manifest-fechas`, 148 ediciones) + columnas CSV
- [x] Visión **solo portada** (`--vision-portada`) en R2747–R2766
- [x] `VALIDATION-summary.json` — 19/19 ediciones pasan QG (100% teléfono)
- [x] PDFs sueltos renombrados a `*-recovered.pdf` (normalize-names)
- [ ] Renombrar recovered → nombres con rango exacto (manual/meta PDF si hace falta)
- [ ] Resolver duplicado R2684 (dos archivos Downloads)
- [ ] `extract-edition --vision` en R2766 p1 y páginas imagen
- [ ] `db:migrate` en entorno linked para `rueda_*`
- [ ] `load-warehouse --apply` tras migrate
- [ ] Import staging R2766 (`import-edition --apply`)
- [ ] Epics E6–E7 bbox + size_tier
- [ ] CI `validate-avisos` en GitHub Actions
- [ ] Marcar checkboxes en `PROGRAMA-MAESTRO.md` (lote)

## Comandos rápidos

```bash
npm run rueda:inventory
npm run rueda:daily-check
npx tsx scripts/rueda/extract-edition.ts --edicion=R2766 --vision
npm run rueda:validate -- --edicion=R2766
npm run rueda:import -- --edicion=R2766 --apply
```

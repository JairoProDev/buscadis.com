# Runbook — Ingesta Rueda (lun/jue)

## Local primero, Supabase después

| Paso | ¿Toca Supabase? |
|------|-----------------|
| sync PDF, split, extract, validate | **No** |
| `load-warehouse --apply` | Sí (tablas `rueda_*`, opcional) |
| `import-edition --apply` | Sí (`adisos` + CRM) |

En plan gratis: extraer siempre en local; publicar solo con OK de ops.

## Antes de empezar

- `RUEDA_EDITIONS_DIR` apunta a `../ads/archive/editions` (o ruta absoluta).
- Python: `pip install -r requirements-rueda.txt`
- Revisar si WordPress ya actualizó `revista.pdf` (no confiar solo en la URL).

## 1. Descargar edición nueva

```bash
npx tsx scripts/rueda/sync-wordpress-pdf.ts \
  --edicion=R2767 --rango=Oct8-10 --fechas=2026-10-08..2026-10-10 --apply
```

Si el script avisa **mismo SHA que edición anterior**, esperar a que WP publique el PDF nuevo.

## 2. PDFs sueltos en Downloads (Windows)

```bash
npm run rueda:ingest-downloads -- --apply
```

## 3. Inventario

```bash
npm run rueda:inventory
npm run rueda:manifest-backfill -- --apply
```

## 4. Partir páginas

```bash
npx tsx scripts/rueda/split-edition-pages.ts --edicion=R2767
# o recientes:
npx tsx scripts/rueda/split-edition-pages.ts --all-recent
```

## 5. Extracción

```bash
npx tsx scripts/rueda/extract-edition.ts \
  --edicion=R2767 --batch=rueda-R2767-claimable-2026-10-08 --fecha=2026-10-08
```

Sin `--vision`: extracción local. OCR opcional: `--ocr`. OpenAI solo con `RUEDA_USE_OPENAI=1`.

## 6. Validación (QG-EXTRACT)

```bash
npm run rueda:validate -- --edicion=R2767
```

Revisar `output/rueda/R2767/revision.csv` si falla o hay muchos `requiere_revision`.

## 7. Import (staging primero)

```bash
npm run rueda:import -- --edicion=R2767
npm run rueda:import -- --edicion=R2767 --apply
```

## 8. Go-live

```bash
export RUEDA_ACTIVE_BATCH_ID=rueda-R2767-claimable-2026-10-08
npx tsx scripts/rueda/go-live-loop.ts
```

## 9. CRM

```bash
npx tsx scripts/comercial/backfill-rueda-opportunities.ts --batch=rueda-R2767-claimable-2026-10-08
```

## Check diario

```bash
npm run rueda:daily-check
```

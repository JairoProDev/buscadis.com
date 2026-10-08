# Runbook — QA extracción Rueda

## Quality gates

| Gate | Comando | Criterio |
|------|---------|----------|
| **QG-SPLIT** | inspección `ads/archive/pages/R####-*/meta.json` | `page_count` = PDF |
| **QG-EXTRACT** | `npm run rueda:validate -- --edicion=R####` | ≥92% con teléfono 9 dígitos; &lt;3% `multi_inicio` |
| **Schema** | validate-avisos (Zod) | Sin errores de schema |

## QA por páginas partidas (legacy pdf-parse)

```bash
npx tsx scripts/qa-extraccion-rueda.ts --ediciones=R2766 --paginas=2-8
```

Reportes en `../ads/reports/qa-extraccion/`.

## Revisión humana obligatoria

1. Página **1** (portada / diseño).
2. Top 20 `score` bajo en `revision.csv`.
3. Páginas con discrepancia visión vs texto (log `[vision]`).
4. Muestra aleatoria 5%.

## Si QG falla

- Añadir `--vision` o `--ocr` en extract.
- Ajustar heurísticas en `lib/extraer-anuncios-rueda.ts`.
- Escalar a segmentación bbox (épica E6 en PROGRAMA-MAESTRO).

## Métricas guardadas

- `output/rueda/R####/metrics.json` tras validate.

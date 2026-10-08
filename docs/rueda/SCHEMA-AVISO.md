# Schema — avisos Rueda (`avisos.json`)

**Versión:** `schema_version: 1` (constante `RUEDA_AVISO_SCHEMA_VERSION`)

## Raíz

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `schema_version` | number | Versión del contrato |
| `edicion` | string | Ej. `R2766` |
| `batch_id` | string | `rueda-R2766-claimable-YYYY-MM-DD` |
| `fecha_publicacion_original` | string | ISO date |
| `pdf` | string | Ruta absoluta al PDF fuente |
| `extracted_at` | string | ISO datetime |
| `total_paginas` | number | |
| `total_avisos` | number | |
| `por_pagina` | `{pagina,count}[]` | |
| `avisos` | array | Ver abajo |

## `avisos[]`

| Campo | Tipo | Notas |
|-------|------|-------|
| `import_key` | string | Único; base para dedupe |
| `pagina` | number | 1-based |
| `titulo` | string | Sin teléfonos |
| `descripcion` | string | Copy publicable |
| `texto_raw` | string | **Inmutable** (revista) |
| `telefonos` | string[] | 9 dígitos Perú |
| `categoria` | string | Taxonomía Buscadis |
| `ubicacion` | string | |
| `requiere_revision` | boolean | QA humano |
| `score` | 0–100 | Calidad heurística |
| `issues` | string[] | ej. `multi_inicio` |

Validación: `npx tsx scripts/rueda/validate-avisos.ts --edicion=R####`

Implementación Zod: `lib/rueda/schema.ts`

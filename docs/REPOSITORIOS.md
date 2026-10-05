# Repositorios y qué va en cada uno

## `buscadis.com` (app + automatización)

**Sí debe ir aquí:** código Next.js, Supabase migrations, scripts operativos (`scripts/rueda`, `scripts/clientes`, `scripts/comercial`), documentación de proceso (`docs/`), manifiestos ligeros (`data/rueda/manifest.json`), assets pequeños de producto.

**No conviene versionar aquí (o solo con Git LFS):**

- PDFs completos de Rueda (cientos de MB acumulados)
- Extracciones masivas (`output/rueda/*` — ya en `.gitignore`)
- Secretos (`.env.local`)

**Está bien** tener `docs/clientes/` con CASOs, flyers JPG razonables y scripts de publicación: son parte del flujo ops y pesan poco frente a los PDFs.

## `ads` (archivo histórico Rueda)

Los PDFs nombrados viven en:

`/home/jairoprodev/proyectos/ads/archive/editions/`

Ejemplos recientes:

| Edición | Archivo | Sesión |
|---------|---------|--------|
| R2765 | `R2765-Oct1-4.pdf` | 1–4 oct 2026 |
| R2766 | `R2766-Oct5-7.pdf` | 5–7 oct 2026 |

`buscadis.com` apunta ahí con `RUEDA_EDITIONS_DIR` (por defecto `../ads/archive/editions`).

Mantén **git** en `ads` para respaldo del archivo; en `buscadis.com` para historial de producto y pipelines.

## Vectorify (futuro)

Mismo criterio: repo de producto + repo(s) de datos pesados o multi-tenant; `lib/comercial` portable entre ambos.

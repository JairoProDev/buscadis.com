# Programa maestro — Rueda de Negocios → Buscadis

**Versión:** 1.0  
**Fecha:** 2026-10-08  
**Estado:** En implementación — ver [`IMPLEMENTACION-PROGRESO.md`](./IMPLEMENTACION-PROGRESO.md)  
**Propietario sugerido:** Ops + ingeniería Buscadis  

**Documentos relacionados:** `PROTOCOLO.md`, `../REPOSITORIOS.md`, `../comercial/PRECIOS-RUEDA-NEGOCIOS.md`, `../comercial/ARQUITECTURA.md`, `data/rueda/manifest.json`

---

## Cómo usar este documento

1. Cada tarea tiene ID **`R-####`** y checkbox **`- [ ]`** para marcar en Git o en Notion.
2. **Hitos (H-*)** agrupan tareas; un hito no se cierra sin pasar el **quality gate** asociado (**QG-*).
3. **Sprints** son bloques de 1–2 semanas; el orden importa en las fases 0–4.
4. Las tareas marcadas **(manual)** requieren humano; **(auto)** deben terminar en script/CI.

---

## 1. Visión, objetivos y métricas norte

### 1.1 Visión

Convertir cada aviso de Rueda de Negocios en un **activo digital en Buscadis**: datos estructurados, publicación con alcance, cuenta reclamable y camino comercial — hasta que el anunciante prefiera Buscadis sobre la revista impresa.

### 1.2 Objetivos por horizonte

| Horizonte | Objetivo | Métrica principal |
|-----------|----------|-------------------|
| **30 días** | Cadencia lun/jue sin fallos; 1 edición nueva punta a punta | ≥95% avisos con teléfono; import sin duplicados |
| **90 días** | 12+ ediciones en warehouse; CRM enlazado | Dashboard frecuencia/tamaño por anunciante |
| **180 días** | ≥30% contactados WA abren mensaje; N cuentas reclamadas | Tasa claim / batch |
| **12 meses** | Dominio Rueda Cusco; playbook segunda revista | Ingresos atribuidos pipeline Rueda |

### 1.3 Principios de producto (no negociables)

- **Alcance > perfección de matching** en clasificación.
- **Contacto vía Buscadis** en publicación (no replicar “llama directo” en copy optimizado).
- **`texto_raw` inmutable**; mejoras en campos derivados.
- **No citar precios Rueda** al prospecto (política comercial existente).

---

## 2. Blueprint técnico (estado objetivo)

```
WordPress (revista.pdf)
        │
        ▼
┌───────────────────┐     ┌─────────────────────┐
│ ads/archive/      │     │ data/rueda/         │
│ editions/*.pdf    │────▶│ manifest.json       │
└─────────┬─────────┘     │ inventory.json (nuevo)│
          │               └─────────────────────┘
          ▼
┌───────────────────┐
│ ads/archive/pages │
│ R####-*/pNN.{pdf,png}
└─────────┬─────────┘
          ▼
┌───────────────────┐     ┌─────────────────────┐
│ Extracción        │────▶│ output/rueda/R####/ │
│ texto │ visión │ bbox│     │ avisos.json       │
└─────────┬─────────┘     │ revision.csv        │
          │               │ metrics.json        │
          ▼               └──────────┬──────────┘
┌───────────────────┐              │
│ Supabase          │◀─────────────┘
│ rueda_* + adisos  │
└─────────┬─────────┘
          ▼
┌───────────────────┐     ┌─────────────────────┐
│ Go-live / Feed    │────▶│ CRM + WA + claim    │
└───────────────────┘     └─────────────────────┘
```

---

## 3. Árbol de archivos objetivo (reorganización)

### 3.1 Repositorios

| Repo / ruta | Contenido | Acción planificada |
|-------------|-----------|-------------------|
| `buscadis.com` | Código, manifiesto ligero, docs | Consolidar scripts bajo `scripts/rueda/` |
| `ads/archive/editions` | PDF completos | Fuente de verdad binaria |
| `ads/archive/pages` | Páginas partidas | Completar hueco R2747+ |
| `adisos-processing` | Legacy Magazines | Inventariar; fusionar o archivar |
| Windows `Downloads` | PDFs sueltos | Ingesta única → `editions` + renombrar |

### 3.2 Estructura objetivo en `buscadis.com`

```
docs/rueda/
  PROGRAMA-MAESTRO.md          ← este archivo
  PROTOCOLO.md                 ← operación día a día (actualizar al cerrar H-01)
  RUNBOOK-INGESTA.md             ← nuevo: lun/jue paso a paso
  RUNBOOK-QA.md                  ← nuevo: gates y umbrales
  SCHEMA-AVISO.md                ← nuevo: contrato JSON
  ADQUISICION-PDF.md             ← nuevo: WP, Downloads, Wayback

data/rueda/
  manifest.json
  inventory.json                 ← nuevo: scan filesystem + gaps
  edition-gaps.json              ← nuevo: R#### faltantes + estrategia

lib/rueda/
  editions.ts
  extract/                       ← nuevo: modularizar
    segment-bbox.ts              ← futuro
    pipeline.ts
  import-edition.ts              ← generalizar import-r2764

scripts/rueda/
  sync-wordpress-pdf.ts
  inventory-report.ts            ← nuevo
  split-edition-pages.ts         ← nuevo
  extract-edition.ts
  import-edition.ts              ← renombrar/generalizar
  qa-edition.ts                  ← unificar qa-extraccion-rueda
  ingest-from-downloads.ts       ← nuevo (WSL path)

output/rueda/                    ← gitignored, local/CI artifact
```

---

## 4. Inventario actual (línea base 2026-10-08)

### 4.1 PDFs en `ads/archive/editions`

- **151** archivos, ediciones **R2518–R2766**.
- **98** números de edición sin archivo (huecos históricos).
- **Hueco reciente:** **R2760** (entre R2759 y R2761).
- **Manifiesto** (`manifest.json`): solo **R2764, R2765, R2766** (desalineado con disco).

### 4.2 Páginas partidas (`ads/archive/pages`)

- Existen carpetas para ediciones **hasta ~R2683** (aprox.).
- **No hay** carpetas para **R2747–R2766** → QA `qa-extraccion-rueda.ts` no aplica a recientes sin split.

### 4.3 PDFs en Windows Downloads (WSL `/mnt/c/Users/jairo/Downloads`)

**Ediciones que NO están en `ads/archive` (por número):**

| Edición | Archivo(s) en Downloads | Notas |
|---------|---------------------------|--------|
| R1660 | `R1660-sep-11-14.pdf` | Histórico; validar si entra en alcance |
| R2635 | `R2635-Junio12-15.pdf` | Cierra hueco R2635–R2657 parcial |
| R2684 | `R2684-Dic4-7.pdf`, `R2684-Dic8-10.pdf` | **Duplicado conflicto** — comparar SHA |
| R2686 | `R2686-Dic11-14.pdf` | |
| R2687 | `R2687-Dic15-17.pdf` | |
| R2690 | `R2690-Dic29-4Ene.pdf` | |
| R2706 | `R2706-Feb26-Mar01.pdf` | |

**Referencias útiles:** `rueda-precios.pdf` → alinear con `docs/comercial/PRECIOS-RUEDA-NEGOCIOS.md`.

### 4.4 Deuda técnica conocida (fallas / riesgos)

| ID | Falla | Impacto | Mitigación planificada |
|----|-------|---------|------------------------|
| F-01 | `RUEDA_R2764_*` hardcodeado en import/go-live/status | No escala a nuevas ediciones | Generalizar batch por CLI |
| F-02 | WordPress reutiliza URL `revista.pdf` | Sobrescribir edición equivocada | SHA + warning (ya parcial) |
| F-03 | Texto PDF multi-columna | Fusiones / cortes | Column extract + bbox futuro |
| F-04 | Anuncios imagen (portada, diseño) | Teléfonos no buscables | Visión selectiva (existe) |
| F-05 | Sin `size_tier` / precio estimado | Sin BI de gasto Rueda | Segmentación + tabla tarifas |
| F-06 | `manifest` incompleto | Ops no sabe qué falta | `inventory-report` |
| F-07 | `output/rueda` vacío en workspace | Sin artefacto reproducible | Pipeline CI local documentado |
| F-08 | `qa-extraccion-rueda` usa `pdf-parse` en páginas; `extract-edition` usa PyMuPDF | Métricas inconsistentes | Unificar stack QA |
| F-09 | Ediciones recientes sin `archive/pages` | QA por página imposible | Sprint split masivo reciente |
| F-10 | R2684 dos PDFs en Downloads | Edición ambigua | Regla: cabecera PDF + SHA |
| F-11 | Tablas `rueda_*` solo en doc | Sin historial anunciante | Migración Supabase |
| F-12 | `ai-polish` no integrado por defecto en extract | Copy no optimizado | Flag `--polish` + campos |
| F-13 | Recurrente solo intra-edición | No detecta semanal/mensual | Warehouse + advertiser_key |
| F-14 | Sin prueba automática de conteo teléfonos/página | Regresiones silenciosas | Golden files por página |
| F-15 | Repo `adisos-processing` paralelo | Duplicación de esfuerzo | Auditoría y deprecación |

---

## 5. Quality gates (QG)

| Gate | Cuándo | Criterios mínimos (ajustables) |
|------|--------|--------------------------------|
| **QG-INGEST** | Tras guardar PDF | SHA registrado; nombre `R####-...pdf`; manifest actualizado; `page_count` logueado |
| **QG-SPLIT** | Tras partir páginas | `N` archivos = `page_count`; cada página &gt; 0 bytes; muestra visual p1 y p8 OK |
| **QG-EXTRACT** | Antes de import | ≥92% avisos con ≥1 teléfono 9 dígitos; &lt;3% `multi_inicio`; revisión manual 100% items `requiere_revision` |
| **QG-IMPORT** | Tras dry-run | 0 duplicados `import_key`; categorías válidas; ubicación no genérica masiva |
| **QG-GOLIVE** | Antes de activar batch | Cron probado; límites free tier; claim token generado |
| **QG-CRM** | Tras backfill | 1 oportunidad por teléfono principal o regla documentada |
| **QG-WA** | Campaña | Plantilla aprobada; no precios Rueda; opt-in donde aplique |

### 5.1 Pruebas recomendadas

- **Unitarias:** `separarAnuncios`, `normalizarTelefonosEnTexto`, `classifyRuedaListing`, `parseUbicacionFromText`.
- **Golden pages:** 10 páginas fijas (portada, INMUEBLES densa, empleos, mix imagen) con JSON esperado (tolerancia en texto).
- **Integración:** `extract-edition` en PDF R2764 → diff contra snapshot aprobado.
- **E2E staging:** import 5 avisos → go-live → visible en feed → claim flow.
- **Regresión manual:** checklist `RUNBOOK-QA.md` por edición.

### 5.2 Revisiones humanas obligatorias

- Portada (página 1) siempre.
- Top 20 peor `score` en `revision.csv`.
- Toda página donde `|teléfonos_visión - teléfonos_texto| > 2`.
- Muestra 5% aleatoria del resto.

---

## 6. Hitos (roadmap)

| Hito | Nombre | Sprint objetivo |
|------|--------|-----------------|
| **H-00** | Gobernanza y documentación | S1 |
| **H-01** | Inventario y archivo PDF completo | S1–S2 |
| **H-02** | Páginas partidas ediciones recientes | S2 |
| **H-03** | Extracción estable + QA | S3–S4 |
| **H-04** | Warehouse Supabase `rueda_*` | S4–S5 |
| **H-05** | Import/go-live multi-edición | S5 |
| **H-06** | CRM + campaña WA v1 | S6 |
| **H-07** | Segmentación bbox + tamaño tarifa | S7–S8 |
| **H-08** | BI + insights comerciales | S8 |
| **H-09** | Automatización lun/jue | S9 |
| **H-10** | Segunda revista Cusco (piloto) | S10+ |

---

## 7. Sprints (calendario sugerido)

### Sprint 1 (S1) — Mapa y archivo

**Objetivo:** Saber qué hay, qué falta, qué mover; manifiesto al día.

### Sprint 2 (S2) — Páginas + ingesta Downloads

**Objetivo:** R2747–R2766 con `archive/pages`; PDFs huérfanos de Downloads en `editions`.

### Sprint 3 (S3) — Extracción y QA unificado

**Objetivo:** R2765 y R2766 con `avisos.json` + pasar QG-EXTRACT.

### Sprint 4 (S4) — Warehouse + histórico selecto

**Objetivo:** Migraciones; cargar 3 ediciones; dedupe anunciante.

### Sprint 5 (S5) — Publicación multi-batch

**Objetivo:** Generalizar import; go-live R2765/R2766 sin hardcode R2764.

### Sprint 6 (S6) — Comercial

**Objetivo:** Backfill CRM; plantillas WA; métricas respuesta.

### Sprint 7–8 (S7–S8) — Precisión (bbox, tamaño)

**Objetivo:** Reducir fusiones &lt;5%; `size_tier` en 80% avisos texto.

### Sprint 9 (S9) — Automatización

**Objetivo:** Cron ingest + alertas; dashboard ops.

### Sprint 10+ (S10+) — Escala y otras revistas

---

## 8. Registro de tareas (checklist)

Convención: **Epic** → tareas **R-0001** …

---

### Epic E0 — Gobernanza, docs, procesos (H-00)

- [ ] R-0001 Definir RACI: quién descarga, quién QA, quién importa, quién WA.
- [ ] R-0002 Aprobar este PROGRAMA-MAESTRO v1.0 con el equipo.
- [ ] R-0003 Crear `docs/rueda/RUNBOOK-INGESTA.md` (lun/jue, comandos, tiempos).
- [ ] R-0004 Crear `docs/rueda/RUNBOOK-QA.md` (gates QG, umbrales, escalación).
- [ ] R-0005 Crear `docs/rueda/SCHEMA-AVISO.md` (contrato JSON v1).
- [ ] R-0006 Crear `docs/rueda/ADQUISICION-PDF.md` (WP, Downloads, Wayback, conflictos).
- [ ] R-0007 Actualizar `PROTOCOLO.md` con referencia a PROGRAMA-MAESTRO y gates.
- [ ] R-0008 Actualizar `docs/REPOSITORIOS.md` con `inventory.json` y `archive/pages` reciente.
- [ ] R-0009 Definir calendario Rueda 2026 (lun/jue, feriados Cusco) en doc.
- [ ] R-0010 Definir política de retención: PDFs forever; PNG opcional; output local 90 días.
- [ ] R-0011 Definir política de costes IA (techo USD/edición; cuándo visión full page).
- [ ] R-0012 Crear plantilla “informe post-edición” (totales, incidencias, conversión).
- [ ] R-0013 Enlazar docs desde `README.md` o `docs/GUIA-PROYECTO-PARA-SOCIOS.md`.
- [ ] R-0014 Definir canal de alertas (Slack/email) para fallo ingest.
- [ ] R-0015 Versionar cambios de schema (`schema_version` en JSON).

---

### Epic E1 — Inventario y manifiesto (H-01)

- [ ] R-0016 Implementar `scripts/rueda/inventory-report.ts` (scan editions + pages).
- [ ] R-0017 Generar `data/rueda/inventory.json` en cada reporte.
- [ ] R-0018 Generar `data/rueda/edition-gaps.json` (lista R#### faltantes).
- [ ] R-0019 Comparar inventory vs `manifest.json`; reportar drift.
- [ ] R-0020 Backfill manifest: entradas R2747–R2763 (fechas desde PDF o nombre).
- [ ] R-0021 Registrar R2760 como `status: missing` con estrategia recuperación.
- [ ] R-0022 Documentar cada hueco histórico grande (R2684–R2734) como baja prioridad/recuperable.
- [ ] R-0023 Añadir campos manifest: `page_count`, `sha256`, `ingested_at`, `source` (wp|downloads|wayback).
- [ ] R-0024 Validar SHA256 de R2764–R2766 contra manifest actual.
- [ ] R-0025 Crear vista admin o script CLI “última edición en disco vs hoy”.
- [ ] R-0026 Detectar PDFs duplicados por SHA (distinto nombre, misma edición).
- [ ] R-0027 Detectar mismo número R#### con SHA distinto (conflicto R2684).
- [ ] R-0028 Regla de resolución conflicto: leer cabecera edición en p1; si empate, manual.
- [ ] R-0029 Inventariar `adisos-processing/Magazines/` vs `ads/archive`.
- [ ] R-0030 Decidir: migrar Magazines → ads o marcar deprecated.
- [ ] R-0031 Listar PDFs en Downloads no-Rueda para no mezclar ingest.
- [ ] R-0032 (manual) Revisar informe inventory con socio/ops.

---

### Epic E2 — Adquisición PDF (H-01)

- [ ] R-0033 Documentar URL canónica WP (`wordpress_revista_url` en manifest).
- [ ] R-0034 Probar descarga HTTP headers (ETag, Last-Modified) para detectar cambios.
- [ ] R-0035 Implementar `ingest-from-downloads.ts` (scan WSL Downloads, match R####).
- [ ] R-0036 Normalizar nombres Downloads → `suggestEditionFilename`.
- [ ] R-0037 (manual) Copiar R2635, R2686, R2687, R2690, R2706 a archive con `--apply`.
- [ ] R-0038 (manual) Resolver R2684: elegir PDF correcto o guardar ambos como `R2684a`/`R2684b` si son sesiones distintas.
- [ ] R-0039 Intentar recuperar R2760 desde WP uploads (`/2026/09/`, `/2026/10/`).
- [ ] R-0040 Intentar Wayback Machine para R2760 y huecos prioritarios.
- [ ] R-0041 Scraping responsable lista `wp-content/uploads/**/revista.pdf` histórico (si legal/ético OK).
- [ ] R-0042 Registrar en manifest cada PDF recuperado con `source`.
- [ ] R-0043 Validar edición leída en p1 coincide con nombre archivo.
- [ ] R-0044 Alertar si edición en PDF ≠ `--edicion` en sync CLI.
- [ ] R-0045 Automatizar extracción metadatos p1: número edición, fechas, región.
- [ ] R-0046 Guardar `rueda-precios.pdf` en `docs/comercial/media/` y verificar tarifas.
- [ ] R-0047 Actualizar PRECIOS-RUEDA si difiere del PDF oficial.
- [ ] R-0048 Política: no commitear PDFs en buscadis.com (solo ads).
- [ ] R-0049 Verificar git LFS en repo ads si el tamaño crece.
- [ ] R-0050 Backup offsite de `ads/archive/editions` (mensual).

---

### Epic E3 — Partir páginas (H-02)

- [ ] R-0051 Implementar `split-edition-pages.ts` (PyMuPDF o pdftk).
- [ ] R-0052 Salida: `ads/archive/pages/R####-Rango/pagina-NN.pdf`.
- [ ] R-0053 Opcional: `pagina-NN.png` @ 150 DPI (alineado con vision).
- [ ] R-0054 Escribir `meta.json` por edición: `page_count`, `split_at`, `sha256_parent`.
- [ ] R-0055 Split masivo R2747–R2766.
- [ ] R-0056 Split ediciones recuperadas Downloads (R2635, R268x, R2706).
- [ ] R-0057 Validar QG-SPLIT en muestra 3 ediciones.
- [ ] R-0058 Documentar ediciones &gt;16 páginas (semana acumulada).
- [ ] R-0059 Script `split-all-missing.ts` desde inventory gaps con PDF presente.
- [ ] R-0060 No re-split si meta.json SHA padre coincide (idempotencia).
- [ ] R-0061 Alinear rutas con `qa-extraccion-rueda.ts` (ARCHIVE constant → config).
- [ ] R-0062 Mover `ARCHIVE` hardcoded a `lib/rueda/paths.ts`.
- [ ] R-0063 Prueba: página INMUEBLES tiene 3 columnas visibles en PNG.
- [ ] R-0064 Limpiar carpetas pages huérfanas (sin PDF padre).

---

### Epic E4 — Extracción texto (H-03)

- [ ] R-0065 Revisar `pdf-pages-text.py` scores en 5 páginas golden.
- [ ] R-0066 Añadir modo `--ncol=4` auto-detect por ancho página.
- [ ] R-0067 Mejorar filtro masthead en `filtrarMetadatos` (nuevos patrones 2026).
- [ ] R-0068 Ampliar `SPLIT_START` con frases vistas en R2764–R2766.
- [ ] R-0069 Reducir falsos `multi_inicio` (tuning FUSION_START).
- [ ] R-0070 Exportar `estructurarAnunciosMaximo` vs `estructurarAnuncios` — documentar cuál es canónico.
- [ ] R-0071 Unificar QA: deprecar `pdf-parse` en qa o alinear con PyMuPDF.
- [ ] R-0072 Crear `scripts/rueda/qa-edition.ts` (--edicion, métricas globales).
- [ ] R-0073 Métrica: teléfonos únicos por página vs benchmark.
- [ ] R-0074 Métrica: distribución `issues` por edición.
- [ ] R-0075 Flag `--ocr` documentado (deps sistema tesseract-spa).
- [ ] R-0076 Perfil de coste: páginas que disparan OCR.
- [ ] R-0077 Guardar `pages.json` crudo por edición en output.
- [ ] R-0078 Detectar páginas casi vacías (solo publicidad gráfica) → forzar visión.

---

### Epic E5 — Visión e imagen (H-03)

- [ ] R-0079 Revisar prompt `pdf-page-vision.ts` (tamaño anuncio, no inventar).
- [ ] R-0080 Añadir al schema visión: `orden_aproximado`, `tiene_logo` (bool).
- [ ] R-0081 Política `visionCandidate()` — log por qué se activó.
- [ ] R-0082 Modo `--vision-all` para auditoría (no producción).
- [ ] R-0083 Reconciliar lista visión vs texto: merge por teléfono.
- [ ] R-0084 Si solo visión tiene aviso → incluir con flag `solo_vision`.
- [ ] R-0085 Si solo texto → flag `solo_texto`.
- [ ] R-0086 Límite tokens: tiling por columna (futuro) — documentar.
- [ ] R-0087 Caché PNG/base64 por página (evitar re-render en re-run).
- [ ] R-0088 Probar portada R2764: contar avisos vs manual.
- [ ] R-0089 Probar anuncio TGI Fridays (tel no buscable en PDF) vía visión.
- [ ] R-0090 Evaluar modelo alternativo (solo si coste/quality no cumple).

---

### Epic E6 — Segmentación bbox (H-07, posterior)

- [ ] R-0091 Investigación: líneas vectoriales PyMuPDF `get_drawings()`.
- [ ] R-0092 Clustering bloques texto por gaps verticales horizontales.
- [ ] R-0093 Definir algoritmo v1 bbox por página columna.
- [ ] R-0094 Export crop PNG por aviso.
- [ ] R-0095 OCR/LLM por crop en lugar de página entera.
- [ ] R-0096 Validar bbox no corta teléfonos al pie del aviso.
- [ ] R-0097 Medir reducción fusiones vs baseline R2764.
- [ ] R-0098 Integrar bbox en `import_key` (opcional hash crop).
- [ ] R-0099 UI interna revisión: mostrar crop + texto lado a lado.
- [ ] R-0100 Golden crops 20 avisos.

---

### Epic E7 — Tamaño, tarifa, creatividad (H-07)

- [ ] R-0101 Tabla mapping altura_px → `size_tier` (económico…9×9).
- [ ] R-0102 Campo `size_tier_estimado` + `confidence` en schema.
- [ ] R-0103 Campo `precio_rueda_estimado_soles` (sin/con radio).
- [ ] R-0104 Flag `incluye_radio` si aparece “RN Radio” en bloque (heurística).
- [ ] R-0105 Flag `tiene_logo` / `tiene_imagen` (visión o % no-texto en bbox).
- [ ] R-0106 Validar muestra 50 avisos vs tarifario PDF.
- [ ] R-0107 No usar precio estimado en mensajes cliente (solo BI interno).
- [ ] R-0108 Dashboard: distribución tiers por edición.

---

### Epic E8 — Clasificación, ubicación, entidades (H-03)

- [ ] R-0109 Auditoría `classify-from-text.ts` vs categorías Buscadis.
- [ ] R-0110 Mapeo explícito subcategoría cuando confianza &gt; umbral.
- [ ] R-0111 Mejorar `parse-ubicacion.ts` (Lima, provincias, “frente a UNSAAC”).
- [ ] R-0112 Campo `vacantes[]` para empleos (ya parcial en extract).
- [ ] R-0113 Detectar `es_empresa` — revisar falsos positivos.
- [ ] R-0114 Extraer emails; normalizar minúsculas.
- [ ] R-0115 Detectar URLs y redes (IG, FB) en texto.
- [ ] R-0116 `advertiser_key`: tel principal normalizado 9 dígitos.
- [ ] R-0117 Nombre comercial heurístico (línea antes de teléfono).
- [ ] R-0118 Integrar `ai-polish` tras extract con `--polish`.
- [ ] R-0119 Guardar `titulo_optimizado`, `descripcion_optimizada` separados.
- [ ] R-0120 Prompt polish: no inventar; diff log en JSON.
- [ ] R-0121 Clasificador LLM fallback si `score` &lt; 50.
- [ ] R-0122 Lista blanca distritos Cusco + Lima turística.

---

### Epic E9 — Salida archivos y schema (H-03)

- [ ] R-0123 `output/rueda/R####/avisos.json` canónico.
- [ ] R-0124 `revision.csv` columnas: id, pagina, score, issues, titulo, teléfonos.
- [ ] R-0125 `metrics.json`: totales, QG pass/fail.
- [ ] R-0126 Export opcional JSONL para DuckDB.
- [ ] R-0127 Export Parquet (fase BI).
- [ ] R-0128 `schema_version: 1` en raíz JSON.
- [ ] R-0129 Validador Zod `RuedaExtractedAd[]` en CI.
- [ ] R-0130 Script `validate-avisos.ts` sin DB.
- [ ] R-0131 Enumeración estable `aviso_id` dentro de edición (p03-012).
- [ ] R-0132 Documentar en SCHEMA-AVISO cada campo y nullability.

---

### Epic E10 — Warehouse Supabase (H-04)

- [ ] R-0133 Migración `rueda_editions`.
- [ ] R-0134 Migración `rueda_listings`.
- [ ] R-0135 Migración `rueda_advertisers`.
- [ ] R-0136 Migración `rueda_advertiser_stats` (vista o tabla materializada).
- [ ] R-0137 Script `load-warehouse.ts` desde avisos.json.
- [ ] R-0138 Idempotencia load por `import_key`.
- [ ] R-0139 Enlace `rueda_listings.adiso_id` tras import.
- [ ] R-0140 Job recompute stats tras cada edición.
- [ ] R-0141 Query: frecuencia publicación por teléfono.
- [ ] R-0142 Query: categoría dominante por anunciante.
- [ ] R-0143 RLS: tablas solo admin/service role.
- [ ] R-0144 Índices: `edicion`, `advertiser_key`, `published_at`.
- [ ] R-0145 Retención GDPR: política teléfonos en warehouse.

---

### Epic E11 — Import y publicación (H-05)

- [ ] R-0146 Renombrar/generalizar `import-r2764.ts` → `import-edition.ts`.
- [ ] R-0147 CLI `--edicion --batch --fecha --avisos=path`.
- [ ] R-0148 Eliminar dependencia de `batch-constants.ts` hardcoded (o deprecar).
- [ ] R-0149 `import_key` único global.
- [ ] R-0150 Dry-run imprime resumen categorías y errores.
- [ ] R-0151 `--missing-only` para reintentos.
- [ ] R-0152 `scheduled_go_live_at` escalonado configurable.
- [ ] R-0153 Claim token por aviso en `private_data`.
- [ ] R-0154 `flyer_template` por categoría (`listing-quality.ts`).
- [ ] R-0155 `hide_generic_location` reglas documentadas.
- [ ] R-0156 Probar import 10 avisos staging.
- [ ] R-0157 Probar import edición completa staging (sin activar).
- [ ] R-0158 Actualizar `go-live.ts` para aceptar `batch_id` parámetro.
- [ ] R-0159 Actualizar `status-r2764.ts` → `status-edition.ts`.
- [ ] R-0160 `dedupe-r2764-batch.ts` → genérico por batch.
- [ ] R-0161 `repair-r2764-batch.ts` → playbook reparaciones documentado.
- [ ] R-0162 `reschedule-go-live.ts` documentado en RUNBOOK.
- [ ] R-0163 API `go-live` route: auth ops.
- [ ] R-0164 Límite activaciones por tick (rate limit).

---

### Epic E12 — Cuentas, claim, perfil negocio (H-05)

- [ ] R-0165 Flujo claim: teléfono OTP (si existe) documentar.
- [ ] R-0166 `ensureRuedaAdvertiserUser` — revisar email internal domain.
- [ ] R-0167 Mensaje claim en WA con link deep link.
- [ ] R-0168 Beneficio reclamar (flyer, 24h, historias) copy aprobado.
- [ ] R-0169 Perfil negocio: campos mínimos post-claim checklist.
- [ ] R-0170 Evitar duplicar usuario si ya registrado manualmente.
- [ ] R-0171 Merge oportunidad CRM si usuario ya existe.
- [ ] R-0172 Política cuenta sin teléfono (solo email) — OPS fallback.

---

### Epic E13 — CRM y comercial (H-06)

- [ ] R-0173 Backfill oportunidades R2764 — verificar completitud.
- [ ] R-0174 Backfill R2765/R2766 tras import.
- [ ] R-0175 Reglas prioridad: empresa, recurrente, score alto.
- [ ] R-0176 Campo oportunidad: `edicion`, `size_tier`, link adiso.
- [ ] R-0177 Integrar `campana-rueda-oct-2026.json` con pipeline vivo.
- [ ] R-0178 Plantillas IA `first_contact`, `follow_up`, `claim_reminder`.
- [ ] R-0179 Registrar actividad WA en CRM tras cada chat manual.
- [ ] R-0180 Import chats `wa-chats/` — proceso repetible.
- [ ] R-0181 Métrica: tiempo primera respuesta.
- [ ] R-0182 Etapa “ganado” → `sales_accounts` + `docs/clientes/`.
- [ ] R-0183 Sync cliente pagado (`paid-client-sync`) enlazado a origen Rueda.
- [ ] R-0184 No mencionar precios Rueda en sugerencias IA (lint prompt).

---

### Epic E14 — WhatsApp y outreach (H-06)

- [ ] R-0185 Revisar `WHATSAPP-BUSINESS.md` vs volumen 500/edición.
- [ ] R-0186 Segmentar envíos (batch 50/día) anti-ban.
- [ ] R-0187 Variantes mensaje A/B (alcance respuesta).
- [ ] R-0188 Link preview optimizado (OG adiso).
- [ ] R-0189 Pedir guardar contacto + emoji nombre negocio.
- [ ] R-0190 Script generar wa.me con texto prefill por aviso.
- [ ] R-0191 Tracking UTM en links claim.
- [ ] R-0192 (futuro) Cloud API envío automatizado con opt-in.
- [ ] R-0193 Lista supresión: quien dijo no molestar.
- [ ] R-0194 Recontacto 7d / 14d reglas.

---

### Epic E15 — Feed, historias, producto (H-05–H-06)

- [ ] R-0195 Verificar FREE_TIER_LIMITS (24h feed, 1h stories) en código.
- [ ] R-0196 Calidad listing publicado: título no truncado raro.
- [ ] R-0197 Imagen cover flyer generada automáticamente.
- [ ] R-0198 Mapa: pin si hay ubicación parseada.
- [ ] R-0199 Buscador: indexación post go-live (`onAdisoSearchIndexUpdate`).
- [ ] R-0200 Historias batch programadas ops.
- [ ] R-0201 Evitar publicar avisos `requiere_revision` sin override manual.
- [ ] R-0202 Admin flag “publicado desde Rueda” en UI intelligence.
- [ ] R-0203 Comparación antes/después polish en página owner preview.

---

### Epic E16 — Analytics e insights (H-08)

- [ ] R-0204 Definir eventos analytics (view, click WA, share, save, claim).
- [ ] R-0205 Taxonomía en `ANALYTICS-TAXONOMY.md` para origen `rueda`.
- [ ] R-0206 Dashboard edición: avisos únicos vs repetidos.
- [ ] R-0207 Estimar gasto Rueda por anunciante (sum tiers).
- [ ] R-0208 Informe semanal automático markdown.
- [ ] R-0209 cohorte: publicó 1x vs 4x en mes.
- [ ] R-0210 Detección “cliente fiel Rueda” para prioridad venta.
- [ ] R-0211 Export CSV para socios (sin PII sensible).
- [ ] R-0212 Integración Metabase/Looker (opcional).

---

### Epic E17 — Automatización y CI (H-09)

- [ ] R-0213 Workflow GitHub Actions: `validate-avisos` + unit tests extract.
- [ ] R-0214 Cron self-hosted o manual lun/jue: recordatorio ingest.
- [ ] R-0215 Script `rueda-daily-check.ts` (último PDF, días desde edición).
- [ ] R-0216 Notificación si WordPress PDF igual SHA &gt;48h post sesión esperada.
- [ ] R-0217 Lock file mientras extract en curso.
- [ ] R-0218 Logs estructurados JSON en `extraccion.log` unificado.
- [ ] R-0219 Rotación logs.
- [ ] R-0220 Secrets: OPENAI en env; nunca en repo.

---

### Epic E18 — Seguridad, legal, ética

- [ ] R-0221 Base legal uso datos listados públicamente en revista.
- [ ] R-0222 Política privacidad: origen Rueda en aviso publicado.
- [ ] R-0223 Derecho oposición / baja si anunciante lo pide.
- [ ] R-0224 No exponer `texto_raw` público si contiene datos sensibles.
- [ ] R-0225 Rate limit APIs ops go-live.
- [ ] R-0226 Auditar `private_data` no filtrado al cliente.

---

### Epic E19 — Deuda técnica y refactors

- [ ] R-0227 Crear `lib/rueda/paths.ts` (editions, pages, output).
- [ ] R-0228 Extraer pipeline de `extract-edition.ts` a `lib/rueda/pipeline.ts`.
- [ ] R-0229 Tests unitarios `extraer-anuncios-rueda.ts` (vitest).
- [ ] R-0230 Golden tests 15 snippets fusión conocidos.
- [ ] R-0231 Deprecar scripts sueltos QA duplicados.
- [ ] R-0232 ESLint: no paths absolutos `/home/jairo...` en scripts.
- [ ] R-0233 `qa-extraccion-rueda.ts` usar `RUEDA_EDITIONS_DIR`.
- [ ] R-0234 Documentar deps Python en `requirements-rueda.txt`.
- [ ] R-0235 Docker opcional reproduce extract (dev onboarding).
- [ ] R-0236 Unificar `lib/comercial/rueda-sync.ts` con warehouse.

---

### Epic E20 — Enrichment anunciante (post-MVP)

- [ ] R-0237 Búsqueda web por nombre + tel (manual/automatizado).
- [ ] R-0238 Campo `enrichment_notes` en CRM.
- [ ] R-0239 Validar RUC si aparece en aviso.
- [ ] R-0240 Mapa Google/OSM geocode referencia (con cache).
- [ ] R-0241 Detectar cadena (mismo copy, distintos teléfonos).

---

### Epic E21 — Otras revistas Cusco (H-10)

- [ ] R-0242 Inventario revistas competidoras / complementarias.
- [ ] R-0243 Plantilla adaptador `MagazineAdapter` interface.
- [ ] R-0244 Piloto 1 revista: solo ingest + conteo.
- [ ] R-0245 No duplicar CRM; tag `source_magazine`.

---

### Epic E22 — Escalado publicación omnicanal (futuro)

- [ ] R-0246 Redes: post con link buscadis único.
- [ ] R-0247 Imposible contactar fuera plataforma (producto).
- [ ] R-0248 Autopublicación tras claim.
- [ ] R-0249 Catálogo negocio completo post-conversión.

---

### Epic E23 — Tareas manuales ops (recurrentes)

- [ ] R-0250 (manual) Lun/jue: sync WordPress tras confirmar PDF nuevo.
- [ ] R-0251 (manual) Revisar `revision.csv` completo ítems flagged.
- [ ] R-0252 (manual) Aprobar QG-EXTRACT firma en informe edición.
- [ ] R-0253 (manual) Import apply tras staging OK.
- [ ] R-0254 (manual) Monitorear go-live 24h primera edición nueva.
- [ ] R-0255 (manual) Responder WA &lt;4h horario laboral Cusco.
- [ ] R-0256 (manual) Actualizar SEGUIMIENTO-OCT markdown semanal.

---

### Epic E24 — Recuperación histórica (priorizada)

- [ ] R-0257 Ingest R2635 → cierra gap parcial 2635–2657.
- [ ] R-0258 Ingest R2686, R2687, R2690, R2706.
- [ ] R-0259 Resolver R2684 duplicado Downloads.
- [ ] R-0260 Recuperar R2760.
- [ ] R-0261 Evaluar R1660 relevancia analítica.
- [ ] R-0262 Backfill split pages ediciones 2025 faltantes en pages si PDF existe.
- [ ] R-0263 Priorizar huecos 2026 sobre 2024.
- [ ] R-0264 No bloquear MVP comercial por huecos 2024.

---

### Epic E25 — Pruebas de aceptación por edición (plantilla)

Copiar checklist por cada **R####** procesada:

- [ ] R-0265-TPL PDF en editions con SHA en manifest.
- [ ] R-0266-TPL Pages split OK (QG-SPLIT).
- [ ] R-0267-TPL extract `avisos.json` generado.
- [ ] R-0268-TPL metrics pasan QG-EXTRACT o excepción firmada.
- [ ] R-0269-TPL revision.csv revisado humano.
- [ ] R-0270-TPL validate-avisos sin error.
- [ ] R-0271-TPL staging import dry-run OK.
- [ ] R-0272-TPL producción import apply OK.
- [ ] R-0273-TPL CRM backfill OK.
- [ ] R-0274-TPL go-live muestra OK en feed.
- [ ] R-0275-TPL informe post-edición archivado.

*(Sustituir TPL por edición: ej. R-0265-R2767)*

---

### Epic E26 — Detalle optimización extract (micro-mejoras)

- [ ] R-0276 Tratar “WhatsApp” junto a número como un solo token contacto.
- [ ] R-0277 Normalizar “Cel.” “Telf.” “Rpc.” prefixes.
- [ ] R-0278 Ignorar teléfonos oficina Rueda en masthead (lista fija).
- [ ] R-0279 Separar avisos por línea horizontal doble si detectable en texto.
- [ ] R-0280 Detectar encabezado sección INMUEBLES/EMPLEOS en página.
- [ ] R-0281 Asignar `seccion_revista` por página al import.
- [ ] R-0282 No clasificar empleo como inmueble por palabra “local”.
- [ ] R-0283 Manejar anuncios bilingües quechua/español.
- [ ] R-0284 Manejar precios S/ en título sin confundir con teléfono.
- [ ] R-0285 Strip repetición “Precio S/.” suelta.

---

### Epic E27 — Detalle import/publicación (micro)

- [ ] R-0286 Evitar títulos TODO MAYÚSCULAS en polish.
- [ ] R-0287 Longitud máx descripción app vs revista.
- [ ] R-0288 Slug SEO no exponer teléfono.
- [ ] R-0289 Canonical URL por adiso.
- [ ] R-0290 Desactivar aviso tras expirar free tier (job).
- [ ] R-0291 Renovar gratis solo con claim (política).
- [ ] R-0292 Batch id en URL admin filtrable.

---

### Epic E28 — Intelligence / admin UI

- [ ] R-0293 Panel: última edición procesada.
- [ ] R-0294 Panel: conteo pendiente go-live.
- [ ] R-0295 Panel: top issues extract última semana.
- [ ] R-0296 Botón “importar leads Rueda” documentado.
- [ ] R-0297 Vista diff raw vs optimizado por adiso.
- [ ] R-0298 Export CSV oportunidades filtro origen Rueda.

---

### Epic E29 — Documentación comercial alineada

- [ ] R-0299 Actualizar CAMPANA-RUEDA con gates de este programa.
- [ ] R-0300 TRASPASO-CAMPANA: riesgos extract masivo.
- [ ] R-0301 OFERTA-PLANES: bundle “migrante Rueda”.
- [ ] R-0302 MUESTRA-EN-WEB alineada a polish automático.
- [ ] R-0303 Casos cliente en docs/clientes referencian `import_key`.

---

### Epic E30 — Contingencias

- [ ] R-0304 Runbook: WordPress caído — usar solo archivo local.
- [ ] R-0305 Runbook: OpenAI caído — solo texto + OCR.
- [ ] R-0306 Runbook: fusión masiva detectada — pausar import.
- [ ] R-0307 Runbook: duplicados en feed — dedupe script.
- [ ] R-0308 Runbook: anunciante reclama borrado — proceso legal/ops.
- [ ] R-0309 Backup Supabase antes import edición completa.
- [ ] R-0310 Rollback batch por `batch_id` documentado.

---

## 9. Resumen de conteo

| Epic | Tareas aprox. |
|------|----------------|
| E0–E10 | ~130 |
| E11–E20 | ~110 |
| E21–E30 | ~70 |
| **Total IDs R-0001–R-0310** | **~310** |

*(Las tareas TPL se repiten por edición; multiplicar × N ediciones activas.)*

---

## 10. Orden de implementación recomendado (cuando apruebes)

1. **R-0016–R-0032** inventario + manifest backfill  
2. **R-0035–R-0038** Downloads → archive  
3. **R-0051–R-0056** split R2747–R2766  
4. **R-0072, R-0123–R-0130** extract + validate R2766  
5. **R-0146–R-0160** import/go-live genérico  
6. **R-0133–R-0140** warehouse  
7. **R-0173–R-0184** CRM  
8. Segmentación **R-0091+** en paralelo si QG no alcanza 92%

---

## 11. Criterios “listo para producción” (edición)

Una edición está **PROD-OK** solo si:

1. Pasó QG-INGEST, QG-SPLIT, QG-EXTRACT (o excepción documentada).
2. `revision.csv` sin ítems críticos sin revisar (`sin_telefono`, `multi_inicio` alto).
3. Import staging validado; producción con batch id único.
4. ≥10 avisos spot-check en web tras go-live.
5. CRM backfill y al menos 1 actividad WA template probada.
6. Informe post-edición guardado en `data/comercial/` o Notion.

---

## 12. Próximo paso (solo planificación)

- [ ] R-0311 Revisión socio: aprobar sprints S1–S3 y umbrales QG.
- [ ] R-0312 Elegir edición piloto PROD-OK: **R2766** (más reciente en archivo).
- [ ] R-0313 Decidir: ¿invertir en bbox (S7) antes de import masivo histórico? **Recomendación:** no; piloto R2766 híbrido actual, bbox en S7.

---

*Fin del programa maestro v1.0. Marca checkboxes al implementar; abre PR referenciando IDs R-####.*

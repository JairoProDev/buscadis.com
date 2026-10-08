# Rueda de Negocios → Buscadis — Guía para el equipo (sin tecnicismos)

## ¿Qué estamos haciendo en una frase?

**Leemos la revista Rueda (PDF), sacamos cada aviso con teléfono y texto, lo ordenamos en archivos, y cuando toque lo publicamos gratis en Buscadis para que el anunciante lo reclame y después le vendamos más visibilidad.**

---

## Publicar y contactar (cuando el equipo diga «sí»)

Flujo técnico completo: **`ARQUITECTURA-PUBLICACION-Y-CONTACTO.md`** y checklist **`CHECKLIST-PRE-PUBLICACION.md`**.

Comando resumen (ejemplo edición R2766):

```bash
npm run rueda:preflight -- --edicion=R2766
npm run rueda:publish -- --edicion=R2766              # simulación
npm run rueda:publish -- --edicion=R2766 --apply      # inserta en web (inactivos)
npm run rueda:go-live -- --edicion=R2766             # activa de a uno
```

Catálogos para el equipo (sin PDF):  
`output/rueda/catalogo-avisos-historico-completo.csv` y  
`output/rueda/catalogo-avisos-reciente-R2747-en-adelante.csv`.

---

## ¿Dónde vive cada cosa? (local vs nube)

Piensa en **tres cajones**:

| Caja | ¿Dónde? | ¿Para qué? | ¿Obligatorio en Supabase? |
|------|---------|------------|----------------------------|
| **1. Revistas (PDF)** | Carpeta `ads` en tu PC/servidor (`archive/editions`) | Archivo histórico, como un estante de revistas | **No** |
| **2. Trabajo de oficina (texto extraído)** | Carpeta `output/rueda` en el proyecto (no se sube a Git) | Lista de avisos en JSON/CSV para revisar y analizar | **No** |
| **3. La web Buscadis (lo que ve el público)** | Supabase + Vercel (nube) | Anuncios publicados, cuentas, CRM comercial | **Sí, pero solo cuando decidimos publicar** |

**Conclusión práctica:**  
- Todo el trabajo pesado de **descargar, partir páginas y extraer texto** puede hacerse **solo en local** sin gastar cuota de Supabase.  
- **Supabase entra** cuando insertamos avisos en la web (`import-edition --apply`) o usamos el panel comercial. Eso es **voluntario y por tandas**, no automático al extraer el PDF.

Las tablas nuevas `rueda_*` (warehouse analítico) son **opcionales**: sirven para estadísticas (“¿cuántas veces publicó este teléfono?”). Si no las migras, puedes seguir con los JSON locales.

---

## ¿La capa gratis de Supabase aguanta esto?

Para el volumen actual, **sí, con margen**, si publicamos con criterio:

- Una edición ≈ **400 avisos** → 400 filas en `adisos` (pequeño para Postgres).
- No subimos los PDFs a Supabase (solo texto y metadatos).
- El “go-live” puede ser **de uno en uno** (no 400 de golpe en un segundo).
- Lo que más pesa en gratis suele ser **almacenamiento de archivos/imágenes** y **tráfico**, no 400 filas de texto cada dos semanas.

**Recomendación:**  
1. Extraer y validar **siempre en local**.  
2. Publicar primero **muestras** (10–50) o una edición en **horario controlado**.  
3. Activar warehouse `rueda_*` en nube **solo cuando** quieras dashboard de analítica ahí.

Si quieres **cero riesgo** en gratis: no ejecutes `import-edition --apply` hasta que ops lo apruebe.

---

## ¿Qué construimos? (metáfora del flujo)

1. **Bajar la revista** — Como guardar el PDF con nombre claro (`R2766-Oct5-7.pdf`), no “revista(1).pdf”.
2. **Partir en hojas** — Cada página en su archivo, como fotocopiar página por página para trabajar más fácil.
3. **Leer los avisos** — Programa + reglas (y a veces IA en portadas con fotos) para separar cada anuncio y sacar teléfono, título y rubro.
4. **Revisión** — Un Excel/CSV de “los que dudan” para un humano.
5. **Publicar en Buscadis** (opcional) — Subir a la web en cola lenta + WhatsApp al anunciante.
6. **CRM** — Seguimiento comercial en el panel admin.

---

## ¿Quién ejecuta los comandos (`npm` / `npx`)?

| Quién | Qué |
|-------|-----|
| **Cursor / agente (yo)** | Puedo ejecutarlos en tu máquina WSL cuando pides “continúa trabajando”, si tienes Python, dependencias y `.env.local` configurados. |
| **Tú u ops** | Solo cuando hace falta tu OK: publicar a producción (`--apply`), migrar base de datos, o algo que gaste dinero (IA visión masiva). |

**No es obligatorio** que copies comandos a mano para el día a día: el runbook es para **repetir el proceso** o si alguien técnico lo hace sin agente.

Atajos útiles (los puede correr el agente):

```text
npm run rueda:inventory     → “¿qué PDFs tenemos y qué falta?”
npm run rueda:daily-check   → alertas rápidas (ej. falta R2760)
npm run rueda:validate      → ¿la extracción está bien?
```

---

## Estado hoy (oct 2026)

- **PDFs recientes (R2747–R2766):** sí, en `ads/archive/editions` (falta solo **R2760**).
- **Páginas partidas:** sí, 19 carpetas en `ads/archive/pages`.
- **Catálogo sin PDF:** **~29 600 avisos** (68 ediciones R2630+) en una sola hoja:
  - **Excel / Google Sheets:** abrir `output/rueda/MASTER-avisos.csv`
  - **Por edición:** `output/rueda/R2766/avisos.csv` y `avisos-enumerados.txt` (lista numerada legible)
- **Web Buscadis:** aún **no** publicamos estos avisos (solo archivo local).
- **Supabase tablas `rueda_*`:** preparadas en código; migración remota pendiente de alinear historial (`db push`); no afecta el CSV local.

Más detalle técnico: `IMPLEMENTACION-PROGRESO.md` y `RUNBOOK-INGESTA.md`.

---

## Preguntas frecuentes del equipo

**¿Tenemos que pagar más por Supabase por Rueda?**  
No por extraer la revista. Solo sube uso cuando **publicamos** avisos en la web (filas en base de datos). Es orden de magnitud menor que subir miles de fotos.

**¿Podemos trabajar un mes solo en local?**  
Sí. PDF + JSON + Excel de revisión es suficiente para análisis y pruebas de mensajes WA sin tocar la nube.

**¿Usamos OpenAI en el pipeline?**  
**No por defecto.** La extracción es **local**: PyMuPDF + reglas de texto (`lib/extraer-anuncios-rueda.ts`). Opcional: `--ocr` (Tesseract en tu PC). La API OpenAI solo corre si alguien pone `RUEDA_USE_OPENAI=1` (desaconsejado para volumen).

**¿Y la IA de Cursor?**  
El agente en Cursor ayuda a **diseñar reglas, revisar casos raros y mejorar scripts** — no puede leer 7 900 páginas una a una en chat. Para una portada problemática, se puede pegar captura en Cursor y corregir manualmente esa fila en el CSV.

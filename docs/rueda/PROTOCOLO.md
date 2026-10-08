# Protocolo Rueda → prospecto → cliente Buscadis

**Programa completo (checklist ~310 tareas):** [`PROGRAMA-MAESTRO.md`](./PROGRAMA-MAESTRO.md)  
**Operación día a día:** [`RUNBOOK-INGESTA.md`](./RUNBOOK-INGESTA.md) · **QA:** [`RUNBOOK-QA.md`](./RUNBOOK-QA.md)

Cadena objetivo: **PDF** → **avisos estructurados** → **analítica de anunciante** → **CRM** → **contacto WA** → **publicación** → **cuenta** → **seguimiento / recompra**.

## 1. Archivo de ediciones

1. Cuando WordPress publique nueva `revista.pdf`, descargar con nombre fijo (no confiar solo en la URL):
   ```bash
   npx tsx scripts/rueda/sync-wordpress-pdf.ts \
     --edicion=R2766 --rango=Oct5-7 --fechas=2026-10-05..2026-10-07 --apply
   ```
2. Registrar en `data/rueda/manifest.json` (el script actualiza al aplicar).
3. PDF en `RUEDA_EDITIONS_DIR` (repo `ads`, carpeta `archive/editions`).

## 2. Extracción por edición

```bash
npx tsx scripts/rueda/extract-edition.ts \
  --pdf="$RUEDA_EDITIONS_DIR/R2766-Oct5-7.pdf" \
  --edicion=R2766 \
  --batch=rueda-R2766-claimable-2026-10-05 \
  --fecha=2026-10-05 \
  --vision
```

Salida: `output/rueda/R2766/avisos.json` + `revision.csv` (gitignored).

Cada aviso incluye: página, teléfonos, texto, categoría, `import_key`, flags `recurrente` / `requiere_revision`.

## 3. Analítica de anunciante (próxima capa de datos)

Hoy: heurística `recurrente` dentro de una edición. **Pendiente** (recomendado en Supabase):

| Tabla | Uso |
|-------|-----|
| `rueda_editions` | edición, fechas, sha256 del PDF |
| `rueda_listings` | un aviso = fila con `edicion`, `pagina`, `area_cm2` o `size_tier`, texto, contactos |
| `rueda_advertisers` | clave estable: teléfono principal + nombre normalizado |
| `rueda_advertiser_stats` | frecuencia, tamaño medio, categorías, primera/última aparición |

Con eso respondes: *¿cada cuánto publica?, ¿qué tamaño?, ¿cambia de rubro?*

## 4. Import a Buscadis + CRM

1. `scripts/rueda/import-edition.ts --edicion=R####` (sustituye import-r2764).
2. Tras insertar adisos: `backfillOpportunitiesFromBatch` → `/admin/comercial`.
3. En la oportunidad: contexto del aviso (`adiso_id`, notas batch, actividades).

## 5. Contacto y venta

1. IA: borradores por intent (`first_contact`, `follow_up`, …).
2. WhatsApp: manual hoy; Cloud API según `docs/comercial/WHATSAPP-BUSINESS.md`.
3. Etapas hasta **ganado** → `sales_accounts` + carpeta `docs/clientes/`.
4. Publicación pagada: `scripts/clientes/*` + `syncPaidClientAdisoToCrm`.

## 6. Cadencia operativa sugerida

| Cuándo | Acción |
|--------|--------|
| Día 1 de sesión Rueda | `sync-wordpress-pdf` + `extract-edition` |
| Mismo día | Revisar `revision.csv`, corregir outliers |
| Día 1–2 | Import gradual (go-live) + CRM backfill |
| Semana | Contacto priorizado (empresa, alto score, recurrentes) |
| Cierre | Publicar + historias + métricas al cliente |

## 7. Checklist por edición nueva

- [ ] PDF guardado con nombre `R####-MesDia-MesDia.pdf`
- [ ] Entrada en `manifest.json`
- [ ] `avisos.json` generado
- [ ] Batch id único (`rueda-R####-claimable-YYYY-MM-DD`)
- [ ] Oportunidades CRM creadas
- [ ] Informe interno: totales, top anunciantes recurrentes, conversión pipeline

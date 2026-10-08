# Checklist pre-publicación (una edición)

Usar antes de `publish-edition.ts --apply`.

## Datos

- [ ] `output/rueda/R####/avisos.json` existe y pasó `validate-avisos`
- [ ] `preflight-edition.ts --edicion=R####` → `ok: true`
- [ ] `manifest.json`: `fecha_inicio`, `fecha_fin`, `batch_id`, `archivo` PDF correctos
- [ ] Revisar filas `requiere_revision=true` en `revision.csv`

## Catálogo equipo

- [ ] `npm run rueda:export-master` (o `rueda:reexport --sync-fechas` si cambió manifest)
- [ ] Muestra manual de 10 avisos (título, teléfono, categoría)

## Infra

- [ ] `.env.local` con Supabase prod/staging según decisión
- [ ] `RUEDA_OPS_USER_ID` definido si no es el default
- [ ] Migraciones DB al día (warehouse opcional)

## Import

- [ ] `publish-edition.ts --edicion=R####` (sin `--apply`) sin errores
- [ ] Ventana de go-live acordada (`--start-in-minutes`, `--interval-seconds`)

## Post-import

- [ ] `contacto-anunciantes-R####-LISTO.csv` generado
- [ ] CRM: oportunidades visibles en admin comercial
- [ ] `go-live-loop` con `--edicion=R####` o `RUEDA_ACTIVE_BATCH_ID`
- [ ] Prueba manual: abrir un `/reclamar/{token}` de prueba

## Comunicación

- [ ] Plantilla WA revisada (tono, opt-out, enlace reclamar)
- [ ] Límite diario de mensajes acordado
- [ ] No contactar filas `requiere_revision` hasta corregir

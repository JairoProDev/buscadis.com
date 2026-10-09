# Playbook crecimiento — Cusco (empleos primero)

## Norte

1. **Contenido real** (Rueda) → **visibilidad** (Buscadis) → **conversación** (WA) → **pago** (destacado / más días).
2. Mismo teléfono en varias ediciones = **un anunciante** (`rueda_advertiser_phone_key` + cuenta stub al go-live).
3. Variantes del mismo negocio = **varios avisos** en el perfil, no borrar historial; límites anti-abuso después.

## Publicación (1/min, sensación orgánica)

```bash
npx tsx scripts/rueda/plan-go-live.ts --edicion=R2766
npx tsx scripts/rueda/import-edition.ts --edicion=R2766 --apply --only-ready --interval-seconds=60
RUEDA_ACTIVE_BATCH_ID=... npx tsx scripts/rueda/go-live-loop.ts
```

- **Fecha del aviso** en web ≈ `fecha_inicio` de la edición en revista.
- **Activación** escalonada con `scheduled_go_live_at` (ya implementado).
- Opcional: `RUEDA_ENFORCE_ONE_FREE_ACTIVE=1` → solo 1 aviso gratis activo por anunciante.

## Contacto WA (empleos)

Usa `mensaje_wa_sugerido` en Sheets. Estructura que responde:

1. **Reconocimiento** (“vi su aviso de X en Rueda”).
2. **Resultado** (“en Buscadis llega a quien busca empleo en Cusco”).
3. **Prueba social** (número de vistas cuando exista).
4. **CTA único** (“¿le muestro en 2 min el destacado para llenar la vacante?”).

No mencionar precios de Rueda en frío (ver `PRECIOS-RUEDA-NEGOCIOS.md`).

## CTAs en cadena (usuario final)

| Etapa | CTA |
|-------|-----|
| Mensaje WA anunciante | Reclamar aviso / destacar |
| Aviso publicado | “Contactar por WhatsApp” con texto: *“Vi tu aviso en Buscadis”* |
| Post-reclamo | App + alertas + republicar 1/día |
| Redes | Seguir @buscadis, grupo WA “Ofertas Cusco”, Telegram digest |

## Métricas semana 1 empleos

- Respuestas WA / enviados
- Reclamos / avisos activados
- Primer pago destacado
- DAU búsqueda empleos Cusco

## Reglas anti-abuso (ideas para producto)

- Gratis: **1 aviso activo** por cuenta.
- Republicación gratuita: **1 vez / día** (entrar a la app).
- Misma vacante en otra edición: **actualizar** o nuevo aviso vinculado al perfil, no spam duplicado en feed.

## Expansión

Semana 2: inmuebles. Misma tubería (CSV por categoría + Sheets + import tandas). Ciudad nueva solo cuando Cusco tenga loop WA + reclamos estable.

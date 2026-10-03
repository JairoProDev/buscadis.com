# Variables de entorno en Vercel — reglas prácticas

## `NEXT_PUBLIC_*` → tipo **Config**, no Secret

Vercel avisa en rojo si marcas `NEXT_PUBLIC_SITE_URL` como **Secret**.

- Cualquier variable con prefijo `NEXT_PUBLIC_` **se embebe en el JavaScript del navegador**. No puede ser secreta.
- Elige **Config** (o el tipo normal sin “Secret”) para:
  - `NEXT_PUBLIC_SITE_URL`
  - `NEXT_PUBLIC_APP_URL`
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `NEXT_PUBLIC_GA_MEASUREMENT_ID`
  - `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`
  - etc.

**Secret** solo para claves de servidor (sin `NEXT_PUBLIC_`):

- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `CRON_SECRET`
- `MOBILE_INGEST_SECRET`
- `MERCADOPAGO_ACCESS_TOKEN`
- etc.

## Unificar en **All Environments** (recomendado)

| Variable | All Environments | Excepción |
|----------|------------------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Sí | Mismo proyecto Supabase en dev/preview/prod |
| `NEXT_PUBLIC_SITE_URL` | **Production:** `https://buscadis.com` | Preview puede usar URL de Vercel si hace falta |
| `NEXT_PUBLIC_APP_URL` | Igual que SITE en prod | Local: `http://localhost:3000` en `.env.local` |
| `CRON_SECRET`, API keys | Sí en Prod + Preview | Development local en `.env.local` |
| `PROMOTION_DEV_BYPASS` | **No** en Production | Solo local/preview |

**No uses** `https://api.example.com` en `NEXT_PUBLIC_SITE_URL` (visto en capturas). Debe ser la URL pública del sitio: **`https://buscadis.com`**.

## Duplicados

Si tienes la misma key tres veces (Development / Preview / Production) con el mismo valor:

1. Borra las tres entradas viejas.
2. Crea **una** fila → **All Environments** → mismo valor.

## “Needs Attention” en secrets

Vercel sugiere rotar o revisar tokens expuestos en logs. Prioridad:

1. `SUPABASE_SERVICE_ROLE_KEY` — nunca en cliente; rotar si hubo filtración.
2. `OPENAI_API_KEY`, `GEMINI_API_KEY` — rotar si aparecieron en commits públicos.

## Después de cambiar variables

**Deployments → Redeploy** Production (y Preview si pruebas ahí). Sin redeploy, el build anterior sigue activo.

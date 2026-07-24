# Auth en producción — checklist operativa

## Ya hecho (agente / repo)

- Código One Tap + onboarding DNI/WhatsApp
- Migración `042` **aplicada** en Supabase (`dni`, `ruc`, `whatsapp`, `intencion`, tabla OTP)
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` en Vercel proyecto **buscadis.com** (Production/Preview/Development)
- Redeploy de producción (variable ya embebida en el JS de `www.buscadis.com`)
- Supabase Auth → Google: **enabled**, mismo Client ID `222349059154-…`

## Google Cloud (tú — parece OK)

Orígenes JS:

- `http://localhost:3000`
- `https://buscadis.com`
- `https://www.buscadis.com`

Redirects:

- `https://qegqjshtxotdjjhvxmve.supabase.co/auth/v1/callback`
- `https://www.buscadis.com/auth/callback`
- `http://localhost:3000/auth/callback`

## Qué debes probar ahora

1. Abre **ventana de incógnito** → https://www.buscadis.com  
2. **Entrar** → no debe decir “Falta NEXT_PUBLIC_GOOGLE_CLIENT_ID”  
3. Completa Google One Tap / botón  
4. Onboarding: intención → DNI → WhatsApp  

Si aún ves el error viejo: Ctrl+Shift+R o borra caché del sitio.

## Pendiente (para DNI/WhatsApp reales)

### Decolecta (DNI/RUC)

Guía completa: [DECOLECTA-SETUP.md](./DECOLECTA-SETUP.md)

1. Cuenta en https://decolecta.com → token  
2. Vercel proyecto **buscadis.com**: `DECOLECTA_API_TOKEN` (Production + Preview)  
3. Redeploy  

Migración `043` (capacidades + google_profile + referral) **aplicada** en Supabase.

### WhatsApp OTP

1. Meta Business → WABA + plantilla Authentication  
2. Vars: `WHATSAPP_API_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_OTP_TEMPLATE_NAME`  
3. En prod **no** uses `OTP_DEV_LOG=1`  

Sin WhatsApp, en desarrollo el código sale en logs / UI con `OTP_DEV_LOG`.

## Migraciones Supabase (cómo sí puedo hacerlas)

Con el proyecto linkeado y token en `~/.supabase/access-token`:

```bash
npx supabase db query --linked "SQL…"
npx supabase db push   # aplica migrations/
```

## Nota de proyectos Vercel

- Dominios `www.buscadis.com` / `buscadis.com` → proyecto **buscadis.com**  
- Hay un proyecto viejo **buscadisapp** (solo `*.vercel.app`); no lo uses para prod  

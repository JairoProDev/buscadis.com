# Auth sin `*.supabase.co` (sin pagar Custom Domain)

Buscadis usa **Google Identity Services (One Tap + botón GIS)** + `supabase.auth.signInWithIdToken`.  
El login ocurre en `buscadis.com`; **no** se usa el redirect OAuth de Supabase (que muestra `qegqjshtxotdjjhvxmve.supabase.co`).

## Checklist (tú)

### 1. Google Cloud (gratis)

1. [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials.
2. OAuth 2.0 Client ID (Web).
3. **Authorized JavaScript origins:**
   - `https://www.buscadis.com`
   - `https://buscadis.com`
   - `http://localhost:3000`
4. Consent screen: nombre **Buscadis**, logo, dominio verificado.
5. Copia el Client ID → `NEXT_PUBLIC_GOOGLE_CLIENT_ID` en `.env.local` y Vercel.
6. El **mismo** Client ID + Secret en Supabase → Authentication → Providers → Google.

No hace falta Authorized redirect URI de `*.supabase.co` para One Tap.  
Si algún día activas Custom Domain de pago, añade `https://auth.buscadis.com/auth/v1/callback`.

### 2. Migración SQL

Ejecuta en Supabase SQL Editor (o CLI):

- `supabase/migrations/042_auth_identity.sql`

### 3. Decolecta (DNI/RUC) — gratis ~1000/mes

1. Regístrate en [decolecta.com](https://decolecta.com) / [apis.net.pe](https://apis.net.pe).
2. Pega el token en `DECOLECTA_API_TOKEN`.
3. Local sin token: `IDENTITY_DEV_MOCK=1`.

### 4. WhatsApp OTP

- **No hay OTP gratis** (categoría Authentication se cobra por mensaje).
- Cloud API acceso gratis; crea plantilla AUTHENTICATION en Meta Business.
- Env: `WHATSAPP_API_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_OTP_TEMPLATE_NAME`.
- Mientras tanto: `OTP_DEV_LOG=1` (código en logs del servidor / UI en development).

## Flujo producto

1. One Tap (esquina) o **Crear cuenta / Entrar con mi cuenta** → Google.
2. Onboarding: buscar vs publicar → DNI (+ RUC si negocio, ligado a la persona) → WhatsApp OTP.
3. Sin contraseña en el flujo nuevo (legacy email/password colapsado).

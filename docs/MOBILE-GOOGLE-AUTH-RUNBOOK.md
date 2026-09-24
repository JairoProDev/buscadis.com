# Guía completa: Google login en app Android (100% funcional)

Sigue estos pasos **en orden**. Marca cada casilla al terminar.

---

## Cómo funciona (para que no te pierdas)

```text
Usuario toca "Continuar con Google" en el WebView
    → Web detecta app nativa (__BUSCADIS_APP__)
    → postMessage { type: 'google_sign_in' }
    → Expo abre Google (cuenta del teléfono, 1 toque si ya hay sesión)
    → ID token → WebView → signInWithGoogleIdToken → Supabase sesión
```

**Desktop** sigue usando GIS/One Tap en el navegador. **La app** usa login nativo; no intentes hacer funcionar GIS dentro del WebView.

---

## Fase A — Web en producción (repo `buscadis.com`)

### A1. Variables en Vercel (proyecto **buscadis.com**)

| Variable | Valor | Notas |
|----------|--------|--------|
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | `222349059154-…apps.googleusercontent.com` | Ya debería estar |
| `NEXT_PUBLIC_SUPABASE_URL` | tu proyecto Supabase | |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key | |

### A2. Redeploy

```bash
cd ~/proyectos/buscadis.com
vercel deploy --prod --yes
```

### A3. Probar en Chrome (no en la app)

1. Incógnito → https://www.buscadis.com  
2. **Entrar** → Google One Tap o botón  
3. Debe iniciar sesión sin error de GIS  

Si falla aquí, arregla web antes de la app.

---

## Fase B — Google Cloud Console

Abre: https://console.cloud.google.com/apis/credentials (mismo proyecto que el Web Client ID).

### B1. Cliente OAuth **Web** (ya existe)

Verifica **Orígenes JavaScript autorizados**:

- `https://www.buscadis.com`
- `https://buscadis.com`
- `http://localhost:3000`

No hace falta cambiar el Client ID web para la app Android nativa, pero **sí** lo usa `expo-auth-session` como `webClientId` para obtener el **ID token**.

### B2. Cliente OAuth **Android** (esto falta hoy)

1. **Crear credenciales** → **ID de cliente de OAuth** → **Android**
2. Nombre: `Buscadis Android`
3. **Nombre del paquete:** `com.adisplatforms.buscadis`
4. **Huella digital del certificado SHA-1:** ver sección B3
5. Crear → copia el **Client ID** (termina en `.apps.googleusercontent.com`)

### B3. Obtener SHA-1

**Producción (Play Store)** — el que importa para usuarios reales:

1. [Google Play Console](https://play.google.com/console) → tu app **Buscadis**
2. **Configuración** → **Integridad de la app** → **Firma de apps**
3. Copia **SHA-1 del certificado de firma de la app** (App signing key certificate)

Pégalo en el cliente OAuth Android de B2.

**Desarrollo local** (opcional, para `expo run:android`):

```bash
cd ~/proyectos/sdk/buscadis-mobile/android
./gradlew signingReport
```

Busca `Variant: debug` → SHA-1. En Google Cloud puedes **añadir otra huella** al mismo cliente Android (mismo package) si la consola lo permite, o crea un segundo cliente Android solo para debug.

**Build EAS** (si firmas con otra clave):

```bash
cd ~/proyectos/sdk/buscadis-mobile
eas credentials -p android
```

Revisa el SHA-1 del keystore de upload; si difiere del de Play, añádelo también en Google Cloud.

### B4. Supabase Auth

1. Dashboard Supabase → **Authentication** → **Providers** → **Google**
2. **Enabled**
3. **Client ID** = el mismo **Web** Client ID (`222349059154-…`)
4. **Client Secret** = secret del cliente Web en Google Cloud
5. Guardar

Sin esto, el ID token de la app no creará sesión en Supabase.

---

## Fase C — App móvil (repo `buscadis-mobile`)

Ruta: `~/proyectos/sdk/buscadis-mobile`

### C1. Instalar dependencias

```bash
cd ~/proyectos/sdk/buscadis-mobile
npm install
```

(Debe incluir `expo-auth-session`, `expo-web-browser`, `expo-crypto`.)

### C2. Pegar el Android Client ID

En `app.json` → `expo.extra`:

```json
"googleWebClientId": "222349059154-59klc5eh40c4q8eng67gkvug7s4u04br.apps.googleusercontent.com",
"googleAndroidClientId": "PEGA_AQUI_EL_CLIENT_ID_ANDROID"
```

**Alternativa EAS** (recomendado para no commitear):

```bash
eas secret:create --scope project --name GOOGLE_ANDROID_CLIENT_ID --value "TU_ANDROID_CLIENT_ID"
eas secret:create --scope project --name GOOGLE_WEB_CLIENT_ID --value "222349059154-..."
```

`app.config.js` ya lee `GOOGLE_ANDROID_CLIENT_ID` en build.

### C3. Build de producción

```bash
npm run build:android
# o: eas build -p android --profile production
```

Sube el `.aab` a Play (internal testing primero).

### C4. Probar en el dispositivo

1. Instala el build desde Play **internal testing** (o `eas build` + APK preview).
2. Abre la app → **Entrar** → **Continuar con Google**
3. Debe abrirse el selector de cuenta de Google del sistema (no el error GIS).
4. Tras elegir cuenta, debes quedar logueado en Buscadis.

**Si ves:** *"Falta el Client ID de Android…"* → `googleAndroidClientId` vacío o build viejo.

**Si ves:** `DEVELOPER_ERROR` o `10:` en Google → SHA-1 o package no coinciden con Google Cloud.

**Si ves:** error de Supabase tras elegir cuenta → revisa Fase B4 (Web Client ID + Secret).

---

## Fase D — Checklist final

| # | Item | ✓ |
|---|------|---|
| 1 | Web redeploy con bridge nativo | |
| 2 | OAuth Android creado (package + SHA-1 Play) | |
| 3 | `googleAndroidClientId` en app.json o EAS secret | |
| 4 | Supabase Google provider con Web ID + Secret | |
| 5 | Nuevo AAB en Play (internal → producción) | |
| 6 | Login probado en dispositivo real | |

---

## Referencia rápida de repos

| Repo | Qué tocar |
|------|-----------|
| `buscadis.com` | Ya implementado: `lib/mobile-app-bridge.ts`, `GoogleGisButton`, `useNativeGoogleIdToken` |
| `buscadis-mobile` | `App.tsx` (google_sign_in), `lib/googleSignIn.ts`, `app.json` extra |

Docs relacionados: [MOBILE-GOOGLE-AUTH.md](./MOBILE-GOOGLE-AUTH.md), [AUTH-PROD-CHECKLIST.md](./AUTH-PROD-CHECKLIST.md), `buscadis-mobile/PLAY_STORE_READY.md`.

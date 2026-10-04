# Error 400 `invalid_request` — login Google en la app Android

Pantalla: *Access blocked … sent an invalid request* / **Error 400: invalid_request**.

No es el One Tap de la web: la app usa **expo-auth-session** (`useIdTokenAuthRequest`) y abre el flujo OAuth de Google. Casi siempre falla por **redirect URI** o **cliente Android (SHA-1 / package)** mal configurados en Google Cloud.

## 1. Cliente OAuth **Web** (el mismo `googleWebClientId`)

En [Credentials](https://console.cloud.google.com/apis/credentials) → tu cliente **Web** → **Authorized redirect URIs**, añade **todas** estas (sin espacios):

```text
buscadis://oauthredirect
com.googleusercontent.apps.222349059154-59klc5eh40c4q8eng67gkvug7s4u04br:/oauth2redirect
```

(Si cambias el Web Client ID, sustituye el segmento largo por el de tu cliente: quita `.apps.googleusercontent.com` y antepone `com.googleusercontent.apps.`)

Opcional si pruebas con Expo Go:

```text
https://auth.expo.io/@TU_USUARIO/buscadis-app
```

Guarda, **recarga la página** y confirma que siguen las 5 URIs (la consola a veces no persiste si el JS de `gstatic` no cargó). Espera 5–10 minutos.

## 2. Cliente OAuth **Android**

- Package: `com.adisplatforms.buscadis`
- **SHA-1 del certificado de firma de Play** (Play Console → Integridad de la app → App signing key)
- Debe coincidir con `googleAndroidClientId` en `app.json` / EAS

## 3. Supabase

Authentication → Google → **mismo Web Client ID** + **Client Secret** del cliente Web.

## 4. Nuevo build de la app

Tras cambiar `App.tsx` (redirect explícito) o `app.json`:

```bash
cd ~/proyectos/sdk/buscadis-mobile
eas build -p android --profile production
```

La web (`buscadis.com`) no necesita rebuild para este error; sí un **nuevo AAB** si cambias código nativo.

## 5. Nombre en la pantalla de error

Si aún dice **ADIS TECHNOLOGICAL PLATFORMS S.A.C.**, revisa OAuth consent screen → **App name = Buscadis** (el nombre legal puede seguir en política de privacidad). La propagación puede tardar horas.

## Verificación rápida (web)

One Tap en Chrome incógnito en `https://www.buscadis.com` → Entrar. Si la web falla, arregla web/Supabase antes de la app.

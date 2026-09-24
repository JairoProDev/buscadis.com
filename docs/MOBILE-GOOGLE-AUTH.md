# Login Google en la app Android (WebView)

## Por qué falla en la app y sí en desktop

La app **buscadis-mobile** es un **WebView** que carga `www.buscadis.com`. En desktop usamos **Google Identity Services** (`accounts.google.com/gsi/client`) + One Tap.

**Google no soporta GIS / One Tap dentro de WebViews embebidos** (política de seguridad). El error *"No se pudo cargar Google Identity Services"* viene de ahí — no es que falte el Client ID en Vercel.

No es un bug de Supabase ni de Decolecta: es **arquitectura WebView + GIS**.

## Solución (dos repos)

| Repo | Rol |
|------|-----|
| **buscadis.com** | Si detecta app nativa (`__BUSCADIS_APP__`), el botón pide login **nativo** vía `postMessage` y recibe el ID token con `buscadis:native-google-id-token`. |
| **buscadis-mobile** | `expo-auth-session` + Google → ID token → inyecta evento al WebView → mismo `signInWithGoogleIdToken` que en web. |

## Configuración Google Cloud (obligatorio para Android)

1. **OAuth Web client** (ya lo tienes): `NEXT_PUBLIC_GOOGLE_CLIENT_ID` — mismo en Supabase Google provider.
2. **OAuth Android client** (falta si solo tienes Web):
   - Package: `com.adisplatforms.buscadis`
   - SHA-1: certificado de **Play App Signing** (Play Console → Integridad de la app).
3. Pega el Android Client ID en `buscadis-mobile/app.json` → `extra.googleAndroidClientId`.
4. Rebuild AAB: `eas build -p android --profile production`.

## Probar en desarrollo

```bash
cd ~/proyectos/sdk/buscadis-mobile
npm install
npx expo run:android
```

Sin `googleAndroidClientId`, la app mostrará un mensaje claro (no el error de GIS).

## Deploy web

Tras cambios en buscadis.com, redeploy Vercel para que el WebView cargue el bridge nuevo.

---

**Guía paso a paso completa:** [MOBILE-GOOGLE-AUTH-RUNBOOK.md](./MOBILE-GOOGLE-AUTH-RUNBOOK.md)

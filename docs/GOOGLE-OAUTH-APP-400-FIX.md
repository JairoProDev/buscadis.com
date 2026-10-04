# Arreglar login con Google en la app Android (error 400)

## Lo que viste en la consola (normal)

En **Adis Login** (cliente **Web**), Google **no deja** guardar:

- `buscadis://oauthredirect`
- `com.googleusercontent.apps.222349059154-59klc…:/oauth2redirect`

Mensajes tipo *“must use http or https”* o *“must end with .com”*.

**No es un error tuyo:** esas URLs **no van en el cliente Web**. Quítalas (borra las líneas 4 y 5) y deja solo las 3 `https://` que ya tenías.

---

## Cómo funciona (simple)

| Dónde entras | Qué cliente usa la app |
|--------------|-------------------------|
| Chrome → buscadis.com | Cliente **Web** “Adis Login” (solo URLs `https://`) |
| App Android | Cliente **Android client 1** (paquete + SHA-1) |

La app **no** usa el cliente Web para el popup de Google en el teléfono. Usa el **Android client** (`222349059154-lsfb…` en `app.json`).

---

## Paso 1 — Cliente Web “Adis Login” (tu captura)

1. Credenciales → **Adis Login** (Web).
2. **Authorized redirect URIs**: solo estas **3** (nada de `buscadis://`):

   - `https://qegqjshtxotdjjhvxmve.supabase.co/auth/v1/callback`
   - `https://www.buscadis.com/auth/callback`
   - `http://localhost:3000/auth/callback`

3. **Guardar**.

---

## Paso 2 — Cliente **Android client 1** (SHA-1)

En GCP ya tienes algo como:  
`E1:68:F3:4A:36:B8:30:B4:23:16:30:F5:65:D5:44:BF:AC:53:40:B3`  
Eso debe coincidir con **el certificado con el que firma la app en el teléfono**.

### Dónde ver el SHA-1 correcto (Play Console)

La pantalla **“Protegido con Play”** no muestra el SHA-1. Ve a:

**Play Console** → app **Buscadis** → menú izquierdo **Configuración** (o **Release** / **Test and release**) → **Integridad de la app** / **App integrity**.

Ahí verás dos bloques (nombres en español pueden variar):

| Certificado | Cuándo importa |
|-------------|----------------|
| **Firma de la app** (App signing key) | Usuarios que instalan desde **Play Store** (casi siempre este) |
| **Clave de subida** (Upload key) | Lo que firma el AAB que sube EAS antes de que Play lo re-firme |

**Qué hacer:** copia el **SHA-1** de **Firma de la app** y compáralo con el de **Android client 1** en Google Cloud.  
Si es distinto, en GCP puedes **añadir otro SHA-1** al mismo cliente Android (no hace falta crear otro cliente).

También comprueba:

- **Package name:** `com.adisplatforms.buscadis`

Si el SHA-1 no coincide con la firma real del APK en el dispositivo, Google devuelve 400.

---

## Paso 3 — App en el teléfono

El código usa el redirect correcto para Android:

`com.googleusercontent.apps.222349059154-lsfb8gf494u7673ap374gk8t1fj9hgfl:/oauth2redirect`

(derivado del **Android** Client ID, no del Web.)

Necesitas un build **≥ 1.0.11** con ese cambio. El AAB 1.0.10 usaba `buscadis://`, que chocaba con esta configuración.

```bash
cd ~/proyectos/sdk/buscadis-mobile
eas build -p android --profile production
```

---

## Paso 4 — Probar

1. Instala el build nuevo (Play internal o APK/AAB).
2. Abre la app → Entrar con Google.
3. Si falla, anota el texto exacto del error.

---

## Resumen en una frase

**No pegues URLs de la app en el cliente Web; arregla el cliente Android (package + SHA-1) e instala un build que use el redirect del cliente Android.**

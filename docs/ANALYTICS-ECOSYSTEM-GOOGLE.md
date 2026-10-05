# Ecosistema Google — Buscadis (profesional)

## Propiedades GA4 — qué es cada una

| Propiedad GA4 | ¿Se usa hoy? | Acción |
|---------------|--------------|--------|
| **BuscAdis** `G-4N4QVEB03T` | **Sí** — web `www.buscadis.com` (con consentimiento cookies) | **Mantener** — propiedad principal web |
| **buscadis-app** | **No** — la app **no** lleva SDK Firebase ni envía a este ID | Renombrar a `[ARCHIVO] buscadis-app Firebase legacy` o eliminar tras exportar si no hay datos útiles |
| **PublicAdis** | Solo si mides `quival.adis.lat` / landings Publicadis aparte | Mantener si hay tráfico; si no, archivar |
| **My WebSite** | Revisar en GA4 → si host es `jairosaul.com`, renombrar a **jairosaul.com** | No mezclar con Buscadis |
| **Default Account for Firebase** | Cuenta contenedora histórica de Firebase | No borrar la cuenta; revisar qué apps Firebase quedan enlazadas |

### App móvil (`buscadis-mobile`)

- Repo: `JairoProDev/buscadis-mobile` (Expo WebView).
- **No usa Firebase Analytics.**
- Login: **Supabase Auth** + Google Sign-In nativo (`@react-native-google-signin/google-signin`), no Firebase Auth.
- Métricas app: `POST https://www.buscadis.com/api/mobile-analytics` → tabla `mobile_analytics_events`.
- Play Console: instalaciones y vitals (fuera de GA4).
- El slug Expo `buscadis-app` **no implica** que GA4 `buscadis-app` reciba datos automáticamente.

### Publicadis / dominio `publicadis.com`

- En código: dominio caído; micrositios en **`*.adis.lat`** y `publicadis.adis.lat` (`lib/business/publicadis.ts`).
- Renovar `publicadis.com` (~USD 18) solo si quieres marca/email en ese dominio; **no es obligatorio** para que Buscadis funcione.

---

## Firebase ¿obligatorio para login?

**No.** Buscadis web y app usan **Supabase** + Google Cloud OAuth Client ID. Firebase es opcional y **no está** en el repo web ni en `buscadis-mobile`.

---

## GA4 — eventos y conversiones (Etapa 3 completada en código)

El código envía (tras aceptar cookies): `page_view`, `search`, `generate_lead`, `sign_up`, `purchase`, `add_to_wishlist`, eventos deals, etc. (`lib/analytics/marketing-bridge.ts`).

**Tú en GA4 Admin (no automatizable sin API OAuth):**

1. **Admin → Data display → Events** → marcar como conversiones:
   - `generate_lead`
   - `purchase`
   - `sign_up`
2. Opcional: renombrar eventos recomendados cuando aparezcan con volumen.

---

## No mezclar tus pruebas con usuarios reales

### En tu navegador (desarrollo)

- `localhost` **no envía** GA4 (código `lib/analytics/internal-traffic.ts`).

### En producción desde tu laptop/celular

En DevTools → Consola:

```js
localStorage.setItem('buscadis_exclude_analytics', '1');
location.reload();
```

Para volver a medirte como usuario normal:

```js
localStorage.removeItem('buscadis_exclude_analytics');
location.reload();
```

### En GA4 (recomendado equipo)

1. **Admin → Data streams → BuscAdis Web → Configure tag settings → Show all → Define internal traffic** → regla IP oficina/casa.
2. **Admin → Data settings → Data filters** → activar filtro **Internal traffic** en modo **Testing** primero, luego **Active**.

---

## DNS — dónde está `buscadis.com`

Si verificaste GSC con **“Authorize DNS records from Google”** en **Cloudflare**, los nameservers del dominio apuntan a Cloudflare (el registrador, p. ej. Namecheap, solo renueva el dominio).

**Configuración recomendada**

1. **Namecheap** (o quien vendió el dominio): solo facturación; NS = Cloudflare.
2. **Cloudflare**: DNS (TXT GSC, A/CNAME a Vercel), SSL **Full (strict)**, reglas de cache si las usas.
3. **Vercel**: hosting del proyecto `buscadis.com`; dominio añadido en **Settings → Domains**.

No añadas el mismo TXT en dos sitios. El registro `google-site-verification=…` **debe permanecer** en Cloudflare.

---

## Search Console — Domain vs URL prefix

| Tipo | Ventajas | Verificación |
|------|----------|--------------|
| **Domain** `buscadis.com` | Cubre `www`, sin `www`, `http/https`, subdominios | **DNS TXT** en el registrador (Vercel DNS o donde esté el dominio) |
| **URL prefix** `https://www.buscadis.com` | Más rápido con meta tag (ya soportado en código) | `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` + redeploy |

**Recomendación profesional:** crear **Domain** `buscadis.com` en GSC (fuente de verdad SEO) **y** mantener o no el prefix; muchos equipos usan solo Domain. El meta tag del código sirve para prefix; para Domain necesitas TXT:

`google-site-verification=XXXXXXXX` en DNS.

---

## GitHub repos relacionados

| Repo | Rol |
|------|-----|
| `buscadis.com` | Web + API (activo) |
| `buscadis-mobile` | App Android/iOS WebView (activo) |
| `PublicAdis-nextjs` | Landing legacy Publicadis |
| `buscadis` (Vercel vacío creado por error de link) | Borrar proyecto Vercel si no se usa |

---

## Accesos para el agente

| Herramienta | Estado |
|-------------|--------|
| Vercel CLI | OK (`buscadis.com`) |
| GitHub CLI | OK (`JairoProDev`) |
| Supabase MCP | OK |
| GA4 / GSC Admin | Solo vía tu navegador (sin API key) |

No hace falta más MCP para analytics; para **Domain GSC** necesitas acceso DNS (Vercel Domains o registrador).

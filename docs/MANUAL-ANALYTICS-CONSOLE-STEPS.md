# Guía paso a paso — conectar toda la medición de Buscadis

**Orden recomendado:** sigue las etapas en número. Cada etapa termina con una **comprobación** antes de pasar a la siguiente.

**Ya hecho en backend (no repitas):** migración Supabase `055_analytics_rollups`, APIs `/api/me/adisos/analytics`, pestaña `/perfil?tab=resultados`, cron `analytics-snapshot` en `vercel.json`.

**Optimizar factura Vercel:** lee `docs/VERCEL-USAGE-OPTIMIZATION.md` y despliega el código reciente (imágenes).

---

## Etapa 0 — Publicar el código en producción

**Objetivo:** que buscadis.com sirva el layout con GSC, GTM opcional, Resultados, etc.

1. En tu máquina, confirma que los cambios de analytics están en la rama que despliegas (`main` o la que use Vercel).
2. Abre [vercel.com](https://vercel.com) → equipo → proyecto **buscadis** (o el nombre que tenga).
3. Pestaña **Deployments** → el último deploy de **Production** debe ser **después** de tus commits de analytics.
4. Si no: **Deployments** → ⋮ en el último build OK → **Redeploy** → marca **Use existing Build Cache** (opcional) → **Redeploy**.

**Comprobación:** abre `https://buscadis.com/perfil` (logueado). Debes ver la pestaña **Resultados** si tienes anuncios publicados.

---

## Etapa 1 — Vercel: Analytics del producto (sin GA)

**Objetivo:** tráfico agregado y Core Web Vitals en Vercel (no sustituye GA4).

1. Mismo proyecto en Vercel → menú superior **Analytics** (no “Settings”).
2. Si ves **Enable Web Analytics** → actívalo para **Production**.
3. Entra en **Speed Insights** (o desde el mismo hub Analytics) → **Enable** para Production.
4. No hace falta variable de entorno para estos dos.

**Comprobación:** tras 24–48 h con tráfico, **Analytics** muestra visitas; **Speed Insights** muestra LCP/CLS (puede tardar).

---

## Etapa 2 — Variables de entorno en Vercel

**Objetivo:** dejar listas todas las claves antes de tocar Google.

**Lee primero:** `docs/VERCEL-ENV-VARIABLES.md` (Config vs Secret, `NEXT_PUBLIC_SITE_URL=https://buscadis.com`, unificar duplicados).

1. Vercel → proyecto → **Settings** → **Environment Variables**.
2. Para cada fila: **Key**, **Value**, entorno **All Environments** (salvo excepciones del doc de env).
3. Variables `NEXT_PUBLIC_*` → tipo **Config**, nunca **Secret**.

| Key | Dónde conseguir el valor | Notas |
|-----|--------------------------|--------|
| `CRON_SECRET` | Inventa una cadena larga (32+ chars) o reutiliza la que ya usas en otros crons | Mismo valor en todos los crons |
| `NEXT_PUBLIC_SENTRY_DSN` | Etapa 6 | Puede esperar |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Etapa 3 | Formato `G-XXXXXXXXXX` |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | Etapa 4 | **Solo** el texto del `content="..."`, sin comillas |
| `NEXT_PUBLIC_CLARITY_PROJECT_ID` | Opcional, Etapa 7 | |
| `NEXT_PUBLIC_GTM_CONTAINER_ID` | Solo si usas GTM (Etapa 5) | Si lo usas, **borra** `NEXT_PUBLIC_GA_MEASUREMENT_ID` |
| `MOBILE_INGEST_SECRET` | Mismo secret en EAS `production` | Etapa 8 |

3. Pulsa **Save** en cada variable.
4. **Deployments** → **Redeploy** Production (obligatorio para que Next lea `NEXT_PUBLIC_*`).

**Comprobación:** en el deploy nuevo, **Settings → Environment Variables** muestra las claves en Production.

---

## Etapa 3 — Google Analytics 4 (recomendado: directo, sin GTM al inicio)

**Objetivo:** marketing, conversiones, Realtime.

### 3.1 Crear o abrir la propiedad

1. [analytics.google.com](https://analytics.google.com) → cuenta correcta (arriba izquierda).
2. **Admin** (engranaje abajo izquierda).
3. Si no existe propiedad **Buscadis**:
   - **Create** → **Property** → nombre `Buscadis` → zona horaria **(GMT-05:00) Lima** → moneda **PEN** o **USD** → **Next** → industria y tamaño → **Create**.
4. Si ya existe, selecciónala en el selector de propiedad.

### 3.2 Flujo de datos web

1. **Admin** → columna **Property** → **Data streams** → **Add stream** → **Web**.
2. URL: `https://buscadis.com` → nombre `Buscadis Web` → **Create stream**.
3. Copia el **Measurement ID** (ej. `G-ABC123XYZ`).

### 3.3 Pegar en Vercel

1. Vercel → **Environment Variables** → `NEXT_PUBLIC_GA_MEASUREMENT_ID` = el ID copiado → Production (+ Preview si quieres).
2. **Redeploy** Production.

### 3.4 Conversiones y búsqueda

1. GA4 → **Admin** → **Data display** → **Events**.
2. Busca eventos (pueden tardar 24 h en aparecer; prueba Realtime antes):
   - `generate_lead` → toggle **Mark as conversion**.
   - `purchase` → conversion.
   - `sign_up` → conversion.
3. **Admin** → **Data streams** → tu stream web → **Enhanced measurement** ON (scrolls, outbound, etc.).

### 3.5 Probar en vivo

1. Abre `https://buscadis.com` en ventana incógnito (o borra cookies del sitio).
2. Acepta cookies de **analytics** en el banner.
3. GA4 → **Reports** → **Realtime** → debe aparecer 1 usuario activo.
4. Haz una búsqueda y un clic a WhatsApp en un anuncio → en Realtime → **Event count by Event name** deberían salir `search` y/o `generate_lead`.

**Comprobación:** Realtime con sesión tuya tras aceptar cookies.

**Si no hay eventos:** rechazaste cookies, o falta redeploy con `NEXT_PUBLIC_GA_MEASUREMENT_ID`.

---

## Etapa 4 — Google Search Console (SEO)

**Objetivo:** indexación, sitemap, queries orgánicas. Requiere Etapa 2 + redeploy con la variable de verificación.

### 4.1 Añadir propiedad

1. [search.google.com/search-console](https://search.google.com/search-console).
2. **Add property**.
3. Elige **URL prefix** → `https://buscadis.com` → **Continue** (dominio `buscadis.com` también vale si controlas DNS; URL prefix es más simple al inicio).

### 4.2 Verificación HTML (meta tag)

1. Método **HTML tag**.
2. Google muestra algo como:
   ```html
   <meta name="google-site-verification" content="AbCdEf123456..." />
   ```
3. Copia **solo** `AbCdEf123456...` (lo de dentro de `content=`).
4. Vercel → `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` = ese texto → Save → **Redeploy** Production.
5. Espera a que el deploy termine (2–5 min).
6. En GSC → **Verify**.

**Comprobación:** mensaje verde “Ownership verified”.

**Si falla:** el deploy no terminó, la variable tiene espacios/comillas de más, o verificas otra URL (http vs https).

### 4.3 Sitemap

1. GSC → propiedad `https://buscadis.com` → **Sitemaps** (menú izquierdo).
2. **Add a new sitemap** → escribe: `sitemap.xml` → **Submit**.
3. Estado debe pasar a **Success** (puede tardar horas).

### 4.4 Inspección manual (opcional pero útil)

1. **URL inspection** → pega `https://buscadis.com` → **Request indexing**.
2. Repite con una URL de anuncio y con `https://buscadis.com/@tu-slug-negocio`.

### 4.5 Enlazar GA4 ↔ GSC

1. GA4 → **Admin** → **Product links** → **Search Console links** → **Link** → elige la propiedad GSC → **Confirm**.

**Comprobación:** en GA4 aparece el enlace activo; en GSC ves datos en **Performance** tras unos días.

---

## Etapa 5 — Google Tag Manager (opcional; salta si hiciste Etapa 3 directo)

**Objetivo:** que marketing cambie tags sin deploy. **No uses GTM y GA directo a la vez.**

1. [tagmanager.google.com](https://tagmanager.google.com) → **Create Account** → contenedor **Web** para `buscadis.com`.
2. Copia **Container ID** `GTM-XXXX`.
3. Dentro del contenedor → **Tags** → **New** → **Google Analytics: GA4 Configuration** → pega el Measurement ID de Etapa 3.
4. Trigger: **All Pages** (luego puedes refinar consentimiento).
5. **Submit** → **Publish**.
6. Vercel:
   - Añade `NEXT_PUBLIC_GTM_CONTAINER_ID=GTM-XXXX`
   - **Elimina** `NEXT_PUBLIC_GA_MEASUREMENT_ID`
   - Redeploy
7. GTM → **Preview** → abre buscadis.com → el debugger debe mostrar el tag GA4.

**Comprobación:** Realtime en GA4 sigue funcionando vía GTM; en código no hay doble carga de GA.

---

## Etapa 6 — Sentry (errores)

1. [sentry.io](https://sentry.io) → **Create project** → **Next.js**.
2. Copia el **DSN** (URL `https://...@....ingest.sentry.io/...`).
3. Vercel → `NEXT_PUBLIC_SENTRY_DSN` → Redeploy.
4. (Opcional) Para source maps en build: `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN` según wizard de Sentry.
5. **Alerts** → crea regla “New issue” email/Slack.

**Comprobación:** en Sentry → **Issues**, fuerza un error en preview o usa botón de test del wizard.

---

## Etapa 7 — Microsoft Clarity (opcional)

1. [clarity.microsoft.com](https://clarity.microsoft.com) → nuevo proyecto **Buscadis**.
2. Copia **Project ID**.
3. Vercel → `NEXT_PUBLIC_CLARITY_PROJECT_ID` → Redeploy.
4. Clarity respeta el banner: solo carga con consentimiento **analytics** (igual que GA).

**Comprobación:** sesiones en Clarity tras aceptar cookies y navegar 2 min.

---

## Etapa 8 — App Android + Play Console

**Objetivo:** instalaciones en Play; eventos en tu Supabase.

### 8.1 Secret compartido

1. Genera `MOBILE_INGEST_SECRET` (misma cadena en Vercel Production y en EAS).
2. En repo móvil `buscadis-mobile`: `eas secret:create --name MOBILE_INGEST_SECRET --value "..." --scope project` (perfil production).

### 8.2 Vercel

1. Variable `MOBILE_INGEST_SECRET` en Production.
2. Redeploy.

### 8.3 Salud del pipeline

```bash
curl -s "https://buscadis.com/api/mobile-health" \
  -H "X-Admin-Api-Key: TU_ADMIN_API_KEY_O_MOBILE_PUSH_ADMIN_SECRET"
```

Debe devolver JSON con `analyticsEventsTotal` y `analyticsEvents24h`.

### 8.4 Play Console

1. [play.google.com/console](https://play.google.com/console) → app Buscadis.
2. **Statistics** → **Installs** (instalaciones reales; no van a tu API).
3. **Android vitals** → crashes ANR.
4. Confirma que la app envía POST a `https://buscadis.com/api/mobile-analytics` con header `x-mobile-ingest-secret`.

**Comprobación:** `analyticsEvents24h` > 0 con la app abierta unos minutos en producción.

---

## Etapa 9 — Dashboards internos (producto)

| Qué | URL | Quién |
|-----|-----|--------|
| Inteligencia plataforma | `https://buscadis.com/admin/intelligence` | Usuario con `rol=admin` en Supabase |
| Resultados anunciante | `https://buscadis.com/perfil?tab=resultados` | Usuario con anuncios |
| Analytics negocio | Editor **Mi negocio** → widget analytics + QR | Dueño del perfil |
| Taxonomía eventos | `docs/ANALYTICS-TAXONOMY.md` | Equipo |

**Comprobación admin:** ves funnel 7d y “búsquedas sin resultado”.

**Comprobación anunciante:** ves impresiones/clics por anuncio y descarga CSV.

---

## Etapa 10 — Cron de métricas diarias

**Objetivo:** llenar `adiso_metrics_daily` cada noche (ya programado en `vercel.json`).

1. Asegura `CRON_SECRET` en Vercel (Etapa 2).
2. Tras deploy, en terminal local:

```bash
curl -s "https://buscadis.com/api/cron/analytics-snapshot" \
  -H "Authorization: Bearer TU_CRON_SECRET"
```

Respuesta esperada: `{"ok":true,"rowsUpserted":N}`.

**Comprobación:** `rowsUpserted` es un número ≥ 0; al día siguiente Vercel → **Logs** del cron sin 401.

---

## Etapa 11 — Checklist final (marca todo)

- [ ] Production desplegado con código analytics reciente
- [ ] Vercel Web Analytics + Speed Insights activos
- [ ] `NEXT_PUBLIC_GA_MEASUREMENT_ID` + Realtime OK con cookies aceptadas
- [ ] GSC verificado + sitemap enviado + enlace GA4
- [ ] `NEXT_PUBLIC_SENTRY_DSN` + alertas
- [ ] `/perfil?tab=resultados` y CSV
- [ ] `/admin/intelligence` como admin
- [ ] `MOBILE_INGEST_SECRET` + mobile-health OK
- [ ] Cron analytics-snapshot OK
- [ ] (Opcional) Clarity, GTM, pixels Meta en vitrina con consentimiento **marketing**

---

## Problemas frecuentes

| Síntoma | Causa probable | Qué hacer |
|---------|----------------|-----------|
| GA4 vacío | Cookies rechazadas o sin `NEXT_PUBLIC_GA_*` | Aceptar analytics + redeploy |
| GSC no verifica | Deploy viejo | Redeploy tras poner `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` |
| Doble conteo en GA | GTM + GA directo | Quita uno |
| Resultados en 0 | Poco tráfico o sin `behavioral_events` | Navega el feed logueado; espera impresiones |
| Cron 401 | `CRON_SECRET` mal o sin header | Mismo secret en Vercel y en `Authorization: Bearer` |
| Vercel “Exceeded” imágenes | Muchas fotos únicas en `/_next/image` | Deploy optimización + lee `VERCEL-USAGE-OPTIMIZATION.md` |

---

## Referencias en el repo

- `docs/ANALYTICS-SETUP.md` — resumen técnico
- `docs/ANALYTICS-TAXONOMY.md` — eventos y tablas
- `docs/VERCEL-USAGE-OPTIMIZATION.md` — límites Hobby y CPU/imágenes
- `docs/PLAY_PUBLICATION_RUNBOOK.md` — app Android

Cuando termines la **Etapa 4**, ya tienes el triángulo mínimo para decisiones: **GA4 + GSC + datos propios en Supabase**.

---

## ¿Conectar analytics hace más lenta la web?

**En la práctica, casi no** si sigues el diseño actual:

| Pieza | Impacto |
|-------|---------|
| **Vercel Web Analytics / Speed Insights** | Script pequeño; Speed Insights mide, no bloquea la UI |
| **GA4 directo o GTM** | Solo tras **aceptar cookies analytics**; carga `afterInteractive` |
| **Clarity** | Igual, con consentimiento |
| **Sentry** | Solo errores; overhead mínimo en happy path |
| **`behavioral_events`** | `fetch` en batch cada ~2s; no bloquea clics |
| **Pixels Meta/TikTok en vitrina** | Solo con consentimiento **marketing** |

Si el usuario **rechaza** cookies, no cargas GA/Clarity/pixels de terceros. Lo que sí afecta RES (rojo en Speed Insights) suele ser **LCP** (imágenes/peso JS en `/`) y **INP** (JS pesado en móvil), no la medición. Tras deploy de optimizaciones de home + thumbnails, revisa RES en 7–14 días.

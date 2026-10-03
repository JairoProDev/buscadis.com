# Pasos manuales en consolas (solo tú puedes hacerlos)

Todo lo demás ya está en código y, en Supabase producción **Buscadis.com**, la migración `055_analytics_rollups` está aplicada.

## 1. Vercel — variables y productos

1. [vercel.com](https://vercel.com) → proyecto **buscadis** → **Settings → Environment Variables** (Production + Preview):
   - `NEXT_PUBLIC_GA_MEASUREMENT_ID` = `G-…` (o deja vacío si usas solo GTM)
   - `NEXT_PUBLIC_GTM_CONTAINER_ID` = `GTM-…` (opcional; si lo pones, **no** uses también GA directo)
   - `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` = valor del meta tag de GSC (sin comillas)
   - `NEXT_PUBLIC_SENTRY_DSN`
   - `NEXT_PUBLIC_CLARITY_PROJECT_ID` (opcional)
   - `CRON_SECRET` (mismo valor que usas en otros crons)
   - `MOBILE_INGEST_SECRET` (EAS production, si aún no está)
2. **Analytics** → activar **Web Analytics** y **Speed Insights**.
3. **Deployments** → **Redeploy** production tras guardar env vars.

## 2. Google Analytics 4

1. [analytics.google.com](https://analytics.google.com) → propiedad **Buscadis** (zona **America/Lima**).
2. Flujo web `https://buscadis.com` → copiar Measurement ID a Vercel (si no usas GTM).
3. **Admin → Data display → Events** → marcar conversiones: `generate_lead`, `purchase`, `sign_up`.
4. **Admin → Product links** → enlazar **Search Console**.

## 3. Google Search Console

1. [search.google.com/search-console](https://search.google.com/search-console) → propiedad de dominio o prefijo `https://buscadis.com`.
2. Método **Etiqueta HTML** → copiar solo el `content="…"` a `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` en Vercel → redeploy.
3. **Sitemaps** → añadir `https://buscadis.com/sitemap.xml`.
4. Inspección de URL: home, un adiso, un perfil `/@slug`.

## 4. Google Tag Manager (opcional)

1. [tagmanager.google.com](https://tagmanager.google.com) → contenedor web.
2. Tag **Google Analytics: GA4 Configuration** con tu Measurement ID.
3. Trigger **Consent Initialization** o alineado con tu banner (recomendado: disparar solo si `analytics` consentido — puede requerir dataLayer custom desde el banner).
4. Publicar contenedor → poner `NEXT_PUBLIC_GTM_CONTAINER_ID` en Vercel → quitar `NEXT_PUBLIC_GA_MEASUREMENT_ID` → redeploy.

## 5. Sentry

1. [sentry.io](https://sentry.io) → proyecto Next.js → DSN en Vercel.
2. (Opcional) `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN` para source maps en build.
3. Alertas: nuevos issues y picos de error.

## 6. Play Console (app Android)

1. [play.google.com/console](https://play.google.com/console) → app `com.adisplatforms.buscadis`.
2. Revisar **Estadísticas de instalación**, **Android vitals**, **Calidad de la versión**.
3. Confirmar que la app envía eventos a `POST /api/mobile-analytics` con header `x-mobile-ingest-secret` = `MOBILE_INGEST_SECRET`.

## 7. Verificación rápida post-deploy

- [ ] `https://buscadis.com` → banner cookies → Aceptar → red GA4 Realtime (o GTM preview).
- [ ] Buscar y abrir un anuncio → eventos en GA4 / filas en `behavioral_events`.
- [ ] `/perfil?tab=resultados` con usuario anunciante → métricas y CSV.
- [ ] `/admin/intelligence` como admin → funnel 7d y búsquedas sin resultado.
- [ ] `GET /api/cron/analytics-snapshot` con `Authorization: Bearer <CRON_SECRET>` → `{ ok: true }`.

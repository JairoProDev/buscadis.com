# Checklist completo — medición Buscadis

Última actualización: 2026-10-03. Marca `[x]` lo hecho.

---

## A. Infraestructura y DNS

| Estado | Tarea | Notas |
|--------|--------|--------|
| [x] | Dominio `buscadis.com` activo | |
| [x] | **DNS en Cloudflare** (verificación GSC vía “Authorize DNS records”) | TXT `google-site-verification=…` — **no borrar** |
| [ ] | Confirmar en Cloudflare: registros **A/CNAME** apuntan a **Vercel** (proxy naranja o gris según prefieras) | Namecheap = solo registrador si NS apuntan a Cloudflare |
| [ ] | Decisión registrador: mantener Namecheap + NS Cloudflare (**recomendado**) | Cloudflare DNS + CDN; Vercel hosting |
| [ ] | SSL/TLS Cloudflare: **Full (strict)** si cert Vercel OK | Evita bucles SSL |

**¿Dónde conviene el DNS?**  
- **Cloudflare**: DNS, WAF, cache, TXT GSC (ya lo usas).  
- **Vercel**: solo DNS si quieres simplicidad máxima sin CDN Cloudflare (menos común si ya verificaste en CF).  
- **Namecheap**: no mezclar DNS duplicado; solo renovación del dominio.

---

## B. Vercel (proyecto `buscadis.com`)

| Estado | Tarea |
|--------|--------|
| [x] | Proyecto enlazado a repo `buscadis.com` (no el vacío `buscadis`) |
| [x] | `NEXT_PUBLIC_SITE_URL` / `NEXT_PUBLIC_APP_URL` → `https://www.buscadis.com` |
| [x] | `NEXT_PUBLIC_GA_MEASUREMENT_ID=G-4N4QVEB03T` |
| [x] | `CRON_SECRET` |
| [x] | `vercel env pull` + backup `.env.local.bak.20261003` |
| [ ] | **Redeploy Production** tras últimos commits (banner cookies, imágenes, internal-traffic) |
| [ ] | Borrar proyecto Vercel `buscadis` si sigue vacío |
| [ ] | `NEXT_PUBLIC_SENTRY_DSN` |
| [ ] | `NEXT_PUBLIC_CLARITY_PROJECT_ID` (opcional) |
| [ ] | `MOBILE_INGEST_SECRET` + EAS secret en `buscadis-mobile` |
| [ ] | Migrar secrets sensibles de Config → Secret donde aplique |

---

## C. Google Analytics 4 (propiedad **BuscAdis** `G-4N4QVEB03T`)

| Estado | Tarea |
|--------|--------|
| [x] | Stream web conectado al sitio |
| [x] | Realtime funciona tras aceptar cookies |
| [ ] | **Admin → Events** → marcar conversiones: `generate_lead`, `purchase`, `sign_up` |
| [ ] | Filtro **tráfico interno** (IP) + activar en Data filters |
| [ ] | Enlazar **Search Console** (Product links) |
| [ ] | Renombrar/archivar propiedad GA4 **`buscadis-app`** (no recibe app actual) |
| [ ] | Revisar **My WebSite** → renombrar si es `jairosaul.com` |
| [ ] | Pruebas propias: `localStorage.setItem('buscadis_exclude_analytics','1')` en prod |

---

## D. Google Search Console (propiedad **Domain** `buscadis.com`)

| Estado | Tarea |
|--------|--------|
| [x] | Propiedad Domain creada |
| [x] | **Ownership verified** (DNS / Cloudflare) |
| [ ] | **Sitemaps** → enviar `sitemap.xml` |
| [ ] | **URL inspection** → home + 1 anuncio + 1 perfil `@slug` → Request indexing |
| [ ] | Revisar **14 notificaciones** en GSC (icono campana) |
| [ ] | Esperar 24–72 h → Performance / Indexing (ahora “Processing data”) |

---

## E. Código / producto (repo `buscadis.com`)

| Estado | Tarea |
|--------|--------|
| [x] | Rollups Supabase `055_analytics_rollups` |
| [x] | `/perfil?tab=resultados`, APIs analytics anunciante |
| [x] | Cron `analytics-snapshot` en `vercel.json` |
| [x] | `marketing-bridge` → GA4 eventos |
| [x] | `internal-traffic.ts` (localhost + flag manual) |
| [x] | Banner cookies optimizado (CTA único + preferencias 3 pasos) |
| [x] | Optimización imágenes / cache Vercel |
| [x] | Docs: `MANUAL-ANALYTICS-CONSOLE-STEPS.md`, `ANALYTICS-ECOSYSTEM-GOOGLE.md` |
| [ ] | Commit + push si hay cambios locales sin publicar |

---

## F. App móvil (`buscadis-mobile`)

| Estado | Tarea |
|--------|--------|
| [x] | Analytics → `POST /api/mobile-analytics` (no Firebase) |
| [ ] | `MOBILE_INGEST_SECRET` alineado Vercel ↔ EAS |
| [ ] | Play Console: vincular paquete, estadísticas instalación |
| [ ] | Archivar repo **`BuscAdis-App`** (legacy `buscadisapp.vercel.app`) en GitHub |

---

## G. Publicadis / legado

| Estado | Tarea |
|--------|--------|
| [ ] | Decidir renovación `publicadis.com` (~$18) |
| [ ] | GA4 **PublicAdis** solo si miden landings `adis.lat` |

---

## H. Opcional profesional

| Estado | Tarea |
|--------|--------|
| [ ] | GTM (solo si quieres tags sin deploy; quitar GA directo) |
| [ ] | Sentry alertas |
| [ ] | Clarity con consentimiento analytics |

---

## Tus próximas acciones (orden)

1. GSC → **Sitemaps** → `sitemap.xml` → Submit.  
2. GSC → inspeccionar URL home → **Request indexing**.  
3. GA4 → marcar **3 conversiones** + **enlazar GSC**.  
4. Cloudflare → revisar que **www** y apex van a Vercel (sin DNS duplicado en Namecheap).  
5. **Redeploy** Vercel Production (banner nuevo).  
6. Incógnito → comprobar banner + Realtime GA4.

## Lo que el agente no puede hacer sin ti

- Clic en **Authorize** Cloudflare (ya hecho si GSC verificó).  
- UI de GA4/GSC (conversiones, sitemaps, notificaciones).  
- Renovar dominios / pagar Namecheap.  
- Secrets EAS en tu cuenta Expo.

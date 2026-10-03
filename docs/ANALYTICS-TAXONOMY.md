# Taxonomía de medición — Buscadis

Fuente de verdad para producto, marketing y dashboards.

## Capas

| Capa | Almacén | Consumidores |
|------|---------|--------------|
| Producto | `behavioral_events`, `page_analytics`, `mobile_analytics_events`, `adiso_metrics_daily` | Personalización, `/admin/intelligence`, pestaña **Resultados** en `/perfil` |
| Marketing (consentimiento analytics) | GA4 o GTM, Vercel Analytics | Growth, campañas |
| Marketing negocio (consentimiento marketing) | Meta / TikTok pixel en vitrina | Dueños Pro/Max |
| SEO | Search Console | Indexación, queries orgánicas |
| Estabilidad | Sentry | Ingeniería |

## Eventos `behavioral_events` (clasificados)

| event_type | Cuándo | entity |
|------------|--------|--------|
| `search.performed` | Búsqueda / suggest / zero | `search` |
| `ad.impression` | Card visible en grilla | `adiso` |
| `ad.click` | Abre anuncio | `adiso` |
| `ad.view_start` / `ad.view_end` | Modal abierto / cerrado | `adiso` |
| `ad.contact_whatsapp` / `ad.contact_chat` / `ad.contact_copy` | Lead | `adiso` |
| `ad.favorite`, `ad.share`, `ad.dismiss*` | Engagement | `adiso` |
| `publish.*`, `promotion.purchased`, `auth.sign_up` | Funnel publicar | varios |
| `deal.*` | Clips | `deal_clip` |

Puente a GA4: `lib/analytics/marketing-bridge.ts`.

## Eventos `page_analytics` (negocio)

Ver `docs/superpowers/specs/2026-08-08-buscadis-commerce-os-design.md` — funnel `profile_view` → `order_paid`.

## APIs internas

| Ruta | Rol |
|------|-----|
| `POST /api/events` | Ingesta batch web |
| `GET /api/me/adisos/analytics` | Métricas dueño clasificados |
| `GET /api/me/adisos/analytics/export` | CSV |
| `GET /api/admin/intelligence` | Admin plataforma |
| `POST /api/mobile-analytics` | App nativa |

## Cron

| Job | Schedule | Función |
|-----|----------|---------|
| `/api/cron/analytics-snapshot` | 05:15 UTC diario | `refresh_adiso_metrics_daily()` |

## Variables de entorno

Ver `.env.example` y `docs/ANALYTICS-SETUP.md`.

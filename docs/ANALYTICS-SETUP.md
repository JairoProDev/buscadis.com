# Analytics & Observability Setup — Buscadis

Manual steps to activate the analytics stack after deploying the code changes.

## 1. Vercel Dashboard (required)

1. Open your [Vercel project](https://vercel.com) → **Analytics**
2. Enable **Web Analytics**
3. Enable **Speed Insights**
4. Add environment variables (Production + Preview):
   - `NEXT_PUBLIC_GA_MEASUREMENT_ID`
   - `NEXT_PUBLIC_SENTRY_DSN`
   - `NEXT_PUBLIC_CLARITY_PROJECT_ID` (optional)
5. Redeploy after saving env vars

## 2. Google Analytics 4

1. Go to [analytics.google.com](https://analytics.google.com)
2. Create property **Buscadis** (timezone: America/Lima)
3. Add a **Web** data stream for `https://buscadis.com`
4. Copy the Measurement ID (`G-XXXXXXXX`) → `NEXT_PUBLIC_GA_MEASUREMENT_ID` in Vercel
5. In GA4 Admin → **Enhanced measurement**: enable scrolls, outbound clicks, site search
6. Mark as conversions: `generate_lead`, `purchase`, `sign_up`
7. Link GA4 ↔ Google Search Console (Admin → Product links)

## 3. Google Search Console (organic SEO)

1. Go to [search.google.com/search-console](https://search.google.com/search-console)
2. Add property `buscadis.com`
3. Verify via HTML meta tag — paste the code in `app/layout.tsx`:

```ts
verification: {
  google: 'your-verification-code',
},
```

4. Submit sitemap: `https://buscadis.com/sitemap.xml`
5. Use URL Inspection for homepage, one ad URL, and one `/@slug` business profile

## 4. Sentry

1. Create a project at [sentry.io](https://sentry.io) (platform: Next.js)
2. Copy DSN → `NEXT_PUBLIC_SENTRY_DSN` in Vercel
3. Optional source maps upload: set `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN`
4. Configure alerts: new issues, error spikes

## 5. Microsoft Clarity (optional)

1. Create project at [clarity.microsoft.com](https://clarity.microsoft.com)
2. Copy project ID → `NEXT_PUBLIC_CLARITY_PROJECT_ID`
3. Enable masking for phone numbers and form fields

## 6. Cloudflare (if proxied)

If buscadis.com uses Cloudflare orange-cloud proxy:

- Add [Cloudflare Web Analytics](https://www.cloudflare.com/web-analytics/) as an independent traffic check
- Do not enable Zaraz + GA4 double-tracking without disabling one path

If DNS-only or not on Cloudflare, skip this step.

## 7. WhatsApp & QR attribution

Use UTM-tagged links in campaigns:

```
https://buscadis.com/?utm_source=whatsapp&utm_medium=social&utm_campaign=nombre-campana
```

QR scans via `/q/{code}` automatically append `utm_source=qr` and `utm_medium=offline` when missing.

## Verification checklist

- [ ] Vercel Analytics shows traffic after production deploy
- [ ] Speed Insights shows Core Web Vitals
- [ ] GA4 Realtime shows visits **only after accepting analytics cookies**
- [ ] GA4 Events: `search`, `generate_lead` when searching and clicking WhatsApp
- [ ] Sentry receives a test error in preview
- [ ] Search Console accepts sitemap
- [ ] Cookie banner: reject → no GA4 requests; accept → GA4 loads
- [ ] `behavioral_events` table still receives product events

## Internal dashboards

- **Product intelligence:** `/admin/intelligence` (Supabase behavioral events)
- **Business owners:** Profile editor → Analytics widget + QR stats
- **Platform:** Vercel Analytics, GA4, Search Console, Sentry

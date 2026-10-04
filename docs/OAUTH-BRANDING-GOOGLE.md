# Branding OAuth (Google Cloud) — enfoque producto + cumplimiento

## Principio

**Usuarios:** feed primero, time-to-value cero (como redes sociales).  
**Google / OAuth:** propósito y operador en capas que no compiten con el feed.

| Capa | Usuario | Google |
|------|---------|--------|
| `<title>` + `meta description` | No ve (salvo pestaña) | Sí |
| JSON-LD `Organization` + `WebSite` | No ve | Sí |
| `HomeCrawlerBrief` (`sr-only`) | No ocupa pantalla | HTML inicial con H1 + propósito |
| `CrawlableAdisoList` (`sr-only`) | No ocupa pantalla | Enlaces reales a adisos en HTML |
| Pie `MarketplaceLegalFooter` | Solo al hacer scroll al final | DOM visible, operador legal |
| `/privacidad`, `/terminos` | Enlaces legales | URLs del consent screen |

No uses bloques hero ni retrasar One Tap por “branding”.

## GCP (manual)

1. **App name:** `Buscadis`
2. **Home:** `https://www.buscadis.com`
3. **Privacy:** `https://www.buscadis.com/privacidad`
4. **Terms:** `https://www.buscadis.com/terminos`
5. **Search Console:** dominio `buscadis.com` verificado (TXT DNS) — sin esto suele fallar todo el branding.

Tras verificar dominio + deploy → **Branding → View issues → I have fixed the issues → Proceed**. Si pasa la revisión, pulsa **Publish branding** (válido ~7 días).

**Estado (2026-10-04):** branding **verificado** en proyecto GCP `buscadis`; publicación iniciada. Search Console dominio `buscadis.com` verificado; `sitemap.xml` enviado.

## ¿Ya está todo resuelto?

| Issue Google | En código / producto | Tú en consola |
|--------------|----------------------|---------------|
| Dominio no registrado | — | Search Console TXT verificado |
| Home detrás de login | Feed público, sin redirect a `/login` | Deploy reciente |
| Sin propósito en home | Meta + JSON-LD + `HomeCrawlerBrief` (sr-only) + pie al scroll | Deploy |
| Nombre app ≠ home | Home dice **Buscadis** + legal en pie | Branding → App name **Buscadis** |
| Términos OAuth | `/terminos` | URL en consent screen |

Hasta que **Search Console** no esté verde y no hayas **redeployado**, no marques “fixed”.

## ¿Qué opción marcar?

- **I have fixed the issues** → solo si dominio verificado, deploy en prod, nombre Buscadis, URLs privacy/terms, y comprobaste la home en incógnito.
- **I believe the issues found are incorrect** → solo si cumples todo y Google sigue fallando igual (soporte / segunda revisión).

## ¿Vale la pena?

Sí si quieres **Google Sign-In para cualquier usuario** (no solo testers) y pantalla de consentimiento en producción. Sin branding verificado el proyecto OAuth suele quedarse en **Testing** (~100 usuarios de prueba). No sustituye Search Console para SEO; es requisito de **identidad de la app** ante Google.

## Comprobación

```bash
curl -s -A "Googlebot" https://www.buscadis.com/ | rg -i "Buscadis|ADIS TECHNOLOGICAL|clasificados"
```

Debe aparecer texto en `sr-only` y meta; la UI en producción no debe mostrar cajas de marketing encima del feed.

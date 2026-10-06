# SEO off-site — guía operativa (paso a paso)

Responsable: equipo Buscadis. Tiempo estimado primera pasada: **2–3 horas** + 30 min/semana de mantenimiento.

---

## 1. Google Search Console (GSC)

### 1.1 Acceso

1. Abre [Google Search Console](https://search.google.com/search-console).
2. Propiedad recomendada: **Prefijo de URL** → `https://www.buscadis.com`
3. Si aún no verificaste: en Vercel define `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` (meta tag) y redeploy, o verifica por DNS en tu registrador.

### 1.2 Sitemap

1. GSC → **Sitemaps** → campo **solo ruta relativa** (sin `https://`): `sitemap/0.xml`  
   - También válido tras deploy reciente: `sitemap.xml` (redirect interno al chunk principal).
2. Estado esperado: “Correcto” en 24–48 h (primera lectura puede tardar horas).
3. Si falla: comprobar en navegador `https://www.buscadis.com/sitemap/0.xml` (200 + URLs `/a/...`) y `NEXT_PUBLIC_SITE_URL=https://www.buscadis.com`.
4. **Hecho en sesión (oct 2025):** enviado `sitemap/0.xml` en propiedad `sc-domain:buscadis.com`.

### 1.3 URL con snippet roto (chunk error)

1. GSC → **Inspección de URLs**.
2. Pega la URL exacta del sitelink (ej. aviso “Vajillero…” en `/a/...`).
3. **Probar URL publicada** → si el HTML ya no muestra “Algo salió mal”, **Solicitar indexación**.
4. Repite para 3–5 URLs de adisos que salgan en sitelinks.

### 1.4 Rutas nuevas (post-deploy)

Inspeccionar y solicitar indexación (una vez por tipo):

- `https://www.buscadis.com/categoria/empleos`
- `https://www.buscadis.com/l/cusco/empleos`
- `https://www.buscadis.com/buscar/empleo-cusco` (ejemplo)

### 1.5 Revisión quincenal (15 min)

- **Rendimiento** → consultas: `buscadis`, `empleo cusco`, `clasificados cusco`.
- **Páginas** → indexadas vs. no indexadas; corregir 404 y soft 404.
- **Experiencia** → Core Web Vitals en móvil.

---

## 2. Comprobaciones técnicas en producción (sin GSC)

Ejecutar en navegador o terminal:

| Prueba | Resultado esperado |
|--------|-------------------|
| `https://buscadis.com/` | Redirect 308 a `https://www.buscadis.com/` |
| `https://www.buscadis.com/?categoria=empleos` | Redirect a `/categoria/empleos` |
| `https://www.buscadis.com/?buscar=empleo` | Redirect a `/buscar/empleo` |
| `https://www.buscadis.com/buscar?q=empleo+cusco` | Redirect a `/buscar/empleo-cusco` |
| `https://www.buscadis.com/sitemap.xml` | 200, entradas `/a/...` |
| `https://www.buscadis.com/robots.txt` | Apunta al sitemap www |

---

## 3. Google Business Profile (Cusco)

1. [Google Business](https://business.google.com) → ubicación Cusco.
2. **Editar perfil:**
   - Descripción (150–750 caracteres): empleos, inmuebles, vehículos, clasificados gratis en Perú, enfoque Cusco.
   - Categoría: periódico de anuncios clasificados / marketplace local (la más cercana).
   - Sitio web: `https://www.buscadis.com`
   - Teléfono y horario coherentes con la web.
3. **Fotos:** logo, captura del feed, foto real del equipo o evento (mín. 5).
4. **Reseñas:** pedir a 10 negocios que publican con vosotros; enlace directo a “Escribir reseña” del perfil.
5. **Publicaciones** (1/semana): “Nuevas vacantes en Cusco” con enlace a `/l/cusco/empleos` o un `/a/...` concreto.

---

## 4. Marca en redes y SERP

### LinkedIn

1. Página [linkedin.com/company/buscadis](https://linkedin.com/company/buscadis): logo, banner, web www, descripción alineada con home.
2. Perfil personal del fundador: cargo → enlace a **página de empresa**, no solo al dominio personal.

### Instagram / Facebook / TikTok

- Cada post de vacante u oferta: enlace **canónico** `https://www.buscadis.com/a/{id}/{slug}` (no solo imagen).
- Bio: `www.buscadis.com`

### Play Store

- Descripción con “Perú”, “Cusco”, “clasificados”, “empleos”.
- Enlace destacado en web: `/app` o URL de la ficha.

### jairosaul.com (si compite en “buscadis”)

- Botón visible “Sitio oficial → buscadis.com” o `noindex` en la página del proyecto.

---

## 5. Backlinks locales (Cusco)

Plantilla de mensaje (cámaras de comercio, universidades, blogs):

> Hola, somos Buscadis, clasificados gratuitos en Cusco (empleos, inmuebles, negocios). ¿Pueden enlazar nuestra sección de empleos en Cusco?  
> https://www.buscadis.com/l/cusco/empleos

Objetivo: 5–10 enlaces de calidad en 60 días.

---

## 6. Typesense (opcional)

Si tenéis `TYPESENSE_HOST` y `TYPESENSE_API_KEY` en producción:

```bash
npm run search:sync-marketplace
```

Tras importaciones masivas de adisos.

---

## 7. Métricas

| Métrica | Dónde |
|---------|--------|
| Sesiones orgánicas | GA4 |
| Consultas y CTR marca | GSC |
| Conversiones (publicar / contacto) | GA4 eventos |
| Errores chunk post-deploy | Sentry |

---

## 8. Qué no hace falta obsesionarse

- Eliminar **todos** los `?` del sitio: búsqueda y filtros pueden usarlos; lo clave es **canónica + redirect**.
- Poner **categoría + usuario + subcategoría** en cada URL de adiso: más riesgo que beneficio; el modelo `/a/{id}/{slug}` es el estándar del producto.

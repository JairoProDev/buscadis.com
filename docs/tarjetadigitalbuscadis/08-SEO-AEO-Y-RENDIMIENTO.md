# 08 — SEO, AEO (optimización para IAs) y rendimiento

> **CONTEXTO PARA LA IA:** esta es una pasada independiente, nunca mezclada con la de UI. El objetivo: que cada perfil rankee en Google para su rubro + distrito, y que sea citable por ChatGPT, Perplexity, Gemini y AI Overviews.

---

## 1. Por qué esto vale más que el diseño

Un negocio paga S/30 al mes por resultados, no por estética. El resultado más grande que le podemos dar es que aparezca cuando alguien busca "ferretería en Wanchaq" — en Google y, cada vez más, en una respuesta generada por IA. Los estudios de 2025–2026 ubican la presencia de respuestas de IA en consultas locales entre 15% y 32% según metodología, y esa proporción sube. Un perfil que no puede ser leído sin ejecutar JavaScript está fuera de ese canal completo.

**Regla dura:** todo el contenido crítico (nombre, categoría, dirección, horario, teléfono, 12 productos con precio, 3 reseñas, FAQ) debe estar en el HTML de la primera respuesta del servidor. Sin excepción.

---

## 2. Renderizado

- **Perfil (`/[slug]`)**: SSG con ISR, `revalidate: 60`. Regeneración bajo demanda cuando el negocio edita (`revalidatePath`).
- **Catálogo (`/[slug]/catalogo`)**: SSR con paginación por cursor; los primeros 20 productos en HTML.
- **Producto (`/[slug]/producto/[id]`)**: SSG con ISR. Cada producto es una landing indexable — aquí está el volumen largo de búsqueda ("pomada mate para barba Cusco").
- **Estado vivo**: componente cliente que revalida cada 60s, con el valor del servidor como estado inicial. Nunca bloquea el render.
- **Hidratación parcial**: solo carruseles, hojas modales y estado son interactivos. El resto es HTML estático.

## 3. URLs y metadatos

```
buscadis.com/ferreteria-quival                    (perfil)
buscadis.com/ferreteria-quival/catalogo?cat=cementos
buscadis.com/ferreteria-quival/producto/cemento-sol-42-5kg
```

Nada de `?id=8271`. Slugs legibles con palabras clave reales.

```tsx
export const metadata = {
  title: `${nombre} — ${categoria} en ${distrito}, ${provincia} | Buscadis`,
  description: `${nombre}: ${categoria} en ${distrito}. ${resumenProductos}. Horario, ubicación, precios y contacto directo por WhatsApp.`,
  alternates: { canonical: `https://buscadis.com/${slug}` },
  openGraph: { images: [`/og/${slug}.png`] },   // generada dinámicamente
  robots: { index: estado === 'activo', follow: true },
};
```

**Imagen OG dinámica:** generada en el borde con logo, nombre, calificación y tres productos. Es la que aparece cuando el perfil se comparte por WhatsApp; es simultáneamente SEO y crecimiento.

## 4. Datos estructurados (JSON-LD)

Cuatro esquemas, siempre. Este bloque es la parte más subestimada y más rentable de todo el proyecto.

```jsonc
// LocalBusiness — en el perfil
{
  "@context":"https://schema.org","@type":"HardwareStore",   // subtipo según categoría
  "@id":"https://buscadis.com/ferreteria-quival",
  "name":"...","image":[...],"logo":"...","url":"...",
  "telephone":"+51...","priceRange":"S/10 - S/2000",
  "address":{"@type":"PostalAddress","streetAddress":"...","addressLocality":"Wanchaq",
             "addressRegion":"Cusco","addressCountry":"PE"},
  "geo":{"@type":"GeoCoordinates","latitude":-13.52,"longitude":-71.96},
  "openingHoursSpecification":[{"@type":"OpeningHoursSpecification",
     "dayOfWeek":["Monday"],"opens":"08:00","closes":"18:00"}],
  "aggregateRating":{"@type":"AggregateRating","ratingValue":4.7,"reviewCount":128},
  "paymentAccepted":"Efectivo, Yape, Plin, Visa, Transferencia",
  "areaServed":{"@type":"City","name":"Cusco"},
  "sameAs":["https://instagram.com/..."]
}
```

Además: `Product` + `Offer` con `priceCurrency: "PEN"` y `availability` en cada ficha; `Review` individuales; `FAQPage` para el módulo de preguntas; `BreadcrumbList` en catálogo y producto; `ItemList` para el catálogo destacado.

**Nunca marcar `aggregateRating` sin reseñas reales.** Es penalizable y, más importante, es mentira.

## 5. AEO — que las IAs te citen

Las IAs citan lo que pueden leer, resumir y verificar. Seis medidas concretas:

1. **Resumen legible por máquina al inicio del HTML.** Un párrafo de 40–60 palabras en el `<h1>` + primer `<p>` que contenga nombre, qué vende, dónde y desde cuándo. Los modelos extraen ese fragmento casi literalmente.
2. **Datos en tablas y listas semánticas**, no en divs con estilo. Horarios en `<table>`, precios en `<dl>`. Las IAs parsean estructura.
3. **FAQ real con lenguaje de pregunta.** "¿Hacen delivery en Cusco?" convierte mucho mejor como fuente que "Delivery: sí".
4. **`/llms.txt` en la raíz del dominio**, con la descripción de Buscadis, el índice de categorías y el patrón de URLs. Coste: una hora. Beneficio potencial: alto y creciente.
5. **Rastreo permitido para bots de IA** (GPTBot, PerplexityBot, ClaudeBot, Google-Extended) en `robots.txt`. Bloquearlos es proteger contenido que quieres que sea citado — al revés de lo que hace un medio de comunicación.
6. **Fechas visibles y `dateModified`.** Un modelo prefiere una fuente fechada. Un perfil que dice "actualizado hace 2 días" gana contra un directorio de 2021.

**Feed para ADIS AI:** un endpoint interno `/api/feed/negocios?desde=` que entregue el corpus normalizado. Este es el activo de datos que después alimenta tu propio modelo especializado en comercio.

## 6. Presupuestos de rendimiento (bloqueantes en CI)

| Métrica | Presupuesto | Cómo se garantiza |
|---|---|---|
| LCP (4G simulada, Moto G Power) | **< 1.8 s** | Portada con `fetchpriority=high`, tamaño correcto, LQIP |
| INP | **< 200 ms** | Sin JS pesado en la ruta crítica; carruseles con CSS scroll-snap nativo |
| CLS | **< 0.05** | Todas las imágenes con `width`/`height`; alturas fijas en promoción y estado |
| JS transferido (perfil) | **< 180 KB** | Sin librerías de UI pesadas, sin SDK de mapas, sin librería de carrusel |
| CSS | **< 40 KB** | Tokens + utilidades; nada de frameworks completos sin purgar |
| Fuentes | **< 95 KB** | 3 variables subconjuntadas, `swap`, precarga solo de la de UI |
| HTML inicial | **< 120 KB** | Solo 12 productos y 3 reseñas en el primer render |
| Peso total del primer render | **< 600 KB** | Presupuesto duro |

**Prohibidos en la ruta crítica:** iframe de Google Maps (usar imagen estática, +400 KB ahorrados), librerías de carrusel (CSS nativo), librerías de animación (transiciones CSS), Google Fonts vía CDN (self-hosted), analítica de terceros bloqueante (envío diferido con `sendBeacon`), y cualquier video en el hero.

**CI:** Lighthouse CI en cada PR con los presupuestos anteriores como umbrales de fallo. Si el PR sube el LCP, no entra.

## 7. Rendimiento percibido

Más importante que el número: la sensación. Tres técnicas.
La primera pantalla se sirve completa en HTML, de modo que nunca haya esqueletos sobre el pliegue. Los módulos bajo el pliegue usan `content-visibility: auto` con `contain-intrinsic-size`, lo que evita renderizar lo que no se ve sin provocar saltos de layout. Y las transiciones de las hojas modales usan la View Transitions API cuando está disponible, con reserva de una transición CSS simple: es lo que produce la sensación nativa sin costo de JavaScript.

## 8. Local SEO fuera del perfil

El perfil solo no basta. Tres acciones que multiplican su efecto y que van en el guion comercial:
sincronizar NAP (nombre, dirección, teléfono) idéntico entre Buscadis, Google Business Profile y redes, porque la inconsistencia es el error de SEO local más común; generar páginas de categoría por distrito en Buscadis ("Ferreterías en Wanchaq") que enlacen a los perfiles, que es lo que hace que la red entera rankee y no cada perfil por separado; y solicitar reseñas de forma sistemática, porque volumen y frescura de reseñas son los factores de posicionamiento local sobre los que más control tienes.

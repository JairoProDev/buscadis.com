# 12 — Prompts para IAs de código

Copia y pega. Adjunta los archivos indicados en cada uno. **Nunca adjuntes los 12 archivos juntos.**

---

## Preámbulo común (pégalo al inicio de cada sesión)

```
Estás construyendo el "Perfil Vivo" de Buscadis: el perfil público de un negocio
dentro de un marketplace peruano. Stack: Next.js App Router, TypeScript estricto,
Tailwind configurado solo con nuestros tokens, PostgreSQL + MongoDB + Redis.

Reglas innegociables:
- Móvil primero, contenedor máx 640px centrado. Un solo scroll vertical, sin pestañas.
- Ningún valor de color, espaciado, radio o tipografía escrito a mano: solo tokens.
- Presupuesto: LCP < 1.8s en 4G, JS < 180KB, CSS < 40KB. Si una librería no es
  imprescindible, no se usa. Carruseles con CSS scroll-snap nativo, no librerías.
- Todo componente implementa 4 estados: cargando (esqueleto con forma real),
  vacío, error y lleno. El estado vacío se diseña primero.
- Contraste AA, objetivo táctil 44px, navegación por teclado, prefers-reduced-motion.
- Textos en español peruano, sentence case, verbos concretos. Sin "Oops".
- SSR/SSG siempre: el contenido crítico va en el HTML del servidor.

Antes de escribir código, dime en 5 líneas qué vas a hacer y qué decisiones estás
tomando que no estén en la especificación. Si algo falta, pregúntalo; no lo inventes.
```

---

## Prompt 1 — Fundación
*Adjunta: `05`, `07`, `04`.*
```
Crea la fundación del proyecto:
1. Configuración de Tailwind y globals.css con TODOS los tokens de 05 como
   variables CSS, incluyendo modo oscuro por [data-theme].
2. Fuentes self-hosted (Bricolage Grotesque, Geist Sans, Geist Mono), variables,
   subconjunto latin+latin-ext, con next/font local y precarga solo de Geist Sans.
3. lib/tema.ts con derivarTema() exactamente como está en 05 §3, usando culori.
   Incluye tests que verifiquen contraste AA >= 4.5 para 20 colores semilla
   distintos, incluidos casos extremos (amarillo puro, negro, blanco, neón).
4. types/perfil.ts con todos los tipos de 07 y sus validadores Zod.
5. components/RenderizadorModulos.tsx que recibe ConfigModulo[] y despacha,
   con los módulos aún como stubs.
6. Lighthouse CI con los presupuestos de 08 como umbrales de fallo.

Entrega el árbol de archivos y luego cada archivo completo.
```

---

## Prompt 2 — Hero + Estado + Acciones
*Adjunta: `06 §1–§4`, `05`.*
```
Implementa los cuatro módulos fijos del perfil siguiendo 06 §1 a §4 al detalle:
Hero, MetricasConfianza, EstadoVivo y AccionesRapidas + BarraAccion fija.

Puntos donde suelo ver errores, cuídalos:
- El hero completo + la barra de acción deben verse en 375x667 sin scroll.
- El logo es cuadrado con radio grande, NO circular.
- Las métricas van en UNA línea con separadores, no en tabla de columnas.
- Las métricas declaradas se ven distintas de las verificadas.
- El estado vivo nunca muestra datos estimados y usa aria-live="polite".
- La barra fija tiene UNA sola acción con color de marca.
- Todo handoff va a /r/{token} con mensaje de WhatsApp pre-armado.

Incluye los 4 estados de cada componente y los eventos de analítica indicados.
```

---

## Prompt 3 — Catálogo
*Adjunta: `06 §7`, `05 §6`, `07 §2`.*
```
Implementa CatalogoDestacado + HojaProducto.

Requisitos críticos de densidad (05 §6): card de 156px de ancho, imagen 1:1,
nombre en 2 líneas a 14px, precio en Geist Mono a 16px, máximo 1 badge.
El carrusel DEBE dejar el siguiente card cortado entre 20% y 40% (peek).
Calcula el ancho para garantizarlo en 360, 375, 390 y 430px de viewport.
Usa CSS scroll-snap nativo con bleed lateral al borde de la pantalla.

La hoja de producto abre con history.pushState (el botón atrás la cierra),
tiene galería con snap, precio grande y CTA fijo "Preguntar por este producto"
que arma el mensaje de WhatsApp con nombre, precio y enlace del producto.

Productos agotados: grayscale + "Avísame cuando llegue", nunca ocultos.
En >=768px el carrusel se convierte en grilla de 4 columnas.
```

---

## Prompt 4 — Rutas, SSR y datos estructurados
*Adjunta: `08`, `07 §5`.*
```
Implementa las rutas del perfil con SSG+ISR según 08:
/[slug], /[slug]/catalogo, /[slug]/producto/[id], /[slug]/resenas, /r/[token]

Incluye:
- generateMetadata con títulos y descripciones según la plantilla de 08 §3
- JSON-LD: LocalBusiness (subtipo por categoría), Product+Offer, Review,
  FAQPage, BreadcrumbList. Nunca aggregateRating sin reseñas reales.
- Imagen OG dinámica en el borde con logo, nombre, calificación y 3 productos
- /r/[token]: verificación de firma, 302 en menos de 30ms, evento asíncrono
- robots.txt permitiendo GPTBot, PerplexityBot, ClaudeBot, Google-Extended
- /llms.txt en la raíz
- Cache-Control: public, s-maxage=60, stale-while-revalidate=600
```

---

## Prompt 5 — Editor y carga de catálogo
*Adjunta: `07`, `11` (Sprint 2), `02` (reglas de copy).*
```
Implementa el onboarding y el editor del negocio, pensado para alguien que
nunca ha usado un panel de administración, desde un celular.

Prioridad 1: conversión desde un aviso clasificado existente de Buscadis
(nombre, categoría, teléfono, ubicación y fotos pre-llenados; el usuario solo
confirma). Este flujo debe tomar menos de 60 segundos.

Prioridad 2: carga de productos por fotos múltiples. El usuario selecciona 10
fotos, el sistema las procesa (recorte, normalización, compresión, LQIP) y
propone nombre y categoría para cada una; el usuario solo escribe el precio.

Prioridad 3: editor de módulos con arrastrar para ordenar, respetando los
límites del arquetipo (los módulos fijos no se mueven ni se desactivan).

Medidor de completitud con UNA sola tarea siguiente, formulada como beneficio.
```

---

## Prompt de revisión (úsalo después de cada componente)

```
Revisa lo que acabas de construir contra esta lista y corrige lo que falle:
1. ¿Algún valor de color, espaciado o tipografía escrito a mano en vez de token?
2. ¿Están los 4 estados? ¿El vacío se ve digno o parece roto?
3. ¿Contraste AA en todos los textos, incluido sobre imágenes?
4. ¿Todos los objetivos táctiles llegan a 44x44?
5. ¿Funciona con teclado? ¿El foco es visible?
6. ¿Respeta prefers-reduced-motion?
7. ¿Cuánto pesa el JS que añadiste? ¿Se puede hacer con CSS?
8. ¿Los carruseles dejan peek en 360, 375, 390 y 430px?
9. ¿Los textos siguen las reglas de copy (sentence case, verbo concreto, sin "Oops")?
10. ¿Se emiten los eventos de analítica especificados?
Contéstame punto por punto y luego entrega solo los archivos corregidos.
```

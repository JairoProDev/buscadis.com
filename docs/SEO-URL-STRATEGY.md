# Estrategia de URLs (Buscadis)

## Principios (por qué está así)

1. **Una canónica por intención** — Google no castiga `?q=`; castiga duplicar el mismo contenido en muchas URLs sin `canonical`/redirect.
2. **Home = app de browse** — En cliente, `/?categoria=&buscar=&adiso=` mantiene modal, atrás/adelante y filtros sin recargar. En **carga fría** (enlace compartido, crawler), el servidor **redirige** a `/categoria/…` o `/buscar/{slug}` cuando aplica.
3. **Compartir ≠ barra del navegador** — “Copiar link de búsqueda” usa rutas legibles (`getBusquedaUrl`); la barra puede seguir en `/?buscar=` mientras navegas (no es la URL que indexamos).
4. **Adisos estables** — `/a/{id}/{slug}`: el id es la verdad; el slug es legibilidad.
5. **Sitemap** — `sitemap/0.xml` = hubs/categorías; `sitemap/1+` = adisos. **`/sitemap.xml` debe ser índice** de todos los chunks (no solo el 0).

## ¿Importan `?`, `q` y `=` para SEO?

- **No son “malos”.** Google indexa URLs con query string sin problema.
- **Sí importa la canónica:** una sola URL principal por contenido (evitar duplicados).
- **Para humanos** (WhatsApp, carteles, backlinks), rutas legibles suelen tener **mejor CTR** que `?q=...&filtro=...`.

### Búsqueda

| URL | Uso |
|-----|-----|
| `/buscar/empleo-cusco` | **Canónica** al compartir o indexar una búsqueda |
| `/buscar?q=empleo+cusco` | Alias: **redirige 308** a la ruta legible |
| `/?buscar=...` en home | **Redirige** a `/buscar/{slug}` |

El cuadro de búsqueda de Google (JSON-LD `SearchAction`) sigue usando `?q={search_term_string}` porque es el estándar que Google documenta; al entrar, el servidor unifica a la URL legible.

### Categorías

| URL | Uso |
|-----|-----|
| `/categoria/empleos` | **Canónica** |
| `/?categoria=empleos` | **Redirige 308** a `/categoria/empleos` |

### Adisos (avisos)

**Canónica:** `/a/{id}/{titulo-slug}`

| Pregunta | Respuesta |
|----------|-----------|
| ¿Solo el id? | El id es obligatorio para resolver el aviso; el slug es cosmético y SEO-friendly. |
| ¿Incluir categoría en la ruta? | Opcional; ya tienes `/categoria/...` y hubs `/l/cusco/...`. Duplicar `/empleos/{id}` añade mantenimiento y riesgo de duplicados. |
| ¿Nombre del anunciante? | No recomendado (privacidad, cambios de nombre, URLs rotas). |
| ¿Subcategoría? | Solo en landings programáticas si hay volumen; no en cada adiso. |

**Legacy** `/{categoria}/{id}` y rutas largas → redirect a `/a/...`.

### Negocios

**Canónica:** `/@{slug}` (no el id interno).

### Cusco

**Canónica:** `/l/cusco/{categoria}` (indexable si hay ≥ 5 avisos activos en Cusco).

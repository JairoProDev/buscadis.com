# 13 — Design System de Buscadis (archivo para publicar en Claude Design)

> **Este archivo se sube UNA vez, como sistema de diseño de la organización en Claude Design.** No se pega en cada conversación. Anthropic advierte que sin un sistema de diseño publicado, los resultados de Claude Design son "funcionales pero genéricos" — este archivo es lo que separa un resultado genérico de uno que se ve como Buscadis.
>
> Formato pensado para lectura por máquina: reglas cortas, valores exactos, sin narrativa.

---

## 1. Identidad del sistema

**Producto:** Buscadis — marketplace y perfiles comerciales para negocios en Perú.
**Superficie principal:** perfil público de negocio, móvil primero, contenedor máximo 640px centrado.
**Sensación buscada:** aplicación nativa, no página web. Ligera, densa en información útil, sobria.
**Sensación prohibida:** landing page corporativa, plantilla de constructor web, degradados decorativos, glassmorphism, tarjetas gigantes con mucho aire.

**Referencias correctas:** ficha de negocio en Google Maps, ficha de alojamiento en Airbnb, ficha de producto en Mercado Libre, app de WhatsApp Business.
**Referencias incorrectas:** Linktree, plantillas de Wix, dashboards SaaS oscuros con acentos neón, tarjetas digitales con animaciones.

---

## 2. Color

### Chrome (fijo, propiedad de Buscadis)

```
--sf-base    #FBFAFC   fondo de página (blanco con traza violeta)
--sf-elev    #FFFFFF   cards y hojas
--sf-sunk    #F1F0F4   campos, esqueletos
--tx-strong  #131218   títulos
--tx-base    #3A3843   cuerpo
--tx-muted   #6E6B78   metadatos
--tx-faint   #9C99A6   deshabilitado
--bd-hair    rgba(19,18,24,.08)
--bd-soft    rgba(19,18,24,.14)

--ok  #0E7A4F / fondo #E4F5EC     abierto, disponible
--warn #A66A00 / fondo #FDF2DC    por cerrar, últimas unidades
--err #C0243B / fondo #FCEAED     cerrado, agotado
```

Modo oscuro: `--sf-base #0E0D12`, `--sf-elev #191820`, `--sf-sunk #23212C`, `--tx-strong #F7F6FA`, `--tx-base #CFCCD8`. **Nunca negro puro.**

### Acento de plataforma (uso restringido)

```
--bs-chicha  #FF0A78   magenta fluorescente — sello de verificación, marca Buscadis, ADIS AI, punto de estado
--bs-sol     #FFC300   exclusivamente estrellas de calificación
```

Origen: el rosa fluorescente del afiche chicha peruano, la gráfica popular de la publicidad local. Se usa en superficies menores a 40×40px o en trazos. **Nunca como fondo de sección, nunca en botones grandes.**

### Color de marca del negocio

Cada negocio aporta un color semilla. Se deriva en OKLCH con croma limitado a 0.19 y luminosidad forzada al rango 0.42–0.62 (claro). Se usa **solo** en: botón de acción primaria, barra fija, anillo de highlights, enlaces "Ver todos", indicadores activos.
**Nunca** en: fondos de sección, cards, barras de navegación, texto de cuerpo.
Proporción objetivo: **85% chrome / 15% marca**.

---

## 3. Tipografía

```
Display  Bricolage Grotesque Variable   nombre del negocio, títulos de módulo
UI       Geist Sans Variable            todo el texto de interfaz
Datos    Geist Mono                     precios, métricas, horarios, contadores
```

**Los precios siempre en monoespaciada.** Es la firma tipográfica del sistema: hace que un precio se lea como etiqueta y alinee en columna dentro de los carruseles.

| Rol | px / interlínea | Familia / peso |
|---|---|---|
| Nombre del negocio | 26 / 30, `-0.02em` | Display 700 |
| Título de módulo | 17 / 22 | Display 600 |
| Cuerpo | 15 / 22 | UI 400 |
| Nombre en card | 14 / 19 | UI 500 |
| Precio | 16 / 20 | Mono 600 |
| Precio en ficha | 22 / 26 | Mono 600 |
| Metadato | 13 / 18 | UI 400 |
| Etiqueta / badge | 11 / 14, `0.04em`, mayúsculas | UI 600 |

**Mínimo absoluto en el perfil público: 13px. En el editor del negocio: 17px.**

---

## 4. Espaciado, radios, elevación

```
Escala: 4 8 12 16 20 24 32 40 48
Padding lateral de página: 16 · Padding interno de card: 16 · Separación entre módulos: 32
Radios: sm 8 · md 12 · lg 16 · xl 20 · full 999
Elevación 1: 0 1px 2px rgba(19,18,24,.06) + borde hairline
Elevación 2: 0 4px 12px rgba(19,18,24,.08) + borde hairline
Elevación 3 (solo hojas modales): 0 12px 32px rgba(19,18,24,.14)
Objetivo táctil mínimo: 44×44 sin excepción
Movimiento: 120ms botones · 200ms aparición · 280ms hojas · respeta reduced-motion
```

Regla: **primero borde de un píxel, después sombra.** Nada de sombras difusas grandes.

---

## 5. Medidas exactas de componentes

| Elemento | Medida | Nota |
|---|---|---|
| Hero completo | 196–208px de alto | portada 150 + solapa 46 |
| Logo | 64×64, radio 16 | **cuadrado, nunca circular** |
| Card de producto | 156px ancho, imagen 1:1 | 2.1 visibles en 375px |
| Card de producto alto ticket | 248×~230 | imagen 16:9 |
| Card de servicio | 168px | imagen 3:2 |
| Card de reseña | 282px | 3 líneas de texto visibles |
| Highlight circular | 68px ⌀ | anillo 2.5px color de marca |
| Card de publicación | 204px | imagen 1:1 |
| Miniatura de galería | 136px | |
| Barra de acción fija | 64px + safe area | 1 sola acción con color de marca |
| Mapa estático | ancho completo × 160px | imagen, nunca iframe |

**Regla del peek:** en todo carrusel el card siguiente queda cortado entre 20% y 40%. Ningún carrusel donde los cards calcen exactos con el borde.

---

## 6. Reglas de composición

1. Un solo scroll vertical. Sin pestañas. Sin paginación.
2. Una sola acción primaria por pantalla, con el color de marca. Ninguna otra compite.
3. Los carruseles rompen el padding lateral y sangran hasta el borde de la pantalla.
4. Nunca dos carruseles horizontales consecutivos: se intercala un bloque de altura fija.
5. Cabecera de módulo: título a la izquierda, enlace con número real a la derecha ("Ver los 358 →").
6. La información que se compara (horarios, métodos de pago, planes) nunca va en scroll horizontal.
7. Todo módulo se diseña primero vacío. Un módulo vacío no se muestra al visitante.
8. Máximo un badge por card. Máximo dos insignias en el hero.
9. Ubicación, horario y métodos de pago van a ancho completo, apilados, nunca en tres columnas apretadas.
10. Sin sliders automáticos. Sin autoplay con sonido. Sin contadores falsos.

---

## 7. Copy

Español peruano, tuteo, sentence case, verbos concretos, sin signos de exclamación en la interfaz.

| No | Sí |
|---|---|
| Contáctanos | Escribir por WhatsApp |
| Ver más | Ver los 358 productos |
| Enviar | Pedir cotización |
| Oops, algo salió mal | No se pudo cargar el catálogo. Reintentar. |
| Aún no hay productos | Este negocio todavía no publica productos. Escríbele para preguntar. |
| Sobre nosotros | Quiénes somos |

El botón conserva su nombre en todo el flujo: si dice "Pedir cotización", la confirmación dice "Cotización enviada".

---

## 8. Estados obligatorios de todo componente

**Cargando** — esqueleto con la forma real del componente, nunca spinner.
**Vacío** — se ve intencional, no roto; con una invitación concreta a la acción.
**Error** — falla solo ese módulo, el resto de la página se renderiza.
**Lleno** — el caso normal.

Además: **cerrado** (el contacto nunca se bloquea, solo cambia el texto), **agotado** (escala de grises + "Avísame cuando llegue", nunca oculto) y **sin conexión** (última versión guardada).

---

## 9. Accesibilidad

Contraste AA verificado incluso sobre imágenes (degradado de legibilidad obligatorio). Foco visible de 2px. Objetivo táctil de 44px. Carruseles navegables por teclado. Estrellas siempre acompañadas del número. Cambios de estado con `aria-live="polite"`. Todo debe leerse con sol directo en la calle y usarse con una mano.

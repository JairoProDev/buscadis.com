# 03 — Tokens

> Fuente de verdad: `packages/tokens/src/*.json`. Todo lo demás se genera. Ningún valor de este documento se escribe a mano en un componente.

---

## 1. Arquitectura de tres capas

```
CAPA 1 — PRIMITIVOS        adis-600, neutral-100, space-4, radius-md
  valores crudos, sin significado, nunca se usan en un componente
        ↓
CAPA 2 — SEMÁNTICOS        --bs-action, --bs-bg-surface, --bs-fg-muted
  significado de uso; cambian según modo (claro/oscuro) y tema (tenant)
        ↓
CAPA 3 — COMPONENTE        --bs-button-primary-bg, --bs-card-radius
  solo cuando un componente necesita desviarse; se justifica en el PR
```

**Regla de uso:** un componente consume capa 2 (y capa 3 si existe). Consumir capa 1 desde un componente es un error que el lint detecta. *Por qué:* si un botón usa `adis-600` directamente, no se puede tematizar; si usa `--bs-action`, funciona en claro, oscuro y en cualquier storefront sin tocarlo.

**Nomenclatura:** `--bs-{categoría}-{rol}-{variante}-{estado}`
`--bs-bg-surface-2`, `--bs-fg-on-action`, `--bs-border-focus`, `--bs-action-hover`.

---

## 2. Primitivos — color

Generados en OKLCH con matiz constante y luminosidad uniforme. Los hex son el resultado compilado y **se regeneran desde el pipeline**; nunca se editan a mano.

### Rampa de marca `adis` (matiz ~218°, el celeste del logo)

| Paso | Hex | Rol |
|---|---|---|
| 50 | `#F0FAFC` | fondo sutil |
| 100 | `#DAF2F7` | fondo de badge |
| 200 | `#B7E5EF` | borde suave |
| 300 | `#8AD3E4` | acento decorativo |
| **400** | **`#53ACC5`** | **identidad — logo, no para texto ni acción** |
| 500 | `#3796B0` | hover de identidad |
| **600** | **`#2A7C94`** | **acción — pasa AA con blanco** |
| 700 | `#1F6076` | acción presionada |
| 800 | `#1B4E5F` | texto de marca sobre claro |
| 900 | `#163D4A` | |
| 950 | `#0E2530` | |

### Rampa `sol` (amarillo de marca, matiz ~78°)

| Paso | Hex | Rol |
|---|---|---|
| 50 | `#FFF8E8` | fondo sutil |
| 100 | `#FFEFC6` | |
| 200 | `#FFE29A` | |
| 300 | `#FFD06A` | identidad en modo oscuro |
| **400** | **`#FFC24A`** | **identidad — CTA Publicar** |
| 500 | `#F2A81F` | |
| 600 | `#C9820A` | texto ámbar sobre claro |
| 700 | `#9E6206` | |
| 800 | `#7A4A08` | |
| 900 | `#5E3908` | |

**El amarillo nunca lleva texto blanco.** Su par de texto es `--bs-fg-on-warm` = `#10242B`.

### Rampa neutral (fría, con traza del matiz de marca)

| Paso | Hex | | Paso | Hex |
|---|---|---|---|---|
| 0 | `#FFFFFF` | | 500 | `#6E7F8A` |
| 25 | `#FAFCFD` | | 600 | `#55666F` |
| 50 | `#F5F8FA` | | 700 | `#3F4E56` |
| 100 | `#EDF2F5` | | 800 | `#2A353C` |
| 200 | `#DFE7EC` | | 900 | `#1A2227` |
| 300 | `#C7D3DA` | | 950 | `#10161A` |
| 400 | `#9AAAB4` | | | |

*Por qué grises fríos con traza de marca:* un gris con una pizca del matiz de marca cohesiona toda la paleta y evita el aspecto sucio de mezclar grises cálidos y fríos. Elegimos fríos porque la marca es fría.

### Semánticos de estado

| Rol | Claro | Oscuro | Fondo claro | Fondo oscuro |
|---|---|---|---|---|
| Éxito | `#0E7A4F` | `#3DD68C` | `#E4F5EC` | `#0F2A1E` |
| Advertencia | `#A66A00` | `#F0B429` | `#FDF2DC` | `#2C2210` |
| Error | `#C0243B` | `#FF6B81` | `#FCEAED` | `#2E1218` |
| Información | `adis-700` | `adis-300` | `adis-50` | `adis-950` |

*Por qué el error no es el mismo rojo que "productos":* un color de marca o de categoría nunca puede ser también un color semántico, o se vuelve ambiguo. La categoría productos usa rosa `#BE123C`; el error usa `#C0243B` con su propio fondo y siempre con ícono.

---

## 3. Semánticos — superficies y texto

### Modo claro

```css
--bs-bg-canvas:      neutral-50    /* fondo de página */
--bs-bg-surface:     neutral-0     /* tarjetas */
--bs-bg-surface-2:   neutral-25    /* superficie anidada */
--bs-bg-sunken:      neutral-100   /* campos, esqueletos */
--bs-bg-overlay:     rgba(16,22,26,.48)

--bs-fg-default:     neutral-900
--bs-fg-muted:       neutral-600
--bs-fg-subtle:      neutral-500   /* mínimo que pasa AA sobre surface */
--bs-fg-disabled:    neutral-400
--bs-fg-on-action:   #FFFFFF
--bs-fg-on-warm:     #10242B

--bs-border-subtle:  neutral-200
--bs-border-default: neutral-300
--bs-border-strong:  neutral-400
--bs-border-focus:   adis-600

--bs-action:         adis-600
--bs-action-hover:   adis-700
--bs-action-active:  adis-800
--bs-action-subtle:  adis-50
--bs-identity:       adis-400      /* solo logo y acentos decorativos */
```

**Nota crítica:** `--bs-fg-subtle` es el tono más claro permitido para texto. `neutral-400` sobre blanco no llega a 4.5:1 y por eso solo se usa para texto deshabilitado, que está exento.

### Modo oscuro

Elevación por luminosidad, no por sombra: en oscuro las sombras no se ven, así que la superficie más elevada es la más clara.

```css
--bs-bg-canvas:      #12171B
--bs-bg-surface:     #1A2126
--bs-bg-surface-2:   #232C33
--bs-bg-sunken:      #0E1317
--bs-bg-overlay:     rgba(0,0,0,.64)

--bs-fg-default:     #E9EEF2   /* nunca blanco puro: evita halación */
--bs-fg-muted:       #A9B6BF
--bs-fg-subtle:      #8494A0
--bs-fg-on-action:   #08171D

--bs-border-subtle:  rgba(255,255,255,.08)
--bs-border-default: rgba(255,255,255,.14)

--bs-action:         adis-300   /* en oscuro sube la luminosidad y baja el croma */
--bs-fg-on-action:   #08171D    /* tinta sobre acción clara */
--bs-identity:       #6EC0D8
```

*Por qué el modo oscuro invierte el par acción/texto:* sobre fondo oscuro, un color de acción oscuro es invisible. Se sube la luminosidad de la acción y el texto encima pasa a ser tinta. Es un rediseño de la tabla de tokens, no una inversión.

---

## 4. Espaciado

Escala de 4px, completa (hoy faltan 7, 9, 10, 12 y 14).

| Token | px | Uso típico |
|---|---|---|
| `space-0` | 0 | |
| `space-1` | 4 | separación intra-elemento (ícono↔texto) |
| `space-2` | 8 | |
| `space-3` | 12 | gap de rejilla móvil |
| `space-4` | 16 | padding de tarjeta, padding lateral de página |
| `space-5` | 20 | |
| `space-6` | 24 | separación entre bloques |
| `space-8` | 32 | separación entre secciones |
| `space-10` | 40 | |
| `space-12` | 48 | |
| `space-16` | 64 | |
| `space-20` | 80 | |

**Regla de proximidad:** dentro de un componente se usan 4/8/12; entre componentes 16/24; entre secciones 32/48. Saltos claros producen agrupación perceptual; una escala continua produce sopa.

Se eliminan los valores custom `18` y `88–144` de Tailwind: no pertenecen a ninguna escala.

---

## 5. Radios

| Token | px | Uso |
|---|---|---|
| `radius-xs` | 4 | badges, chips pequeños |
| `radius-sm` | 8 | inputs, botones pequeños |
| `radius-md` | 12 | botones, tarjetas pequeñas |
| `radius-lg` | 16 | tarjetas, contenedores |
| `radius-xl` | 20 | hojas modales |
| `radius-2xl` | 28 | hojas de pantalla completa |
| `radius-full` | 9999 | avatares, pills |

Tema de tenant: `sharp` resta 8 (con piso en 0), `rounded` usa la escala, `pill` sube a `radius-full` en botones y chips.

---

## 6. Elevación

Cinco niveles. En claro: sombra + borde hairline. En oscuro: cambio de superficie + borde.

| Nivel | Uso | Claro | Oscuro |
|---|---|---|---|
| 0 | canvas | ninguna | `bg-canvas` |
| 1 | tarjeta en reposo | `0 1px 2px rgba(16,22,26,.06)` + borde | `bg-surface` |
| 2 | tarjeta activa, dropdown | `0 4px 12px rgba(16,22,26,.08)` + borde | `bg-surface-2` |
| 3 | popover, hoja | `0 12px 32px rgba(16,22,26,.12)` | `bg-surface-2` + borde |
| 4 | modal, diálogo | `0 24px 64px rgba(16,22,26,.18)` | `bg-surface-2` + borde fuerte |

Se elimina la sombra tintada de marca (`--shadow-lg` tinted): una sombra de color satura la interfaz y no aporta jerarquía. La marca vive en el acento, no en la sombra.

**Anillo de foco (token propio, no una sombra):**
`--bs-focus-ring: 0 0 0 2px var(--bs-bg-surface), 0 0 0 4px var(--bs-border-focus)`
El doble anillo garantiza visibilidad sobre cualquier fondo, incluido dentro de tarjetas.

---

## 7. Z-index

Hoy hay valores ad-hoc (900, 1000, y un forzado a 1 con modal abierto). Escala cerrada:

| Token | Valor | Uso |
|---|---|---|
| `z-base` | 0 | contenido |
| `z-raised` | 10 | tarjeta elevada, chips flotantes |
| `z-sticky` | 100 | buscador adherido, barra de secciones |
| `z-header` | 200 | header |
| `z-nav` | 300 | navegación inferior |
| `z-dropdown` | 400 | popovers |
| `z-overlay` | 500 | fondo de modal |
| `z-modal` | 600 | modales, hojas |
| `z-toast` | 700 | notificaciones |
| `z-tooltip` | 800 | |

Ningún número fuera de la escala. El truco actual de bajar header y sticky a `z-index: 1` cuando hay modal abierto desaparece: con la escala, el overlay siempre queda encima.

---

## 8. Movimiento (resumen; detalle en `10`)

```
--bs-dur-instant: 100ms   --bs-ease-out:   cubic-bezier(0, 0, .2, 1)
--bs-dur-fast:    150ms   --bs-ease-inout: cubic-bezier(.4, 0, .2, 1)
--bs-dur-normal:  250ms   --bs-ease-smooth:cubic-bezier(.16, 1, .3, 1)
--bs-dur-slow:    400ms   --bs-spring:     stiffness 260 / damping 20 / mass 1
```

---

## 9. Breakpoints y contenedores

| Token | px | Realidad que representa |
|---|---|---|
| `base` | 360 | Android de gama media — **dispositivo de referencia** |
| `sm` | 480 | teléfono grande |
| `md` | 768 | tablet vertical |
| `lg` | 1024 | tablet horizontal / laptop chica |
| `xl` | 1280 | escritorio |
| `2xl` | 1536 | escritorio ancho |

| Contenedor | Ancho máx | Uso |
|---|---|---|
| `container-prose` | 640 | perfil de negocio, lectura |
| `container-feed` | 480 | modo feed de avisos |
| `container-app` | 1440 | shell del marketplace |
| `container-panel` | 420 | panel de detalle en escritorio |

Se añade `sm: 480` que el spec pedía y Tailwind no tenía.

---

## 10. Densidad

Dos modos, tokenizados a nivel de sistema (no solo del storefront):

| Token | Compacto | Cómodo |
|---|---|---|
| `--bs-density-gap` | 8px | 16px |
| `--bs-density-pad` | 12px | 16px |
| `--bs-density-row` | 44px | 52px |

Compacto por defecto en rejillas de avisos (más resultados a la vista = más comparación). Cómodo por defecto en el editor y en el perfil de negocio.

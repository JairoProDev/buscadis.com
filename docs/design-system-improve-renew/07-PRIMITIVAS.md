# 07 — Primitivas

> 18 primitivas. Ninguna feature nueva puede introducir su propio botón, modal o campo. Construir estas 18 antes de tocar cualquier pantalla es lo que convierte 265 componentes ad-hoc en un sistema.

**Stack:** Radix UI (comportamiento y accesibilidad) + CVA (variantes tipadas) + Tailwind generado desde tokens.
*Por qué Radix:* trampa de foco, roles ARIA, navegación por teclado, cierre con Esc, restauración de foco y portales ya están resueltos y probados. Reescribir eso es semanas de trabajo y garantía de bugs de accesibilidad.

---

## 1. Contrato común

Toda primitiva cumple:

**Consume solo tokens semánticos.** Ningún hex, ningún px suelto.
**Expone `className` y hace merge con `cn()`.** Sin `!important` interno.
**Reenvía la ref y las props nativas.** `forwardRef` siempre; una primitiva que no acepta `onKeyDown` es una primitiva rota.
**Tiene estados completos:** reposo, hover, foco visible, activo, deshabilitado, cargando, error cuando aplique.
**Es accesible por teclado** y tiene anillo de foco visible con el token `--bs-focus-ring`.
**Respeta `prefers-reduced-motion`.**
**Renderiza en servidor.** Si necesita JS para mostrar contenido, lo mostrado por defecto debe ser útil.
**No decide su propio margen.** El espaciado lo pone el contenedor. *Por qué:* un componente con margen propio es incomponible; es la causa número uno de peleas de CSS.

---

## 2. Las 18

### Button

```tsx
variant: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'publish'
size:    'sm' | 'md' | 'lg'
state:   loading | disabled
extras:  iconLeft, iconRight, fullWidth, asChild
```

| Variante | Fondo | Texto | Cuándo |
|---|---|---|---|
| primary | `--bs-action` | `--bs-fg-on-action` | una por pantalla |
| secondary | `--bs-bg-surface` + borde | `--bs-fg-default` | acciones alternativas |
| ghost | transparente | `--bs-fg-default` | acciones terciarias, barras de íconos |
| destructive | `--bs-danger` | blanco | eliminar, cancelar plan |
| publish | gradiente `sol` | `--bs-fg-on-warm` | exclusivo del CTA Publicar |

Alturas: sm 36 / md 44 / lg 52. **Ningún botón por debajo de 36px, y ningún botón interactivo aislado por debajo de 44px de área tocable.**
En `loading`: el ancho no cambia (se reserva el espacio del texto), el spinner reemplaza el ícono, el botón queda `aria-busy`. *Por qué:* un botón que cambia de tamaño al cargar produce salto de layout y clics en el elemento equivocado.

### IconButton
Envuelve `Button` con `aria-label` obligatorio (falla en tipos si falta). Tamaños 36/44/52 con ícono 20/24/24.

### Input / Textarea
Alto 44 (md) y 52 (lg). Borde `--bs-border-default`, foco con anillo, error con borde `--bs-danger` + mensaje asociado por `aria-describedby`.
`inputMode` y `autoComplete` correctos por tipo — en móvil, un campo de precio que no abre el teclado numérico cuesta conversiones. Los campos de precio usan `inputMode="decimal"` y prefijo `S/` visual, no dentro del valor.
**El placeholder nunca reemplaza a la etiqueta.** Desaparece al escribir y deja al usuario sin contexto.

### Select
Radix Select. En móvil se degrada a `<select>` nativo si el listado supera 12 opciones: la rueda nativa de iOS y Android es más rápida que cualquier lista custom.

### Checkbox / Switch
Checkbox para selección múltiple; Switch solo para activar/desactivar algo que surte efecto inmediato. *Por qué distinguirlos:* un switch dentro de un formulario que necesita "Guardar" es un error de expectativa clásico.

### Radio Group
Máximo 5 opciones visibles; más allá, Select.

### Modal / Dialog
Radix Dialog. Escritorio: centrado, ancho máx 480/640. Móvil: **hoja inferior** con `border-radius` superior 20, arrastre para cerrar, altura máx 92vh.
`history.pushState` para que el botón atrás del teléfono cierre la hoja. *Por qué:* en Android, el botón físico atrás es el gesto de cierre esperado; si sale de la app, se pierde la sesión.

### Drawer
Lateral en escritorio (420px, el ancho del panel de detalle), inferior en móvil.

### Popover / DropdownMenu / Tooltip
Radix. Tooltip **solo en escritorio**: en táctil no hay hover y un tooltip táctil es un patrón roto. Si la información es necesaria, va como texto, no como tooltip.

### Toast
Un solo sistema, apilado abajo en móvil y abajo-derecha en escritorio. Máximo 3 visibles. Duración 5s, 8s si tiene acción. Nunca bloquea la navegación inferior.

### Badge
```tsx
variant: 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'category'
size: 'sm' | 'md'
```
Siempre con texto o ícono, nunca solo color. Máximo uno por tarjeta (principio 3 de `02`).

### Chip
Interactivo, para filtros. Estados: reposo, seleccionado, deshabilitado. Con contador opcional. Alto 36, radio full.

### Avatar
1:1, con recurso de iniciales sobre color derivado del nombre cuando no hay foto. **Nunca una silueta genérica gris:** las iniciales dan identidad y peso visual, la silueta comunica ausencia.

### Skeleton
Con la forma real del contenido, no rectángulos genéricos. Animación de onda que se detiene con `prefers-reduced-motion`. *Por qué la forma real:* reduce el salto perceptual al cargar y hace que la espera se sienta más corta.

### Spinner
Solo para acciones puntuales dentro de un botón o un bloque pequeño. **Nunca para cargar una pantalla completa** — ahí van esqueletos.

### EmptyState
```tsx
{ icon, title, description, action?, variant: 'first-run' | 'no-results' | 'error' | 'offline' }
```
Es una primitiva, no un caso especial: en un marketplace joven es la pantalla más frecuente. `first-run` invita a crear; `no-results` sugiere cómo ampliar la búsqueda (quitar filtros, ampliar radio); `error` explica qué pasó y ofrece reintentar; `offline` muestra la última versión guardada.

### Tabs
Solo cuando el contenido es realmente paralelo y comparable. **No para dividir un scroll largo** — ahí va navegación por anclas. Con teclado (flechas) y `aria-controls`.

### Sheet de acciones (ActionSheet)
Móvil, para 3–6 acciones sobre un elemento. Reemplaza los menús de tres puntos con listas largas.

---

## 3. Lo que deliberadamente no construimos

**Accordion propio:** `<details>/<summary>` nativo cubre el caso, es accesible por defecto y su contenido está en el HTML aunque esté colapsado —lo que importa para SEO y para que un modelo de lenguaje lo lea—. Se estiliza, no se reimplementa.

**Carrusel con librería:** CSS `scroll-snap` nativo resuelve el 100% del caso y pesa cero. Las librerías de carrusel están entre las dependencias más pesadas e innecesarias del ecosistema.

**Date picker propio:** `<input type="date">` nativo hasta que haya una necesidad demostrada (rangos, disponibilidad). El nativo es mejor en móvil que casi cualquier implementación custom.

**Sistema de grid propio:** CSS Grid con tokens de gap alcanza.

---

## 4. Orden de construcción

Por frecuencia de uso real en el producto actual:

1. Button, IconButton, Icon
2. Input, Textarea, Select
3. Modal/Sheet, Drawer
4. Badge, Chip, Avatar
5. Skeleton, Spinner, EmptyState
6. Toast, Popover, DropdownMenu, Tooltip
7. Checkbox, Switch, RadioGroup, Tabs, ActionSheet

Las primeras cinco cubren aproximadamente el 80% de las apariciones de UI en el repo actual. Con eso ya se puede empezar a migrar pantallas.

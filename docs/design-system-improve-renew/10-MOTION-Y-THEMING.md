# 10 — Movimiento y theming

---

## 1. Filosofía de movimiento

El movimiento en Buscadis tiene tres trabajos y ninguno más: **orientar** (de dónde vino y a dónde va este elemento), **confirmar** (algo pasó al tocar) y **mantener el contexto** (una hoja que sube desde donde la tocaste). Cualquier animación que no haga una de esas tres cosas es decoración y se elimina.

**El presupuesto es real.** Framer Motion aparece hoy en ~30 componentes, incluidos los filtros, donde la velocidad importa más que la elegancia. Cada uno arrastra JavaScript y trabajo en el hilo principal en dispositivos que no lo tienen de sobra.

**Regla de asignación:**

| Caso | Herramienta |
|---|---|
| Cambio de estado (hover, foco, activo, abrir/cerrar simple) | Transición CSS |
| Aparición y desaparición de elementos | Transición o animación CSS |
| Gesto continuo (arrastrar hoja, deslizar historia) | Framer Motion |
| Transición entre vistas | View Transitions API, con reserva CSS |
| Reordenar por arrastre | `@dnd-kit` (ya presente) |

*Por qué:* CSS corre en el hilo de composición y no compite con React. Framer Motion se justifica cuando hay física o gesto — no para desvanecer un panel de filtros.

---

## 2. Tokens de movimiento

```css
--bs-dur-instant: 100ms;   /* feedback de toque */
--bs-dur-fast:    150ms;   /* hover, foco, chips */
--bs-dur-normal:  250ms;   /* entrada/salida de elementos */
--bs-dur-slow:    400ms;   /* hojas, transición de vista */

--bs-ease-out:    cubic-bezier(0, 0, .2, 1);      /* entra */
--bs-ease-in:     cubic-bezier(.4, 0, 1, 1);      /* sale */
--bs-ease-inout:  cubic-bezier(.4, 0, .2, 1);     /* se mueve dentro de la pantalla */
--bs-ease-smooth: cubic-bezier(.16, 1, .3, 1);    /* hojas, gestos */

--bs-spring:      { stiffness: 260, damping: 20, mass: 1 }  /* el actual, se conserva */
```

**Asimetría entrada/salida:** lo que entra usa `ease-out` y dura más; lo que sale usa `ease-in` y dura menos. Salir rápido se percibe como capacidad de respuesta; entrar despacio se percibe como suavidad.

**Techo de 400ms.** Por encima, se percibe como lentitud del sistema, no como elegancia. La regla de Doherty (400ms) es el límite práctico donde la atención se mantiene.

**Solo se animan `transform` y `opacity`.** Animar `width`, `height`, `top` o `box-shadow` fuerza layout y repintado en cada fotograma.

---

## 3. Movimiento reducido: soft kill, no hard kill

Hoy `prefers-reduced-motion` mata todo con `0.01ms !important`. Es seguro pero elimina también el feedback que ayuda a entender qué pasó.

**Política nueva:** se desactivan movimiento espacial, parallax, autoplay, rotación continua y efectos de escala. Se conservan los cambios de opacidad de hasta 150ms, que no provocan malestar vestibular y sí comunican estado.

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    scroll-behavior: auto !important;
  }
  /* se permite explícitamente el desvanecido corto */
  .motion-safe-fade { transition: opacity 150ms linear !important; }
}
```

*Por qué:* WCAG 2.3.3 pide poder desactivar el movimiento **no esencial**, no todo el feedback. Un producto sin ninguna respuesta visual se siente roto para todos, incluidos quienes activaron la preferencia.

**Además:** `prefers-reduced-transparency` desactiva el glass y `prefers-contrast: more` sube los bordes a `border-strong` y el texto de soporte a `fg-default`.

---

## 4. Animaciones del sistema

| Nombre | Uso | Implementación |
|---|---|---|
| Toque | escala 0.98 al presionar | CSS 100ms |
| Aparición de tarjeta | opacidad + 8px de desplazamiento | CSS 250ms, escalonado máx 4 elementos |
| Hoja inferior | desplazamiento + fondo | Framer Motion (gesto) |
| Esqueleto | onda de brillo | CSS 1.4s, se detiene con reduced-motion |
| Anillo de historia | pulso al haber contenido nuevo | CSS 2s |
| Punto de estado en vivo | pulso suave | CSS 2s — único elemento con animación infinita permitido |
| Cambio de tema | 250ms de color y fondo | clase temporal en `<html>`, se conserva |

**Se elimina:** el borde cónico animado del buscador en móvil (repinta continuamente), `float` de 3s, `glow-pulse`, y el escalonado en listas de más de 4 elementos (con 20 tarjetas, el escalonado se convierte en espera).

---

## 5. Arquitectura de theming

Cuatro dimensiones independientes que no deben mezclarse:

```
MODO        claro | oscuro | auto        → remapea la capa semántica
TEMA        buscadis | tenant             → cambia acción e identidad
DENSIDAD    compacta | cómoda             → cambia gaps y alturas de fila
CONTRASTE   normal | alto                 → cambia bordes y texto de soporte
```

Cada una es un atributo de datos independiente:

```html
<html data-mode="dark" data-density="comfortable">
  <div data-tenant="cristalimag" data-theme-radius="rounded"> … </div>
</html>
```

**Por qué atributos de datos y no clases:** se combinan sin explosión combinatoria, se pueden consultar por CSS con especificidad predecible, y evitan el problema actual de tener `dark`, `dark-mode` y `light-mode` conviviendo con reglas distintas.

**Un solo camino para el modo claro.** Se elimina `.light-mode`. La preferencia vive en `localStorage.bsMode` con valores `light | dark | auto`, aplicada por el script inline anti-FOUC que ya existe.

**Alcance del tenant:** el tema del negocio se aplica dentro de `[data-tenant]` y solo puede tocar los cinco tokens del contrato (`04 §5`). Nunca sale de su scope, nunca redefine tokens globales.

---

## 6. Rendimiento del theming

El cambio de modo aplica una clase de transición durante 250ms y la retira, en lugar de dejar transiciones permanentes sobre color y fondo en todos los elementos. Dejarlas permanentes provoca que cada hover arrastre una transición de color innecesaria en cientos de nodos.

El script anti-FOUC se mantiene en línea y por encima de todo, sin dependencias. Es de las pocas cosas que justifican JavaScript bloqueante.

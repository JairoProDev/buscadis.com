# 15 — Accesibilidad y rendimiento

> Aquí no hay recomendaciones: hay umbrales. Todo lo de este documento se verifica en CI.

---

## 1. Nivel objetivo

**WCAG 2.2 nivel AA**, con dos criterios de AAA adoptados voluntariamente porque el contexto de uso lo justifica: objetivo táctil de 44px (2.5.5) y contraste elevado en texto de soporte. *Por qué:* tus usuarios operan con una mano, en movimiento, con sol directo, en pantallas baratas. El nivel AA está calibrado para condiciones de oficina.

---

## 2. Requisitos verificables

| Requisito | Umbral | Verificación |
|---|---|---|
| Contraste de texto | 4.5:1 | script sobre `tokens.json` + axe |
| Contraste de texto grande (≥24px o ≥19px bold) | 3:1 | idem |
| Contraste de componentes y bordes | 3:1 | idem |
| Objetivo táctil | 44×44 CSS px | Playwright sobre elementos interactivos |
| Foco visible | anillo doble de 2px+2px | axe + revisión de historias |
| Orden de tabulación | lógico, sin trampas | prueba manual por ruta |
| Navegación solo con teclado | todas las acciones alcanzables | prueba manual por sprint |
| Etiquetas de formulario | siempre visibles y asociadas | axe |
| Nombre accesible en botones de ícono | `aria-label` obligatorio | tipos + axe |
| Color como única señal | prohibido | revisión en Storybook |
| Jerarquía de encabezados | un `h1`, sin saltos | axe |
| Idioma | `lang="es-PE"` | axe |
| Movimiento reducido | política soft de `10 §3` | prueba manual |
| Zoom de texto al 200% | sin pérdida de contenido | prueba manual |
| Orientación | funciona en vertical y horizontal | prueba manual |

---

## 3. Accesibilidad específica del contexto peruano

**Sol directo.** El texto de soporte apunta a 4.5:1 aunque la norma permita menos en tamaños grandes. Los estados en gris claro (`neutral-400`) solo se usan para deshabilitado.

**Pantallas de baja densidad.** Nada por debajo de 12px, y 12px solo en etiquetas de una palabra. El grosor de ícono se ajusta por tamaño (`06 §2`) porque en @1x un trazo de 1.5px a 16px desaparece.

**Uso con una mano.** Las acciones importantes viven en la mitad inferior de la pantalla. Nada crítico en la esquina superior derecha, que es la zona más difícil de alcanzar en un teléfono grande.

**Conexión intermitente.** Todo estado de carga debe poder fallar con gracia; ninguna pantalla queda en blanco esperando.

**Alfabetización digital variable.** Sin gestos ocultos: nada que dependa exclusivamente de deslizar, presionar largo o pellizcar. Todo gesto tiene un equivalente visible.

---

## 4. Presupuestos de rendimiento

Dispositivo de referencia: Android de gama media, 4G simulada, 360px de ancho.

| Métrica | Presupuesto | Ruta |
|---|---|---|
| LCP | < 1.8 s | home, listado, aviso, perfil |
| INP | < 200 ms | todas |
| CLS | < 0.05 | todas |
| TTFB | < 600 ms | todas |
| JS transferido | < 200 KB (home) / < 180 KB (perfil) | |
| CSS | < 45 KB | |
| Fuentes | < 30 KB | solo Archivo, subconjuntada |
| HTML inicial | < 120 KB | |
| Peso total del primer render | < 700 KB | |

**Prohibido en la ruta crítica:** iframe de Google Maps (imagen estática en su lugar, ~400 KB ahorrados), librerías de carrusel (CSS nativo), librerías de animación para cambios de estado (CSS), fuentes desde CDN (self-hosted), analítica bloqueante, video en el hero, y `backdrop-filter` en más de dos superficies simultáneas.

---

## 5. Técnicas obligatorias

**`content-visibility: auto` con `contain-intrinsic-size`** en los bloques bajo el pliegue: evita renderizar lo que no se ve sin provocar saltos.

**Imágenes con `width` y `height` siempre**, `fetchpriority="high"` solo en la imagen del LCP, `loading="lazy"` en el resto, `sizes` correcto.

**Server Components por defecto.** `'use client'` es una excepción que se justifica. Es la palanca principal para bajar el JavaScript y la única forma de resolver el problema de indexación.

**Sin cascadas de peticiones.** Una sola petición devuelve lo necesario para el primer render.

---

## 6. Puertas de CI

```
tokens:contrast     → falla si algún par en uso < mínimo
a11y:storybook      → axe en todas las historias; falla con violación seria o crítica
a11y:routes         → axe sobre 5 rutas clave renderizadas
size:limit          → falla si se supera el presupuesto de JS o CSS
lhci                → falla si LCP > 1.8s o CLS > 0.05
lint:no-raw-hex     → falla si hay color literal fuera de tokens
lint:icons          → falla si se importa un ícono fuera del registry
e2e:touch-targets   → falla si un elemento interactivo mide < 44×44
```

---

## 7. Cómo se prueba de verdad

Las herramientas automáticas detectan aproximadamente entre un tercio y la mitad de los problemas reales de accesibilidad. El resto solo aparece usando el producto.

**Rutina por sprint, una hora:**
Navegar la ruta principal solo con teclado. Recorrerla con TalkBack en Android. Subir el texto del sistema al 200% y verificar que nada se corta. Activar movimiento reducido y confirmar que el producto sigue siendo comprensible. Abrir la app en la calle al mediodía y confirmar qué se lee.

Esa última prueba es la que más decisiones va a cambiar y la única que ninguna herramienta puede reemplazar.

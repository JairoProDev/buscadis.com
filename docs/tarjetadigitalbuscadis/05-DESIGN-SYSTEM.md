# 05 — Design System del Perfil Vivo

> **CONTEXTO PARA LA IA:** implementa exactamente estos tokens como variables CSS y como objeto TypeScript. Ningún valor de color, espaciado, radio o tipografía puede quedar escrito a mano en un componente. Si necesitas un valor que no está aquí, es señal de que el diseño está mal, no de que falte un token.

---

## 1. Dirección visual (y por qué)

El perfil tiene dos capas visuales que nunca se mezclan:

**El chrome** (barras, fondos, texto, bordes, íconos del sistema) pertenece a Buscadis. Es neutro, sobrio y consistente entre todos los perfiles. Es lo que hace que un usuario reconozca "esto es un negocio de Buscadis" y transfiera confianza de un perfil a otro.

**La marca del negocio** (color de acento, portada, logo) pertenece al cliente. Ocupa poco espacio pero en los lugares de máxima atención: la acción primaria, los acentos, los badges, la portada.

La proporción es aproximadamente **70% chrome / 30% marca** (Visual 2.0; antes 85/15). La marca gana superficie en hero inmersivo, CTAs táctiles y anillos de highlight — no en fondos de sección ni en texto de cuerpo. Pintar todo del color del negocio sigue siendo amateur e ilegible.

**El acento de plataforma** — el color con que se marca lo que es de Buscadis (verificación, sello, ADIS AI, elementos del feed) — es un magenta fluorescente. La razón no es estética sino cultural: el rosa fluorescente sobre negro es la vernácula gráfica de la publicidad popular peruana, el afiche chicha que se pega en los postes y en los muros. Buscadis digitaliza exactamente eso. Es un color que en Perú significa "aquí se anuncia algo", y ninguna plataforma internacional lo va a usar. Se emplea con extrema restricción: nunca en superficies grandes, solo en sellos, indicadores y en el punto vivo del estado.

---

## 2. Tokens de color — chrome

```css
:root {
  /* Superficies — claro */
  --sf-base:        #FBFAFC;   /* fondo de página, blanco con traza violeta */
  --sf-elev:        #FFFFFF;   /* cards, hojas modales */
  --sf-sunk:        #F1F0F4;   /* campos, esqueletos, separadores de bloque */
  --sf-inverse:     #131218;

  /* Texto */
  --tx-strong:      #131218;   /* títulos */
  --tx-base:        #3A3843;   /* cuerpo */
  --tx-muted:       #6E6B78;   /* metadatos, etiquetas */
  --tx-faint:       #9C99A6;   /* placeholders, deshabilitado */
  --tx-inverse:     #FBFAFC;

  /* Bordes */
  --bd-hair:        rgba(19,18,24,.08);
  --bd-soft:        rgba(19,18,24,.14);
  --bd-strong:      rgba(19,18,24,.24);

  /* Semánticos */
  --ok:             #0E7A4F;   /* abierto, disponible */
  --ok-sf:          #E4F5EC;
  --warn:           #A66A00;   /* por cerrar, últimas unidades */
  --warn-sf:        #FDF2DC;
  --err:            #C0243B;   /* cerrado, agotado */
  --err-sf:         #FCEAED;

  /* Plataforma Buscadis (uso restringido) */
  --bs-chicha:      #FF0A78;
  --bs-chicha-sf:   #FFE7F0;
  --bs-sol:         #FFC300;   /* solo estrellas de calificación */
  --bs-ink:         #131218;
}

[data-theme="dark"] {
  --sf-base:  #0E0D12;
  --sf-elev:  #191820;
  --sf-sunk:  #23212C;
  --tx-strong:#F7F6FA;
  --tx-base:  #CFCCD8;
  --tx-muted: #9794A2;
  --tx-faint: #6A6775;
  --bd-hair:  rgba(255,255,255,.10);
  --bd-soft:  rgba(255,255,255,.16);
  --ok: #3DD68C; --ok-sf: #0F2A1E;
  --warn:#F0B429; --warn-sf:#2C2210;
  --err: #FF6B81; --err-sf:#2E1218;
}
```

**Nota sobre el modo oscuro:** el fondo nunca es negro puro. `#0E0D12` mantiene la traza violeta del sistema y evita el efecto "OLED barato" de los mockups actuales, donde el negro puro con oro hace que las fotos parezcan flotar recortadas.

---

## 3. Motor de temas de marca

El negocio elige **un color semilla**. El sistema deriva todo lo demás. Nunca se aceptan colores libres en el chrome.

```ts
// tema.ts — derivación en OKLCH, contraste garantizado
import { converter, formatHex, wcagContrast } from 'culori';

export function derivarTema(semillaHex: string, modo: 'light'|'dark') {
  const oklch = converter('oklch');
  let { l, c, h } = oklch(semillaHex)!;

  // 1. Limitar croma: los colores hiper-saturados que suben los clientes
  //    (verde neón, rojo puro) destruyen la legibilidad.
  c = Math.min(c ?? 0, 0.19);

  // 2. Anclar luminosidad al rango utilizable para superficies de acción
  const lAccion = modo === 'light'
    ? Math.min(Math.max(l ?? .5, 0.42), 0.62)
    : Math.min(Math.max(l ?? .5, 0.55), 0.74);

  const mk = (L: number, C = c) => formatHex({ mode:'oklch', l:L, c:C, h });

  const accion = mk(lAccion);
  // 3. Texto sobre la acción: elegir blanco o tinta según contraste real
  const sobreAccion = wcagContrast(accion, '#FFFFFF') >= 4.5 ? '#FFFFFF' : '#131218';

  return {
    '--mk-accion':      accion,                    // botón primario, barra fija
    '--mk-accion-hover':mk(lAccion - 0.06),
    '--mk-sobre':       sobreAccion,
    '--mk-suave':       mk(modo==='light' ? 0.95 : 0.22, Math.min(c, 0.06)), // fondos de badge
    '--mk-texto':       mk(modo==='light' ? 0.42 : 0.78),  // texto de marca sobre chrome, AA garantizado
    '--mk-borde':       mk(modo==='light' ? 0.86 : 0.34, Math.min(c, 0.08)),
  };
}
```

**Reglas de uso del color de marca:**
- Botón de acción primaria y barra fija: sí.
- Íconos de acciones rápidas, enlaces "Ver todos", indicadores activos: sí, usando `--mk-texto`.
- Fondos de sección, cards, barras de navegación, texto de cuerpo: **nunca**.
- Portada: la imagen es del negocio; el degradado de legibilidad encima es del sistema (`linear-gradient(180deg, transparent 0%, rgba(0,0,0,.72) 78%)`), con verificación automática de contraste sobre la zona del texto.

**Paletas sugeridas por rubro** (para onboarding rápido, el negocio elige de aquí o abre el selector):
Ferretería `#1F4FD8` · Comida `#C7401A` · Belleza `#7A2FBF` · Salud `#0B7C8C` · Legal `#1B3A6B` · Vivero `#1E7A3E` · Inmobiliaria `#0E2A47` · Moda `#B0186B`.

---

## 4. Tipografía

Tres roles, tres cortes. Todo self-hosted, variable, subconjunto `latin + latin-ext`, `font-display: swap`, con precarga solo del archivo de UI.

| Rol | Fuente | Uso | Peso |
|---|---|---|---|
| Display | **Bricolage Grotesque Variable** | Nombre del negocio, títulos de módulo | ~34 KB |
| UI / cuerpo | **Geist Sans Variable** | Todo el texto de interfaz | ~38 KB |
| Datos | **Geist Mono** | Precios, métricas, horarios, contadores | ~22 KB (subconjunto de dígitos + símbolos) |

**Por qué Mono en los precios:** un precio en monoespaciada se lee como una etiqueta, no como texto. Alinea verticalmente en los carruseles, hace comparable la columna de precios y da al perfil una firma tipográfica que ningún competidor tiene. Es el detalle más barato y más reconocible del sistema.

```css
--ff-display: 'Bricolage Grotesque', ui-sans-serif, system-ui, sans-serif;
--ff-ui:      'Geist Sans', ui-sans-serif, system-ui, -apple-system, sans-serif;
--ff-data:    'Geist Mono', ui-monospace, 'SF Mono', monospace;
```

**Escala** (base 16px, ratio ~1.2, todos con `font-variant-numeric: tabular-nums` en los roles de datos):

| Token | px / line-height | Uso |
|---|---|---|
| `--ts-nombre` | 26 / 30, display, 700, `-0.02em` | Nombre del negocio |
| `--ts-modulo` | 17 / 22, display, 600 | Título de módulo |
| `--ts-cuerpo` | 15 / 22, ui, 400 | Texto general |
| `--ts-card` | 14 / 19, ui, 500 | Nombre de producto |
| `--ts-precio` | 16 / 20, data, 600 | Precio |
| `--ts-precio-lg` | 22 / 26, data, 600 | Precio en ficha de producto |
| `--ts-meta` | 13 / 18, ui, 400 | Metadatos, fechas |
| `--ts-etiqueta` | 11 / 14, ui, 600, `0.04em`, mayúsculas | Badges |

**Mínimo absoluto: 13px.** Nada por debajo, en ningún componente, en ningún estado. Los mockups actuales tienen texto de 10–11px en las stats y en los pies de highlight: ilegible con sol directo, que es exactamente la condición en la que se usa un teléfono en la calle en Cusco.

---

## 5. Espaciado, radios, elevación, movimiento

```css
/* Espaciado — escala de 4 */
--sp-1:4px; --sp-2:8px; --sp-3:12px; --sp-4:16px; --sp-5:20px;
--sp-6:24px; --sp-8:32px; --sp-10:40px; --sp-12:48px;

/* Radios */
--rd-sm:8px; --rd-md:12px; --rd-lg:16px; --rd-xl:20px; --rd-full:999px;
/* El negocio puede elegir "suave" (valores de arriba) o "marcado" (todos -4px). */

/* Elevación: hairline primero, sombra después. Nunca sombras difusas grandes. */
--el-0: none;
--el-1: 0 1px 2px rgba(19,18,24,.06), 0 0 0 1px var(--bd-hair);
--el-2: 0 4px 12px rgba(19,18,24,.08), 0 0 0 1px var(--bd-hair);
--el-3: 0 12px 32px rgba(19,18,24,.14);   /* solo hojas modales */

/* Movimiento */
--mo-rapido: 120ms cubic-bezier(.2,0,.2,1);   /* estados de botón */
--mo-medio:  200ms cubic-bezier(.2,0,.2,1);   /* aparición de elementos */
--mo-hoja:   280ms cubic-bezier(.32,.72,0,1); /* bottom sheets */
@media (prefers-reduced-motion: reduce) { *,*::before,*::after {
  animation-duration:.01ms !important; transition-duration:.01ms !important; } }
```

**Objetivo táctil mínimo: 44×44px.** Sin excepciones, ni siquiera en los íconos de redes. Si visualmente el ícono mide 28px, el área de toque se extiende con padding.

---

## 6. Densidad y tamaño de cards (respuesta directa al problema de compresión)

**Regla:** el ancho del card lo define el contenido mínimo legible. La cantidad visible es una consecuencia, y siempre incluye un peek.

| Card | Ancho | Alto imagen | Visible en 375px | Contenido obligatorio |
|---|---|---|---|---|
| Producto (retail/comida) | **156px** | 156px (1:1) | 2.1 | Imagen, nombre 2 líneas 14px, precio 16px mono, badge de estado |
| Producto alto ticket | **248px** | 140px (16:9) | 1.4 | Imagen, título, 3 atributos, precio grande |
| Servicio | **168px** | 112px (3:2) | 2.0 | Imagen o ícono, nombre, "Desde S/", duración |
| Reseña | **282px** | — | 1.2 | Iniciales, nombre, estrellas, fecha, 3 líneas de texto, respuesta si existe |
| Highlight | **68px** ⌀ | 68px | 4.8 | Foto, título 1 línea 13px |
| Publicación | **204px** | 204px (1:1) | 1.7 | Imagen, título 2 líneas, fecha, reacciones |
| Galería | **136px** | 136px | 2.5 | Solo imagen |
| Categoría | auto, mín 88px | 60px | 3.6 | Ícono/foto, nombre, conteo |
| Método de pago | 56×36px | — | grilla | Logo, sin texto |

Cálculo del peek: `visibles = (375 − 16 − 16 + 12) / (ancho + 12)`. Si el resultado cae a menos de 0.15 de decimal de un entero, se ajusta el ancho ±4px para forzar el corte. **Nunca un carrusel donde los cards calcen exactos.**

En ≥768px: grilla de 3–4 columnas con el mismo ancho mínimo, sin scroll horizontal.

**Ejemplo de lo que se corrige respecto de los mockups.** El card de producto de la barbería mide ~95px y muestra "Pomada Mate The Barber" en tres líneas de 10px con el precio de 11px. Con 156px: la imagen se ve, el nombre entra en dos líneas de 14px, el precio en mono a 16px domina el card, y quedan 2.1 cards visibles en vez de 3.8. Se ven menos productos y se compran más.

---

## 7. Imágenes

| Uso | Proporción | Entrega | Peso máx. |
|---|---|---|---|
| Portada | 16:9, recorte seguro 21:9 | AVIF + WebP, 1200/800/400w | 90 KB |
| Logo | 1:1 | WebP/PNG, 256px, `<img>` no fondo | 25 KB |
| Producto | 1:1 | AVIF + WebP, 600/300w | 45 KB |
| Galería | 1:1 o 4:3 | AVIF + WebP, 800/400w | 60 KB |
| Highlight | 1:1 | WebP 160w | 15 KB |

Placeholder: LQIP en base64 de 20px (~400 bytes) inline. Sin blur pesado, sin librerías.

**Postprocesado automático obligatorio en la subida.** Los clientes suben fotos con flash, torcidas y de 6 MB. El pipeline debe: recortar al centro de interés, normalizar exposición, quitar fondo en productos cuando se detecte fondo plano, comprimir y generar variantes. Esta función hace más por la calidad visual del sistema que cualquier decisión de diseño: es la diferencia entre un catálogo que se ve como tienda y uno que se ve como venta de segunda mano en Facebook.

---

## 8. Accesibilidad (no negociable)

- Contraste AA verificado en tiempo de derivación del tema; si el color del negocio no lo alcanza, el sistema lo ajusta y avisa al dueño en el editor ("ajustamos tu color para que el texto se lea").
- Foco visible: anillo de 2px con `--mk-accion` y 2px de separación.
- Todos los carruseles navegables por teclado, con `aria-roledescription="carousel"` y controles en desktop.
- Las hojas modales atrapan el foco y se cierran con `Esc`.
- Los cambios en la franja de estado usan `aria-live="polite"`.
- Etiquetas de icono siempre presentes vía `aria-label`, aunque no se muestre texto.
- Estrellas: siempre acompañadas del número ("4.7") — el color no puede ser el único portador de información.

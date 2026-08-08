# 05 — Tipografía

---

## 1. La decisión

**Interfaz: stack del sistema. Display: Archivo Variable, self-hosted y subconjuntada.**

```css
--bs-font-ui: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
              "Helvetica Neue", Arial, sans-serif;
--bs-font-display: "Archivo Variable", var(--bs-font-ui);
--bs-font-num: var(--bs-font-ui);   /* con font-variant-numeric: tabular-nums */
```

### Por qué system-first para la interfaz

Cuesta cero bytes y renderiza en el primer frame, sin FOUT ni FOIT. En un producto cuyo usuario de referencia está en 4G con un Android de gama media, esa es la diferencia entre sentirse instantáneo y sentirse lento. Además, cada sistema operativo entrega su fuente optimizada para su propio renderizado: San Francisco en iOS y Roboto en Android se ven mejor en sus pantallas que cualquier webfont. Y hay un argumento de familiaridad: la interfaz se siente parte del teléfono, no una web disfrazada — que es exactamente la sensación que buscamos.

El costo es real y lo asumimos a conciencia: pierdes control tipográfico fino y tu UI se parece más a otras apps. Para un marketplace de utilidad, donde la tarea vence a la expresión, es un intercambio favorable.

### Por qué Archivo para display

La personalidad tipográfica se concentra donde se ve: nombre del producto, títulos de sección, precios grandes, piezas de marketing. Archivo es una grotesca de origen editorial, diseñada para titulares de alto impacto y para texto pequeño en contextos de prensa, con una variante ancha para display. Ese linaje —el periódico, la sección de avisos clasificados— es literalmente lo que Buscadis digitaliza. Es una elección con argumento, no un default de moda.

Coste: ~28 KB con subconjunto `latin` + `latin-ext`, cargada con `next/font/local`, `display: swap`, precargada. Se acepta porque afecta a pocos elementos y ninguno bloquea el LCP si se usa `size-adjust` para igualar métricas con el fallback.

### Lo que se elimina

El `!important` sobre `html, body, :root`, que impide cualquier composición tipográfica. Las declaraciones `--font-geist-sans` y `--font-outfit` de Tailwind, que nunca existieron en el DOM. El mapeo `serif` de los skins de negocio a la serif por defecto de Tailwind, que entrega una fuente distinta en cada sistema operativo: se reemplaza por una serif del sistema explícita (`ui-serif, Georgia, "Times New Roman", serif`).

---

## 2. Escala

Base 16px, progresión con relación aproximada 1.2 en los tamaños de texto y más abierta en display. El interletrado se corrige ópticamente: negativo a medida que crece el tamaño.

| Token | px | Interlínea | Tracking | Familia |
|---|---|---|---|---|
| `text-2xs` | 11 | 14 | +0.04em | UI |
| `text-xs` | 12 | 16 | +0.01em | UI |
| `text-sm` | 13 | 18 | +0.01em | UI |
| `text-base` | 15 | 22 | 0 | UI |
| `text-md` | 16 | 24 | 0 | UI |
| `text-lg` | 18 | 26 | −0.01em | UI |
| `text-xl` | 20 | 28 | −0.01em | Display |
| `text-2xl` | 24 | 30 | −0.02em | Display |
| `text-3xl` | 30 | 36 | −0.02em | Display |
| `text-4xl` | 36 | 40 | −0.03em | Display |
| `text-5xl` | 48 | 52 | −0.03em | Display |

**El cuerpo base es 15px, no 16.** Razón: es un producto denso de listados en móvil, donde 16px obliga a truncar títulos de aviso a una línea útil. 15px con interlínea 22 mantiene legibilidad y gana una línea completa por tarjeta. El editor del negocio sí usa 17px (ver `02 §1 · P3`).

**Mínimo absoluto: 12px**, y solo para badges y etiquetas de una palabra. Nada de 10–11px como hay hoy en las métricas de perfil.

---

## 3. Roles tipográficos

Los roles son tokens, no clases sueltas. Un componente pide un rol, no un tamaño.

| Rol | Tamaño móvil | Escritorio | Peso | Familia | Notas |
|---|---|---|---|---|---|
| `display-hero` | 30 | 36 | 700 | Display | nombre de negocio, títulos de campaña |
| `heading-section` | 18 | 20 | 600 | Display | títulos de módulo |
| `heading-card` | 15 | 16 | 600 | UI | título de aviso, sentence case |
| `body` | 15 | 15 | 400 | UI | descripciones |
| `body-compact` | 13 | 13 | 400 | UI | máx. 2 líneas en tarjetas |
| `meta` | 12 | 12 | 500 | UI | ubicación, fecha, vistas |
| `price` | 16 | 17 | 700 | UI + tnum | siempre tabular |
| `price-lg` | 24 | 28 | 700 | Display + tnum | ficha de producto |
| `label` | 11 | 11 | 600 | UI | badges, mayúsculas, +0.04em |
| `section-label` | 11 | 11 | 600 | UI | mayúsculas, `fg-muted` |
| `button` | 15 | 15 | 600 | UI | sentence case, nunca mayúsculas completas |

**Sentence case en toda la interfaz.** Las mayúsculas completas se reservan para `label` y `section-label` de una o dos palabras. *Por qué:* el texto en mayúsculas se lee entre 10% y 20% más lento porque elimina la silueta de la palabra, y en español los diacríticos empeoran el problema.

---

## 4. Números y precios

El precio es el dato más consultado del producto y merece reglas propias.

**Cifras tabulares siempre** (`font-variant-numeric: tabular-nums`) en precios, métricas, contadores y horarios. Sin ellas, una columna de precios en una rejilla baila y la comparación —la acción central del marketplace— se vuelve más lenta.

**Formato único:** `S/ 1,250` · `S/ 32.50` solo cuando hay céntimos distintos de cero · `S/ 650,000` en inmuebles sin abreviar. Se prohíbe `S/1.25M`: en un mercado donde la gente compara al céntimo, abreviar genera desconfianza.

**Jerarquía en la tarjeta:** el precio es el segundo elemento de mayor peso visual después de la imagen, por encima del título. Es el criterio de descarte principal.

**Precio anterior tachado** solo cuando existió realmente y con la fecha de vigencia registrada. Un descuento falso es un riesgo legal (Indecopi) y destruye confianza.

---

## 5. Reglas de composición

**Longitud de línea:** entre 45 y 75 caracteres en texto corrido. En móvil con contenedor de 640px y 15px, cae naturalmente en rango.

**Truncado:** dos líneas para títulos de tarjeta con `line-clamp-2`, nunca una. Un título de aviso truncado a una línea pierde justo el atributo que distingue un aviso de otro ("Departamento 3 dorm…" vs "Departamento 3 dorm. con cochera").

**Jerarquía de encabezados semánticos:** un solo `<h1>` por página (el nombre del aviso o del negocio), `<h2>` para secciones, `<h3>` para subsecciones. No se salta niveles. *Por qué:* además de accesibilidad para lectores de pantalla, la jerarquía es una de las señales que usan los motores de búsqueda y los modelos de lenguaje para extraer estructura — y hoy el HTML de Buscadis no llega a tener contenido, mucho menos jerarquía.

**Idioma declarado:** `lang="es-PE"` en `<html>`. Afecta guionado, corrección ortográfica y la voz de los lectores de pantalla.

# 06 — Iconografía y assets

---

## 1. Una sola familia: Lucide

**Migración desde `react-icons`.** Hoy conviven Font Awesome, Material Icons y Google Icons en la misma pantalla: tres grosores, tres lenguajes de esquina, tres rejillas ópticas. El usuario no lo nombra, pero lo percibe como falta de acabado.

**Por qué Lucide y no otra:** es la continuación mantenida de Feather, tiene cobertura amplia, grosor consistente, es tree-shakeable de verdad (cada ícono es un módulo) y su geometría de trazo abierta se lee bien a 16px en pantallas de baja densidad. Font Awesome, además de mezclar estilos, importa pesado cuando se usa fuera del registry — que es lo que pasa hoy en 25 archivos.

**Excepción justificada:** los logotipos de terceros (WhatsApp, Instagram, TikTok, Yape, Plin, Visa) no son íconos, son marcas. Van como SVG optimizados en un módulo aparte, a color, y no se les aplica `currentColor`.

**Segunda excepción:** las 8 categorías llevan íconos custom de marca, no genéricos de librería. Son el vocabulario visual propio de Buscadis y aparecen en la barra de categorías, en los chips, en los placeholders y en las piezas físicas. Merecen diseño propio con la misma rejilla y grosor que Lucide para que convivan.

---

## 2. Tamaños y grosores

| Token | px | Grosor | Uso |
|---|---|---|---|
| `icon-xs` | 16 | 2 | dentro de badges, texto en línea |
| `icon-sm` | 20 | 2 | botones pequeños, campos |
| `icon-md` | 24 | 1.5 | navegación, acciones principales |
| `icon-lg` | 32 | 1.5 | estados vacíos, categorías |
| `icon-xl` | 48 | 1.5 | ilustración de estado vacío |

*Por qué el grosor baja al crecer:* un trazo de 2px a 32px se ve tosco; uno de 1.5px a 16px desaparece. Es compensación óptica estándar.

**Nunca escalar un ícono con CSS.** Se pide el tamaño correcto. Escalar rompe el grosor óptico y produce bordes borrosos en pantallas @1x.

**Objetivo táctil:** el ícono puede medir 20px, el área tocable siempre 44px. Los botones de ícono del header, hoy en 40px, se corrigen.

---

## 3. Registry

```tsx
// components/ui/Icon.tsx
export type IconName = keyof typeof registry;
export const Icon = ({ name, size = 'md', ...props }: IconProps) => { … }
```

Reglas: se importa `Icon`, nunca un ícono suelto. `currentColor` por defecto, sin prop `color` (el color lo da el token del contenedor). Regla de ESLint que prohíbe importar desde `lucide-react` o `react-icons` fuera del registry. *Por qué prohibirlo por lint:* hoy el registry existe y se salta en 25 archivos — la disciplina sin verificación no dura.

---

## 4. Assets de marca

| Asset | Estado hoy | Acción |
|---|---|---|
| `logo.svg` | ~3 MB | Optimizar a <15 KB (SVGO, simplificar trazados, quitar metadatos) |
| `logo.png` | En uso en header | Reemplazar por SVG optimizado |
| `logov2.*` | Sin política | Decidir: se conserva una versión y se archiva la otra |
| Favicons / PWA | `theme_color: #38bdf8` | Actualizar a `#53ACC5` |
| `og-image.jpg` | Genérico | Reemplazar por generación dinámica por página |
| QR mark | Correcto | Elevar a asset de sistema, documentar zona de resguardo |

**Un SVG de 3 MB en el header es, probablemente, tu peor problema de rendimiento medible en una sola línea.** Es la corrección con mejor relación esfuerzo/beneficio de todo el sistema.

**Especificación de logo:** versión completa (marca + nombre), isotipo, y versión monocroma. Zona de resguardo igual a la altura de la contraforma del isotipo. Tamaño mínimo: 24px de alto para el isotipo, 96px para la versión completa. Nunca sobre fondo saturado sin caja.

---

## 5. Imágenes de contenido

| Uso | Proporción | Formato | Peso máx |
|---|---|---|---|
| Foto de aviso (rejilla) | 4:3 | AVIF + WebP, 400/800w | 45 KB |
| Foto de aviso (detalle) | libre, contenida | AVIF + WebP, 800/1200w | 110 KB |
| Portada de negocio | 16:9 | AVIF + WebP, 400/800/1200w | 90 KB |
| Logo de negocio | 1:1 | WebP/PNG 256px | 25 KB |
| Producto | 1:1 | AVIF + WebP, 300/600w | 45 KB |
| Avatar | 1:1 | WebP 96px | 12 KB |

**Placeholder:** LQIP en base64 de ~20px (menos de 500 bytes) en línea, con el color dominante extraído en la subida. Sin librerías de blur.

**Pipeline de subida obligatorio.** Los usuarios suben fotos de 6 MB con flash y torcidas. El pipeline recorta al centro de interés, normaliza exposición, comprime y genera variantes. Esto mejora la calidad visual del producto más que cualquier decisión de diseño: es la diferencia entre un catálogo que parece tienda y uno que parece venta de segunda mano.

**Placeholders por categoría:** fondo tenue del color de categoría con su ícono centrado. Nunca una imagen genérica de banco. En modo oscuro, el fondo oscuro de la categoría (hoy colapsados todos a `#283038`).

---

## 6. Ilustración

Hoy no hay lenguaje ilustrativo: la atmósfera la dan los mesh gradients. Recomendación: **no inventar uno todavía**. Un sistema de ilustración es caro de crear y más caro de mantener consistente, y no resuelve ningún problema actual. Los estados vacíos se resuelven con ícono grande + texto claro + acción, que es más rápido de leer y pesa 1 KB.

Cuando llegue el momento (después de tener tracción y equipo de diseño), el lenguaje debe salir del vocabulario del producto: avisos, papel, mural, poste, lupa, mapa — no de personajes genéricos flotando.

El sistema de mascota "Lupo" que ya tienes es un activo de marketing, no de interfaz. Vive en contenido, piezas físicas y onboarding; no dentro de los estados de producto.

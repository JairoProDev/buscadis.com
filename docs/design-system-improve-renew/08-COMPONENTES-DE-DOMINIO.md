# 08 — Componentes de dominio

> Estos son los que hacen que Buscadis sea Buscadis. Se construyen sobre las primitivas, nunca en paralelo.

---

## 1. AdisoCard — el componente más importante del producto

**Razón de ser.** Es la unidad atómica del marketplace. Un usuario ve entre 20 y 200 de estas por sesión y decide en menos de dos segundos cuáles abre. Cada punto porcentual de mejora en su tasa de apertura se multiplica por todo el tráfico del producto. Ningún otro componente merece tanto cuidado.

**Anatomía fija** (no negociable entre variantes):

```
[imagen 4:3 con acento de categoría 3px arriba]
[badge de estado ─ máximo 1 ─ esquina superior izquierda]
título 15/600, 2 líneas ─────────────────────
PRECIO 16/700 tabular ───────────────────────
distrito · hace 2 h ─── 12/500 fg-muted
[una señal social: ★4.8 · o · 12 vistas hoy · o · Verificado]
```

**Tres vistas, un solo componente:**

| Vista | Layout | Cuándo |
|---|---|---|
| `grid` | 2 columnas móvil, hasta 5 en 1280 | por defecto |
| `list` | imagen 96px a la izquierda, texto a la derecha | cuando el título importa más que la foto (empleos, servicios) |
| `feed` | ancho completo, máx 480px, imagen 4:3 grande | descubrimiento tipo Instagram |

**Reglas duras.** El precio nunca se oculta; si no hay, se muestra "A convenir" en `fg-muted`, nunca vacío. Una sola señal social. El acento de categoría es una barra de 3px, nunca fondo. El título va a dos líneas siempre, aunque quepa en una: altura consistente evita que la rejilla baile.

**Estados:** cargando (esqueleto con la forma exacta), sin foto (placeholder de categoría), pausado (opacidad 60% + etiqueta), vendido (escala de grises + cinta), destacado (borde `sol-400` de 1px + badge, nunca fondo amarillo).

**Anti-patrones a corregir del código actual:** `styled-jsx` local en `GrillaAdisos`, props booleanas acumuladas (`compact`, `embedded`, `isDesktop`) que multiplican combinaciones no probadas. Se reemplazan por una sola prop `view` y contexto de densidad.

**Ancho mínimo:** 156px. Por debajo, el título se trunca a menos de dos líneas útiles y el precio pierde peso — el mismo problema de compresión que ya detectaste en el perfil de negocio.

---

## 2. SearchComposer — la firma del producto

**Razón de ser.** Es tu idea de producto más original: un solo control que alterna entre buscar y publicar. Comunica en un gesto que Buscadis es de dos lados, y elimina la búsqueda del botón "publicar" que en todos los clasificados está escondido en un menú.

**Riesgo que hay que gestionar.** Un control que cambia de función es un patrón poco común y viola la ley de Jakob. Se compensa con tres cosas: el modo por defecto siempre es buscar (la acción del 95% de las sesiones); el cambio de modo es explícito y visible, nunca automático; y el modo activo se distingue por color, texto del placeholder y forma del botón, no solo por posición del pill.

**Especificación:** alto 52 móvil / 56 escritorio. Modo buscar usa el celeste de acción; modo publicar usa el amarillo con texto tinta. El borde cónico animado se conserva **solo en escritorio** y se desactiva en móvil y con `prefers-reduced-motion`: es una animación de propiedad personalizada que repinta continuamente y en gama media cuesta fotogramas.

**Estados:** vacío con sugerencias, escribiendo con autocompletado, con resultados, sin resultados con sugerencia de ampliar. El autocompletado se navega con flechas y se confirma con Enter (hoy falta en varios composers).

---

## 3. PublishCta

Botón amarillo con texto tinta. Es el único elemento de la interfaz autorizado a usar el amarillo como relleno grande. Aparece **una vez** por pantalla: en el composer, en el header de escritorio, o como acción flotante en móvil — nunca en dos a la vez.

---

## 4. CategoryBar y CategoryChip

**Razón de ser.** Las 8 categorías son tu modelo de negocio convertido en navegación. También son la señal más rápida de que Buscadis no es solo productos, que es tu diferenciador declarado frente a los marketplaces de la competencia.

**CategoryBar:** scroll horizontal en móvil, altura 72; rejilla en escritorio, altura 88. Cada tile: ícono custom 32px + etiqueta 12px + color de categoría. El activo se marca con barra inferior de 3px y peso 600, no con fondo lleno.

**CategoryChip:** fondo tenue de categoría, texto en el paso oscuro, ícono 16px, alto 36. Siempre con ícono y etiqueta.

**Regla de crecimiento:** ocho es el máximo. Una novena categoría obliga a agrupar. Si aparece "Mascotas", entra dentro de Comunidad o Productos, no como novena pestaña.

---

## 5. AppHeader y MobileTabBar

**AppHeader.** 72px hoy; se reduce a **56px en móvil** y se mantiene 64px en escritorio. *Por qué:* 72px es el 11% de la pantalla de un teléfono de referencia dedicado a chrome permanente. Los 16px recuperados equivalen a media línea de contenido en cada pantalla, en todas las sesiones. Logo 32px en móvil (no 48), 40px en escritorio. Botones de ícono a 44px, corrigiendo los 40 actuales.

**MobileTabBar.** 56px + safe-area. Máximo 5 destinos. Se elimina el ocultamiento al hacer scroll: ahorra 56px y cuesta que el usuario pierda la orientación y tenga que hacer scroll hacia arriba para navegar. Si se conserva, debe reaparecer al menor scroll hacia arriba, no solo al llegar al tope.

**Etiquetas siempre visibles bajo los íconos.** Los íconos sin etiqueta bajan reconocimiento de forma consistente en pruebas de usabilidad; el ahorro de espacio no compensa.

---

## 6. FilterPanel y FilterChips

**Razón de ser.** El filtrado es lo que convierte un montón de avisos en un resultado. Es también donde más se abandona.

**Reglas.** Máximo 5 filtros visibles; el resto tras "Más filtros". Los filtros aplicados aparecen siempre como chips removibles sobre los resultados: un filtro invisible que devuelve cero resultados es la causa más común de "esta app no tiene nada". El contador de resultados se actualiza **antes** de aplicar ("Ver 34 resultados"), lo que reduce el miedo a filtrar.

**Simplificación pendiente:** el uso intensivo de Framer Motion en los filtros es innecesario. Un panel de filtros necesita ser instantáneo, no elegante. Se migra a transiciones CSS.

---

## 7. Handoff a WhatsApp (componente de primera clase)

**Razón de ser.** En Perú, la conversión termina en un chat de WhatsApp. Tratarlo como un enlace suelto es dejar el momento más valioso del producto sin diseñar.

**Contrato:** todo enlace pasa por `/r/{token}` firmado, con mensaje pre-armado que incluye el contexto (aviso o producto, precio, origen), redirección en menos de 30 ms y evento asíncrono. El negocio recibe una conversación que ya empezó; la plataforma recibe el dato.

Fuera de horario, el texto cambia a "Escribir (responden mañana 9:00 a. m.)" en lugar de deshabilitarse.

---

## 8. StorefrontKit

Kit separado, sobre los mismos primitivos, con la capa semántica del tenant (contrato de `04 §5`).

Componentes: `StorefrontChrome`, tres variantes de héroe (Minimal, Bento, Split), `CatalogGrid`, `ProductSheet`, `ReviewCarousel`, `HighlightRing`, `StatusStrip`, `ActionBar`, `PaymentMethods`, `LocationBlock`.

**Regla de frontera:** ningún componente del marketplace se importa en el storefront sin pasar por la capa semántica. Si un componente necesita vivir en ambos, se mueve al núcleo compartido y se le quitan las dependencias de marca fija.

La especificación funcional profunda de estos componentes ya está en el paquete `buscadis-perfil-vivo/06-COMPONENTES.md`, con la salvedad de que **los valores de color y tipografía de aquel documento quedan sustituidos por los tokens de este sistema.**

---

## 9. TrustBadge y VerificationBadge

**Razón de ser.** La confianza es la moneda de un marketplace. Un badge sin criterio público es decoración, y peor, una promesa que la plataforma no puede sostener.

**Tres niveles con criterio publicado:** Registrado (contacto confirmado) · Verificado (RUC validado + domicilio) · **Verificado en local** (visita física de ADIS con fotos). El tercero es tu ventaja imposible de copiar desde Lima y merece un tratamiento visual distinto.

El badge es tocable y abre una hoja que explica qué se verificó y cuándo. *Por qué:* una insignia que explica su propio criterio vale mucho más que una que solo brilla, y protege a la plataforma cuando algo sale mal.

---

## 10. Superficies de marca (`.brand-*`)

Las utilidades actuales son buenas y se conservan, con tres correcciones:

**El mesh de fondo pasa a ser un gradiente CSS estático** en lugar de `background-attachment: fixed`, que fuerza repintado en cada scroll y es un problema conocido de rendimiento en móvil.

**El glass se limita.** Máximo dos superficies con `backdrop-filter` simultáneas, desactivado bajo `prefers-reduced-transparency` y en dispositivos con `deviceMemory < 4`, con sustituto sólido tintado al 92% de opacidad. La diferencia visual es mínima; la diferencia en fotogramas al hacer scroll no lo es.

**`.text-gradient` azul→violeta y `.mesh-gradient` violeta se eliminan:** contradicen la regla anti-morado que tú mismo estableciste.

# 01 — Crítica a los mockups actuales y decisiones irreversibles

> **CONTEXTO PARA LA IA:** este documento explica por qué el diseño final se desvía de los mockups de referencia. Si un mockup y este documento se contradicen, gana este documento.

---

## Parte A — Qué está mal en los 8 mockups

Los mockups son buenos como *moodboard*. Como especificación son peligrosos, porque están optimizados para verse bien en una imagen estática de 1500px, no para funcionar en un teléfono de gama media con 4G en Cusco, con un negocio real que tiene 3 fotos malas y ninguna reseña.

### 1. Son ocho veces el mismo diseño con distinto color

Barbería, cafetería, pastelería, boutique, dentista, abogado, inmobiliaria, vivero: todos tienen portada + logo circular + 4 stats + 5 highlights + 3 CTA + fila de iconos + banner promo + carrusel de productos + reseñas + info. Un abogado y una cafetería **no tienen la misma intención de visita**. A la cafetería entras a ver la carta y la ubicación; al abogado entras a evaluar si es confiable y agendar. Repetir la misma estructura es cómodo para el diseñador y caro para la conversión.

**Consecuencia:** el sistema necesita *arquetipos* estructurales, no solo temas de color. Ver `04`.

### 2. Están diseñados para un negocio que no existe

"+18K clientes felices", "4.9 con 2,850 reseñas", "+25K servicios realizados", cinco highlights con fotos de estudio, ocho productos fotografiados con luz profesional. Ningún cliente tuyo del primer año se ve así. El 80% de tu portafolio real va a ser: logo pixelado, 4 productos, 0 reseñas, sin portada.

Un diseño que solo se ve bien lleno es un diseño que **avergüenza al cliente el día 1** — y el día 1 es cuando decide si paga el segundo mes.

**Consecuencia:** el estado vacío es el estado de diseño principal, no un caso borde. Cada módulo se especifica primero vacío, después lleno. Ver `06`.

### 3. Todo pesa lo mismo, entonces nada pesa

En la pantalla 1 de cualquiera de los mockups compiten por atención: portada, logo grande, nombre, eslogan, categoría, ciudad, badge de verificado, 4 stats, 5 highlights circulares, 3 botones de color saturado, 5 iconos secundarios, un banner promocional animado. Son ~20 elementos de jerarquía alta en 900px. Eso no es jerarquía, es ruido decorado.

**Consecuencia:** una acción primaria por perfil. Todo lo demás baja de nivel. Ver principio "Una sola acción" en `02`.

### 4. El encabezado se come la primera pantalla

Portada 220px + logo circular 130px + nombre + eslogan + categoría + ciudad + fila de stats ≈ 45–50% del viewport de un iPhone SE **antes de la primera acción posible**. En un dispositivo real, el usuario hace scroll antes de poder hacer nada.

**Consecuencia:** la identidad se comprime a ~180px con logo de 64px y las stats se integran en una sola línea. La primera acción debe ser visible sin scroll en 375×667. Ver `06 §1`.

### 5. Las stats son vanidad, no confianza

"+18K clientes felices" no es verificable, no es específico y todos los perfiles lo van a decir. Una métrica sin fuente es decoración. Peor: si el mismo número aparece en cien perfiles, el número deja de significar algo y el sistema entero pierde credibilidad.

**Consecuencia:** dos clases de métricas, separadas visualmente: **verificadas** (calculadas por la plataforma: reseñas, tiempo de respuesta, pedidos, antigüedad en Buscadis) y **declaradas** (las escribe el negocio, máximo 2, con tipografía y color más discretos). Ver `06 §2`.

### 6. Las reseñas no son creíbles

Todas 5 estrellas, todas con foto de perfil de banco de imágenes, todas de una línea, sin fecha, sin respuesta del negocio. Un perfil con 4.7 y distribución visible convierte mejor que uno con 5.0 perfecto: la perfección lee como comprada. Es un hallazgo consistente en investigación de e-commerce.

**Consecuencia:** reseñas con fecha, con distribución de estrellas visible, con respuesta del negocio destacada y con etiqueta de verificación cuando la compra ocurrió en Buscadis. Sin foto genérica: iniciales sobre color derivado del nombre. Ver `06 §8`.

### 7. El QR está dentro del perfil

El QR aparece dentro de la pantalla del teléfono en casi todos los mockups. Nadie escanea un QR con el mismo teléfono donde ya está viendo el perfil. El QR no es un componente de UI: es un **asset exportable** (PNG y PDF, para sticker, escaparate, tarjeta física, mostrador, casco de rider).

**Consecuencia:** el QR sale del perfil público y entra al panel del negocio, con generador de piezas listas para imprimir. Ver `06 §16` y `10`.

### 8. "Negocio Verificado" no significa nada

Un badge sin criterio público es un adorno; peor, es una promesa que la plataforma no puede sostener cuando un negocio verificado estafe a alguien.

**Consecuencia:** tres niveles con criterio publicado — **Registrado** (email/teléfono confirmado), **Verificado** (RUC validado contra SUNAT + domicilio comprobado), **Verificado en local** (alguien de ADIS fue físicamente y tomó fotos). El tercero es tu ventaja injusta: tienes oficina en Cusco y presencia local. Nadie de Lima puede replicarlo rápido. Ver `06 §1` y `10`.

### 9. Las "3 pantallas" son un artefacto de presentación

Los mockups de 3 columnas (`PANTALLA 1 / 2 / 3`) son una forma de mostrar el scroll en una imagen. Si se implementan como pestañas reales, se rompe el descubrimiento (el usuario no explora pestañas), se esconde contenido a los crawlers y se duplica la navegación.

**Consecuencia:** un único scroll vertical continuo, con barra de secciones adherida (sticky) que aparece recién después del hero. Modelo Amazon/Airbnb, no modelo pestañas. Ver `04`.

### 10. El handoff a WhatsApp pierde todo

`wa.me/51999...` sin mensaje. El cliente llega a un chat vacío, el negocio no sabe de dónde vino ni qué miraba, y la plataforma pierde el evento. Ahí se cae la mitad del valor.

**Consecuencia:** todo enlace a WhatsApp lleva mensaje pre-armado con contexto (producto, precio, ID de perfil, origen), redirección a través de `/r/` para medición, y el negocio ve en su panel "12 conversaciones iniciadas desde el producto X". Ver `06 §4` y `09`.

### 11. Ningún mockup responde "¿por qué vuelvo mañana?"

Todo lo mostrado es estático: datos, catálogo, reseñas. Se ve una vez y no se vuelve. Sin retorno no hay red social, no hay seguidores y no hay razón para pagar S/30 todos los meses.

**Consecuencia:** el eje central del producto pasa a ser lo que cambia — estado en vivo, novedades fechadas, promociones con vencimiento, stock. Este es el elemento distintivo del sistema. Ver `02` y `06 §3`.

### 12. Pesan demasiado

Portada + logo + 5 highlights + 8 productos + 4 fotos de galería + 6 avatares ≈ 3–5 MB sin optimizar. En 4G real de Cusco eso es 8–14 segundos hasta el primer contenido útil. Cada segundo extra por encima de 3s te cuesta aproximadamente la mitad de las visitas móviles.

**Consecuencia:** presupuesto duro — LCP < 1.8s en 4G simulada, < 180 KB de JS crítico, imágenes AVIF/WebP responsivas, todo lo que está bajo el pliegue en carga diferida. Ver `08`.

### 13. Nada de esto es indexable si se construye como "mini-app"

Tu propia intuición fue "no una web, una app". Correcto para la *sensación*, catastrófico si se implementa como SPA renderizada en cliente: Google indexa mal, y las IAs (ChatGPT, Perplexity, ADIS AI de terceros) no citan lo que no pueden leer sin ejecutar JavaScript. Para un negocio en Cusco, aparecer en Google y ser citado por una IA vale más que la animación.

**Consecuencia:** se siente como app, se sirve como HTML. SSR/ISR con hidratación parcial, JSON-LD completo, contenido crítico en el HTML inicial. Ver `08`.

### 14. Sobre tu pregunta de la compresión de cards

Tenías razón: sí se están comprimiendo. En los mockups los cards de producto miden ~95px de ancho y las reseñas ~110px porque se está optimizando "cuántos entran en la fila". Eso invierte la lógica.

**Regla correcta:** el ancho de un card lo determina **el contenido mínimo que debe quedar legible**, y de ahí se deduce cuántos entran (casi siempre 1.6 a 2.4 en móvil). No al revés.

- Card de producto: 148–164px de ancho mínimo. Debe caber imagen 1:1, nombre en 2 líneas a 14px, precio a 16px bold. Con 96px el nombre se corta a "Torta de Choco…" y el precio pierde peso — el precio es el 40% de la decisión de compra.
- Card de reseña: 260–300px. Una reseña de 110px muestra 4 palabras: no es una reseña, es un adorno con estrellas.
- Highlight circular: 64–72px de diámetro. Menos de 56px vuelve la foto ilegible y falla el objetivo táctil de 44px.

Y siempre **peek**: el siguiente card debe quedar cortado a la vista (mostrar entre 20% y 40% de él). Un carrusel donde los elementos calzan exactos parece una grilla terminada y nadie desliza. Esa es la razón real por la que se ven carruseles "apretados": se intenta insinuar que hay más metiendo más. La forma correcta de insinuar que hay más es cortar el siguiente.

---

## Addendum Visual 2.0 (2026-08-08)

Feedback de clientes: el perfil 1.0 se veía “feito” frente a mockups IA. **No** reabrimos D2/D6/D9/D10/D14. Sí matizamos A3–A4:

- Hero puede ser **más inmersivo** (~200px de portada + identidad con tipografía display fuerte) siempre que la barra sticky siga mostrando la acción primaria sin scroll.
- La fila de acciones puede tener **hasta 3 CTAs táctiles de color** (WA semántico + marca + outline); la barra inferior sigue siendo *la* primaria y no compite con tres botones iguales.
- Highlights circulares (68px) sí, cuando hay datos; no stats de vanidad.

Detalle: `docs/superpowers/specs/2026-08-08-perfil-vivo-visual-2-design.md`.

---

## Parte B — Las 14 decisiones irreversibles

Estas son las que no se re-discuten en cada sprint. Si algo las contradice, se rechaza el cambio.

| # | Decisión | Por qué |
|---|---|---|
| D1 | **Un scroll vertical**, sin pestañas. Barra de secciones sticky tras el hero. | Descubrimiento + indexación |
| D2 | **Una acción primaria** por perfil, definida por el arquetipo. Fija en la barra inferior. | Jerarquía y conversión |
| D3 | **Módulos activables y ordenables**, con contrato común y estado vacío obligatorio. | Escalabilidad entre rubros |
| D4 | **6 arquetipos** definen el orden por defecto; el negocio puede reordenar dentro de límites. | Libertad con guardarraíles |
| D5 | **Motor de temas con guardarraíles**: el negocio elige color y portada; el sistema deriva la rampa y fuerza contraste AA. Nunca color libre en el chrome. | Consistencia y legibilidad |
| D6 | **Métricas verificadas vs. declaradas**, visualmente separadas. | Credibilidad del sistema entero |
| D7 | **Todo handoff pasa por redirección medida** con mensaje pre-armado. | Datos = producto |
| D8 | **SSR/ISR + JSON-LD completo**. Nunca SPA pura. | SEO y AEO |
| D9 | **Presupuesto de rendimiento duro**: LCP < 1.8s, JS < 180 KB, imágenes ≤ 120 KB c/u. | Mercado real, redes reales |
| D10 | **El QR y las piezas físicas viven en el panel**, no en el perfil público. | Uso real |
| D11 | **Verificación de 3 niveles con criterio público**, con visita física como nivel máximo. | Foso local defendible |
| D12 | **El contenido fechado (estado + novedades) es el corazón del producto**, no un extra. | Retención y precio recurrente |
| D13 | **El precio nunca se oculta** cuando existe. Rango ("Desde S/") si es servicio. | Fricción #1 en LatAm |
| D14 | **Sin dark patterns**: la escasez y la prueba social solo se muestran si son reales y calculadas por la plataforma. | Un perfil que miente destruye la marca Buscadis |

---

## Parte C — Lo que cambio respecto a tus instrucciones previas

Tres cosas donde te contradigo, con argumento:

**1. Dijiste "quita guardar contacto".** De acuerdo para negocios de retail. Pero para el arquetipo Profesional/B2B (abogado, contador, constructora, distribuidora ferretera) la vCard sí se usa: se comparte por correo, se guarda antes de una reunión. Propuesta: no es un botón fijo, es una opción dentro del menú de compartir, y solo aparece en arquetipos B2B.

**2. Dijiste "las promociones como intersticiales que rotan".** Un carrusel automático que cambia solo tiene tres problemas medidos: bajísimo clic en la segunda diapositiva en adelante, incumple WCAG 2.2.2 si no se puede pausar, y desplaza el contenido durante la lectura. Propuesta: una sola promoción visible, la más relevante, elegida por prioridad y vencimiento, con acceso a "ver las 4 promociones". Si insistes en la rotación, debe ser pausable, sin auto-avance tras interacción, y con altura fija.

**3. Dijiste "scroll horizontal para todo donde haya varias cosas".** Con un límite: el scroll horizontal esconde contenido de los crawlers si se implementa mal, y en desktop es hostil sin controles. Regla: horizontal en móvil para colecciones visuales homogéneas (productos, highlights, reseñas, galería); grilla en desktop ≥768px; nunca horizontal para información que el usuario necesita *comparar* (planes, horarios, métodos de pago).

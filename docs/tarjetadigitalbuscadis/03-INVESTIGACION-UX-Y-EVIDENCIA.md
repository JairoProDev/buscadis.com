# 03 — Investigación de comportamiento y evidencia

> **CONTEXTO PARA LA IA:** este documento justifica con evidencia externa las decisiones de `04`, `05` y `06`. Las cifras son direccionales (mercados US/EU en su mayoría) y sirven para priorizar, no para prometer resultados. Donde la evidencia peruana difiere, está anotado.

---

## 1. Qué sabemos del usuario que llega a un perfil de negocio

**La visita es corta, móvil y con intención de compra cercana.** Cerca de la mitad de las búsquedas en Google tienen intención local, y alrededor de tres cuartas partes de las búsquedas "cerca de mí" terminan en una visita al negocio dentro de las 24 horas siguientes (Google / Think with Google). El usuario que abre un perfil de negocio no está investigando: está decidiendo. Esto cambia todo el diseño: no necesita ser convencido con storytelling, necesita que le retiren obstáculos.

**La velocidad es una función de conversión, no un tema técnico.** Alrededor del 53% de los visitantes móviles abandonan una página que tarda más de 3 segundos (Google/SOASTA). En redes 4G reales de provincia peruana, con un teléfono de gama media, un hero de 1.5 MB ya te pone en esa zona. Cada 100 KB que quitas es dinero.

**La completitud del perfil mueve la aguja más que la estética.** Google reporta que los perfiles de negocio completos reciben aproximadamente 70% más visitas al local que los incompletos, y que los que tienen fotos reciben cerca de 42% más solicitudes de indicaciones. Traducción para nosotros: el onboarding que logra que el negocio llene su perfil vale más que cualquier rediseño. Esto es la razón de que `06 §17` (medidor de completitud) sea un componente de primera clase y no un detalle.

**Las reseñas son el mayor multiplicador de conversión disponible.** BrightLocal ha medido que subir de 3.5 a 3.7 estrellas puede casi duplicar la tasa de conversión, y que los negocios con 50+ reseñas generan órdenes de magnitud más contactos que los que tienen menos de 10. La cantidad importa tanto como la nota. Implicación de producto: la solicitud automática de reseñas post-contacto es una función de ingreso, no un extra (ver `06 §8` y `09`).

**El descubrimiento ya no empieza solo en Google.** Las respuestas generadas por IA aparecen en una fracción creciente de consultas locales (los estudios de 2025-2026 la ubican entre 15% y 32% según metodología). Un negocio que no está estructurado para ser leído por una IA está desapareciendo de un canal nuevo mientras optimiza el viejo. De ahí que `08` trate SEO y AEO como un solo trabajo.

---

## 2. Los siete momentos del visitante (y qué necesita en cada uno)

Este es el mapa que ordena los módulos en `04`.

**Momento 1 — "¿Es este el negocio que busco?" (0–3 s).** Necesita logo, nombre, categoría, ciudad. Nada más. Si le mostramos un carrusel promocional aquí, lo tratamos como si ya nos hubiera elegido. Un error clásico.

**Momento 2 — "¿Está funcionando ahora?" (3–6 s).** Abierto/cerrado, si contestan rápido, si están atendiendo. En Perú esta pregunta pesa más que en mercados con horarios estables y comercio formal: el usuario asume que puede estar cerrado y que le van a dejar el visto. Responder esto explícitamente es un diferenciador real, no un adorno.

**Momento 3 — "¿Se puede confiar?" (5–15 s).** Nota, cantidad de reseñas, verificación, antigüedad. Se resuelve con una línea, no con una sección. La confianza es un filtro rápido, no una lectura.

**Momento 4 — "¿Tienen lo que quiero y cuánto cuesta?" (15–45 s).** Este es el 60% del valor del perfil para un negocio con productos. Es donde el usuario pasa la mayor parte del tiempo y donde se decide la compra.

**Momento 5 — "¿Hay algo que me convenga hoy?" (variable).** Promoción vigente, novedad, stock limitado. Este momento es opcional pero es el que produce el retorno.

**Momento 6 — "¿Cómo lo consigo?" (segundos).** WhatsApp, llamada, pedido, cita, cómo llegar. Debe estar siempre alcanzable sin buscar: barra fija.

**Momento 7 — "Voy a mandárselo a alguien".** El compartir es el motor de crecimiento del producto y en la mayoría de perfiles digitales está mal resuelto (un ícono perdido). Ver `10`.

---

## 3. Lo que la investigación de e-commerce nos obliga a hacer

De los hallazgos de Baymard Institute sobre catálogos y listados móviles, tres se aplican directamente:

**Los carruseles de productos rinden mal cuando no se ve que hay más.** El usuario no desliza si el último elemento visible calza exacto con el borde. La solución no es reducir el card, es cortarlo. Esto valida tu preocupación sobre la compresión: los mockups reducen el card para insinuar continuidad, cuando debieron mantenerlo grande y dejarlo cortado.

**Los cards de producto necesitan un mínimo de información para ser accionables.** Imagen, nombre completo o casi completo, precio destacado, y una señal de estado (nuevo, agotado, oferta). Cuando falta el precio, la tasa de interacción cae fuertemente; cuando el nombre se trunca a menos de dos líneas, el usuario no puede distinguir variantes ("Torta de choco…" vs "Torta de choco… sin azúcar").

**El filtrado y las categorías importan a partir de ~20 productos.** Debajo de eso, filtros y categorías son ruido. Por eso el módulo de categorías tiene condición de visibilidad automática en `06 §6`.

De la investigación de Nielsen Norman Group sobre navegación móvil:

**Los usuarios rara vez usan pestañas para explorar.** Se quedan en la primera. Refuerza D1 (scroll único).

**La barra inferior fija sube el uso de la acción principal de forma significativa**, siempre que tenga una sola acción dominante. Con tres botones iguales el efecto se diluye.

**El acordeón es preferible al texto largo en móvil** cuando el contenido es secundario. Por eso "Quiénes somos" va colapsado.

---

## 4. Contexto peruano — dónde la evidencia global no aplica

Cinco ajustes que ningún benchmark internacional te va a dar:

**WhatsApp no es un canal, es *el* canal.** En Perú el flujo natural de compra local termina en un chat de WhatsApp, no en un carrito. Cualquier diseño que trate a WhatsApp como "un botón más de contacto" está mal calibrado. Consecuencia: el CTA primario por defecto es WhatsApp en cinco de los seis arquetipos, y el mensaje pre-armado con contexto de producto es una función central del producto, no una utilidad.

**Yape y Plin son señales de confianza, no solo de pago.** Que un negocio muestre Yape comunica "soy real, alguien me paga". El módulo de métodos de pago sube en prioridad respecto a lo que recomendaría un benchmark americano.

**El precio publicado es cultural y comercialmente delicado.** Muchos negocios peruanos no publican precios porque negocian y porque temen que el competidor los vea. Nuestra postura: mostrar precio aumenta conversión y es innegociable donde exista; para los casos de negociación real, el patrón es "Desde S/" + botón de cotización. El discurso de venta tiene que abordar esto de frente (ver `10`).

**Los datos móviles son caros y limitados para una parte del público.** Un perfil pesado no solo carga lento: consume el plan de datos del cliente. Es un argumento de venta ("tu perfil pesa menos que una foto de WhatsApp").

**La informalidad afecta la verificación.** Muchos negocios no tienen RUC activo o factura. El nivel de verificación no puede depender solo de SUNAT; de ahí el tercer nivel presencial, que además es tu diferencial imposible de copiar desde Lima.

---

## 5. Qué mide "excelente" en este producto

| Señal | Malo | Aceptable | Excelente |
|---|---|---|---|
| Tiempo hasta la primera acción posible | > 6 s | 3–6 s | < 2 s, sin scroll |
| LCP en 4G simulada | > 4 s | 2.5–4 s | < 1.8 s |
| % de visitas que ejecutan una acción (WhatsApp, llamada, ruta, pedido) | < 8% | 8–15% | > 22% |
| % de perfiles con ≥ 8 productos a los 30 días | < 20% | 20–40% | > 60% |
| Visitas recurrentes al mismo perfil en 30 días | < 5% | 5–12% | > 20% |
| % de perfiles compartidos al menos una vez | < 3% | 3–8% | > 15% |
| Retención de suscripción mes 3 | < 50% | 50–70% | > 85% |

La métrica norte del producto: **acciones de contacto generadas por perfil por mes.** Es lo único que el negocio siente en el bolsillo y es lo que justifica el pago recurrente. Todas las decisiones de diseño se evalúan contra esa métrica.

---

## 6. Anti-patrones observados en la competencia (qué no copiar)

- **Linktree:** cero contexto de negocio, cero SEO propio (dominio compartido, contenido pobre), el visitante nunca sabe qué vende el negocio antes de hacer clic.
- **Perfiles de Instagram como catálogo:** precio en comentarios, "info por DM", contenido no buscable, no hay forma de comparar.
- **Tarjetas NFC/vCard (HiHello, Popl):** centradas en la persona, no en el negocio; no sirven cuando el que compra no conoce a nadie.
- **Constructores tipo WordPress/Wix:** el negocio no vuelve a entrar nunca; el perfil se vuelve un fósil con horarios de 2023. Nuestra defensa contra eso es que la edición viva en el celular y que el estado sea automático.
- **Plantillas de "tarjeta digital" que se venden en Perú por S/100:** todas idénticas, con música y animaciones, sin métricas y sin descubrimiento. Nos comparan con eso: hay que diferenciarse en la demo con velocidad, datos y aparecer en Google.

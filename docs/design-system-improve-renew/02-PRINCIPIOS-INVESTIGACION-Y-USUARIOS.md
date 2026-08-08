# 02 — Principios, investigación y usuarios

> Ningún principio de este documento es una frase motivacional. Cada uno es una restricción verificable con una consecuencia concreta en el sistema.

---

## 1. Para quién diseñamos

Cuatro perfiles con necesidades opuestas conviviendo en la misma plataforma. La mayoría de los errores de diseño de un marketplace vienen de diseñar para uno y romperle la experiencia a otro.

### P1 · El comprador local apurado (volumen: el 80% de las sesiones)

Llega desde Google, desde un enlace de WhatsApp o desde el mapa. Tiene una intención concreta y una ventana corta. Casi la mitad de las búsquedas en Google tienen intención local y alrededor de tres cuartas partes de las búsquedas "cerca de mí" terminan en una visita al negocio dentro de 24 horas: no está investigando, está decidiendo.

*Qué dice:* "busco un depa en Wanchaq". *Qué no dice, pero hace:* abandona si no ve precio; abre cuatro pestañas y compara; desconfía de anuncios sin foto; asume que no le van a contestar.
*Qué necesita del sistema:* precio visible siempre, escaneabilidad en dos segundos, una señal de confianza por tarjeta, contacto de un toque.
*Consecuencia:* el precio es un rol tipográfico propio, no un texto más. Las tarjetas tienen anatomía fija. El contacto está siempre a un toque de distancia.

### P2 · El vendedor particular ocasional

Publica dos o tres veces al año: vende su moto, alquila un cuarto, busca empleada. No va a aprender una herramienta. Compara mentalmente con "publicar en el grupo de Facebook", que le toma 40 segundos y es gratis.

*Qué no dice:* que abandona en el momento en que le pides categoría, subcategoría, atributos y ubicación exacta antes de dejarlo escribir.
*Consecuencia:* el composer de publicación acepta primero texto libre y después estructura. La fricción se paga al final, nunca al principio.

### P3 · El dueño de negocio (el cliente que paga)

52 años, Android de gama media, WhatsApp a diario, Facebook a veces. Escribe lento. Usa el teléfono con una mano mientras atiende, muchas veces con sol directo. Desconfía de lo que parezca que le va a cobrar.

*Qué dice:* "quiero que me encuentren". *Qué realmente evalúa:* si sus clientes le escribieron este mes.
*Consecuencia:* el editor usa texto de 17px y objetivos de 56px, contra los 15px/44px del lado público. La confianza se construye con datos, no con estética.

### P4 · El creador de contenido / rider (aún hipotético)

Publica en Deals, hace lives, entrega pedidos. Vive en interfaces tipo TikTok y espera velocidad de gestos, no formularios.
*Consecuencia:* Deals es el único lugar del sistema donde se permiten patrones de pantalla completa y gestos; el resto del producto no los adopta por contagio.

---

## 2. Los diez principios del sistema

**1 · Contenido primero, marca después.**
La marca ocupa el chrome; el contenido ocupa la pantalla. Objetivo de reparto: 90% neutros y contenido, 10% marca. *Verificable:* en cualquier captura de una pantalla de producto, la superficie teñida de marca no supera el 10%.

**2 · Escaneable en dos segundos.**
Una tarjeta se entiende sin leerla completa: foto, título, precio, una señal social. *Verificable:* prueba de cinco segundos con tres personas; si no recuerdan el precio, la tarjeta falló.

**3 · Una señal social por tarjeta.**
Nunca dos badges compitiendo. *Por qué:* cada señal adicional resta credibilidad a las anteriores; es el efecto Von Restorff invertido — cuando todo destaca, nada destaca.

**4 · Precio siempre visible.**
Si existe, se muestra. Si es variable, se muestra rango o "Desde". *Por qué:* es el primer criterio de descarte del comprador y la primera causa de abandono cuando falta.

**5 · Una acción primaria por pantalla.**
Solo ella lleva el color de acción. *Por qué:* la ley de Hick — el tiempo de decisión crece con el número de opciones equivalentes. Tres botones idénticos no son tres opciones, son parálisis.

**6 · Familiaridad antes que originalidad.**
Buscador arriba, navegación abajo en móvil, carrito a la derecha, estrella para calificar. *Por qué:* la ley de Jakob — los usuarios pasan la mayor parte del tiempo en *otros* sitios y esperan que el tuyo funcione igual. La originalidad se gasta en el contenido y en el modelo de negocio, no en dónde está el botón de volver.

**7 · Objetivo táctil de 44px, 48px en navegación primaria.**
*Por qué:* la ley de Fitts — el tiempo para alcanzar un objetivo depende de su tamaño y distancia. Los 40px del header actual son un incumplimiento medible, no una preferencia.

**8 · Siete elementos como máximo en cualquier grupo de navegación.**
Ocho categorías es el límite tolerable y ya lo estás rozando. *Por qué:* la capacidad de la memoria de trabajo es limitada (el clásico 7±2, hoy revisado a la baja, entre 4 y 6 para elementos no relacionados). Si aparece una novena categoría, algo tiene que agruparse.

**9 · Los estados vacíos son diseño, no accidente.**
Todo componente tiene los cuatro estados especificados antes de considerarse terminado. *Por qué:* en un marketplace joven, el estado vacío es el estado más frecuente.

**10 · Rápido es una decisión de diseño.**
Ninguna decisión estética puede empujar el LCP por encima de 1.8 s en 4G. *Por qué:* más de la mitad de los visitantes móviles abandonan una página que tarda más de 3 segundos, y en este mercado la lentitud se percibe como falta de seriedad.

---

## 3. Leyes y evidencia que aplicamos (y dónde)

| Principio | Qué dice | Dónde lo aplicamos |
|---|---|---|
| **Ley de Jakob** | Esperan que funcione como los demás sitios | Ubicación de buscador, nav inferior, gestos de stories |
| **Ley de Fitts** | Objetivos grandes y cercanos se alcanzan más rápido | 44/48px, acción primaria fija abajo, al alcance del pulgar |
| **Ley de Hick** | Más opciones equivalentes = más tiempo de decisión | Una acción primaria; filtros progresivos |
| **Miller / memoria de trabajo** | Capacidad limitada | Máximo 8 categorías, máximo 5 filtros visibles |
| **Ley de proximidad (Gestalt)** | Lo cercano se percibe relacionado | Escala de espaciado con saltos claros: 4/8 dentro, 16/24 entre |
| **Von Restorff** | Lo distinto se recuerda | Un solo elemento con color de acción por pantalla |
| **Zeigarnik** | Lo incompleto genera tensión y retorno | Barra de completitud del perfil, borradores guardados |
| **Peak-end** | Se recuerda el pico y el final | El momento "tu perfil está listo" y el informe mensual |
| **Usabilidad estética** | Lo bello se percibe más usable | Justifica pulir, no justifica sacrificar velocidad |
| **Doherty (400 ms)** | Bajo 400 ms de respuesta la atención no se pierde | Presupuesto de INP < 200 ms, feedback óptico inmediato |
| **Prueba social** | La opinión ajena reduce riesgo percibido | Una señal por tarjeta; reseñas con distribución visible |
| **Contraste WCAG** | 4.5:1 texto, 3:1 componentes | Verificado en CI, sin excepciones |

**Nota honesta sobre la psicología del color:** está sobrevendida. El contexto de marca y cultura pesa más que el matiz en abstracto. Por eso ninguna decisión de este sistema se justifica en "el azul transmite confianza": se justifican en contraste, separación de matiz, distinción de estados y consistencia.

---

## 4. Contexto peruano — donde la evidencia global no aplica

**WhatsApp no es un canal, es el canal.** El flujo natural de compra local termina en un chat. Cualquier diseño que trate WhatsApp como "un contacto más" está mal calibrado. *Consecuencia:* el componente de handoff a WhatsApp es una pieza de primera clase del sistema, con mensaje contextual y medición.

**Yape y Plin son señales de confianza, no solo de pago.** Mostrarlos comunica "soy un negocio real". *Consecuencia:* los logos de pago tienen componente propio y suben en jerarquía respecto de lo que recomendaría un benchmark estadounidense.

**Datos móviles caros y limitados.** Un perfil pesado consume el plan del cliente. *Consecuencia:* el presupuesto de peso es un argumento de venta, no solo una métrica.

**Dispositivo de referencia real: Android de gama media, 360px de ancho.** Todo se diseña y se prueba primero ahí, no en 390 ni en 430. *Consecuencia:* 360px es el breakpoint base del sistema.

**Sol directo y pantallas baratas.** El contraste no es una casilla de accesibilidad: es la condición de uso normal. *Consecuencia:* AA es el piso, no la meta; los textos secundarios apuntan a 4.5:1 aunque la norma permita menos en tamaños grandes.

---

## 5. Qué investigación falta hacer (y no puede reemplazarse con criterio)

Cinco estudios baratos que valen más que cualquier opinión, incluida la mía:

**Prueba de cinco segundos sobre la tarjeta de aviso** con 10 personas en la calle: qué recuerdan. Mide el principio 2.
**Prueba de árbol de las 8 categorías** con 15 personas: dónde buscarían "alquiler de andamios" o "clases de guitarra". Valida si tu taxonomía coincide con el modelo mental local.
**Prueba de publicación cronometrada** con 5 vendedores particulares: tiempo hasta aviso publicado, y dónde abandonan.
**Prueba del tendero** con 5 dueños de negocio: crear un perfil sin ayuda, cronometrado, grabando la pantalla.
**Prueba de contraste en campo:** llevar el teléfono a la puerta de un local al mediodía y confirmar qué se lee y qué no. Cuesta una hora y va a cambiar decisiones.

Ninguna requiere presupuesto. Las cinco caben en dos días de trabajo de campo, que ya haces cuando visitas clientes.

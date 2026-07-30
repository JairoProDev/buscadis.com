# Buscadis Envíos — Especificación de la función de delivery/mandados de propósito general

Delivery real, de uso general, no atado al catálogo del marketplace. Diseñado para atraer a los motorizados del grupo como riders y a cualquier persona en Cusco que necesite viajar y enviar algo — con el mismo objetivo de tracción y posicionamiento que veníamos hablando.

---

## 1. Qué es, en una línea

Un módulo de "pedir un mandado/envío" dentro de Buscadis: cualquier persona describe qué necesita enviar y a dónde, un motorizado verificado lo acepta y lo entrega. Como Rappi/PedidosYa pero sin catálogo propio obligatorio — el envío puede ser de cualquier cosa que el remitente ya tenga, no algo que compra dentro de la app.

**Por qué no va en "servicios" (la sección de clasificados):** un clasificado es un anuncio estático que alguien publica y espera que lo contacten — "servicio de gasfitería", "clases de inglés". Esto es distinto: es una **solicitud puntual que se resuelve en minutos u horas**, con emparejamiento en vivo entre quien envía y quien entrega. Necesita su propio módulo con estado (pendiente → aceptado → en camino → entregado), no una vitrina de anuncios. Lo tratamos como una sección nueva de primer nivel en Buscadis, no como una subcategoría dentro de clasificados.

---

## 2. Tipos de envío soportados (multiuso, por diseño)

El campo central es "¿qué vas a enviar?" con categorías predefinidas + opción libre, para que el producto se sienta amplio desde el día uno:

- 📦 **Paquete o encomienda** (algo que ya tienes, cualquier tamaño razonable para moto)
- 🛍️ **Compra hecha por el rider** (mandado tipo "cómprame esto en la farmacia/mercado y tráemelo" — el rider adelanta el dinero, el remitente le paga al recibir; útil para quien no tiene tiempo de salir)
- 📄 **Documentos**
- 🔑 **Objeto olvidado / urgente** (llaves, cargador, algo que alguien dejó en otro lado)
- 🐾 **Mascota** (categoría especial — ver sección 6, con reglas propias)
- 🛒 **Producto comprado en Buscadis** (cuando exista catálogo con ventas — mismo flujo, solo que el origen es automático: la dirección del vendedor)
- ✏️ **Otro** (campo de texto libre — no lo cierres, la gente va a pedir cosas que no anticipaste)

Esto resuelve directamente lo que planteaste: no necesitas tener ventas en el marketplace para que esta función tenga uso — funciona sola desde el día uno.

---

## 3. Flujo de quien envía (remitente)

1. Abre "Envíos" en Buscadis.
2. Elige tipo de envío (lista de arriba).
3. Completa: punto de recojo, punto de entrega, descripción breve de qué es (obligatorio — ver por qué en la sección 7), ventana horaria (ahora / programado), foto opcional del objeto.
4. Si es "compra hecha por el rider": campo adicional de presupuesto estimado, para que el rider sepa cuánto va a adelantar.
5. Confirma. El pedido se publica a los riders disponibles en la zona (mismo patrón que ya usa el grupo de WhatsApp con "BUSCO TAXI MOTO" — reutiliza el hábito que 42 personas ya adoptaron ahí).
6. Recibe notificación cuando un rider acepta, con su nombre, foto de perfil verificado y calificación.
7. Trackea el estado hasta "entregado".
8. Califica al rider (1-5 + comentario opcional).

## 4. Flujo del rider (motorizado)

1. Ve solicitudes de envío disponibles en su zona (usa el mismo sistema de zonas que ya identificamos en la data: San Sebastián, San Jerónimo, Centro, Wanchaq, etc.).
2. Acepta la que le convenga.
3. Va al punto de recojo, confirma que tomó el paquete (botón "recogido", opcional: foto).
4. Entrega, confirma "entregado" (opcional: foto o firma simple).
5. Recibe su calificación acumulada — esto es lo que a futuro puede destrabar beneficios (ver sección 8).

---

## 5. Verificación de riders — reutiliza lo que ya construimos

El checklist de verificación de conductores del kit operativo (DNI, antecedentes penales y policiales, foto de la moto) aplica exactamente igual aquí — un rider de delivery necesita el mismo nivel de confianza que un conductor de pasajeros, quizás más porque va a manejar objetos de valor o dinero ajeno (en el caso de "compra hecha por el rider"). No relajes el filtro solo porque ahora es paquetería y no personas.

**Ventaja para ti:** ya tienes ~10 motorizados aprobados y activos en el grupo de WhatsApp con este mismo proceso corrido. Son tu primera cohorte de riders de Buscadis Envíos — no partes de cero, ya sabes quiénes son confiables.

---

## 6. Mascotas — la categoría que necesita reglas propias

Vale la pena tratar esto distinto al resto porque hay un ser vivo de por medio, no un objeto:

- Requiere que el rider haga **opt-in explícito** a esta categoría — no todos van a querer o saber manejar una mascota en la moto.
- Exige transportín/jaula o correa segura provista por el remitente — el rider no es responsable de conseguir el medio de sujeción.
- Límite de peso/tamaño razonable para transporte en moto (defínelo con criterio de seguridad, no solo de conveniencia — un perro grande no debería ir en moto).
- Considera esta categoría de menor prioridad para el MVP — es la más delicada operacionalmente y la que menos volumen real vas a tener al inicio. Bien para el roadmap, no imprescindible para lanzar.

---

## 7. Por qué el campo "qué vas a enviar" es obligatorio — diseño honesto, no hueco

Esto no es para "cubrirte" — es buen diseño de producto en sí mismo: un rider necesita saber si va a llevar un sobre o una caja de 10kg antes de aceptar, y un remitente necesita poder describir bien lo que envía para que no haya confusión al momento de la entrega. El efecto colateral bueno es que la estructura del producto (categorías de objetos, foto del paquete, descripción) hace que la función se sienta y se use naturalmente como lo que es — envío de cosas — sin que tengas que declarar reglas explícitas de "no personas". El producto se explica solo por cómo está construido.

---

## 8. Monetización — no ahora, pero deja la puerta abierta

Coincido en no cobrar comisión todavía — necesitas volumen y confianza primero. Pero construye el modelo de datos pensando en esto desde ya (no cuesta nada extra ahora, y evita una migración dolorosa después):

- Guarda cada envío completado con: rider, remitente, distancia, categoría, timestamp — esto te da, en unos meses, la misma capacidad de análisis que hicimos con el grupo de WhatsApp, pero con data propia y limpia.
- Deja un campo de "propina opcional" desde el lanzamiento — no es comisión tuya, pero acostumbra a la gente a que el envío puede tener un componente monetario dentro de la app, sin que tú cobres nada todavía.
- Las tres vías que mencionaste (suscripción, que pague el rider, bundle con el paquete de negocio en ADIS) son compatibles entre sí y no se excluyen — puedes decidir cuál activar primero cuando tengas volumen suficiente para que la decisión importe.

---

## 9. Cómo migrar a la comunidad actual hacia esto

**A los motorizados del grupo:**
> "Vamos a lanzar una función de delivery en Buscadis — mismo tipo de trabajo, pero con pedidos organizados desde la app en vez de mensajes sueltos, y vas a tener tu perfil con calificación visible. ¿Te interesa ser de los primeros riders verificados?"

**A los pasajeros/remitentes frecuentes que identificamos (Yanela, T'ika Bel, Anthony, Terry, Adri):**
> "Además de las carreras, ahora puedes pedir que te traigan cosas — un mandado, algo que se te olvidó, una compra — desde Buscadis. ¿Quieres probarlo?"

**Al grupo en general, como anuncio:**
> "Buscadis ahora tiene una sección de envíos y mandados — pide que te lleven documentos, compras, paquetes o lo que necesites, con motorizados verificados. [link]"

Nota deliberada: en ninguno de estos mensajes se menciona "taxi" ni "pasajeros" — el producto se presenta, se explica y se usa exclusivamente como lo que es.

---

## 10. MVP — qué construir primero

Para lanzar rápido sin sobre-construir:
1. Formulario de solicitud (tipo de envío, recojo, destino, descripción, foto opcional, hora).
2. Lista de solicitudes disponibles para riders, filtrable por zona.
3. Estados básicos: pendiente → aceptado → recogido → entregado.
4. Calificación simple post-entrega (1-5 estrellas + comentario).
5. Perfil de rider con verificación (reusa el checklist ya armado) y calificación acumulada visible.

Deja para después: mascotas, propinas, cualquier lógica de comisión, chat integrado (usa WhatsApp para coordinación directa al inicio, como ya hace el grupo — no reinventes eso todavía).

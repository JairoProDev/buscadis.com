# Roster completo, revisión del MVP, y estrategia de migración del grupo a la app

## 0. Algo que tengo que señalarte del código antes de seguir

El reporte que compartiste dice, textualmente: la categoría **"Acompañamiento"** existe a propósito para que los traslados de personas no digan "taxi/pasajero" ("UI no dice taxi/pasajero"), hay una regla de soft-launch de **"no mencionar pasajero en marketing"**, y existe un sistema de analítica silenciosa (`uso_detectado`, visible solo para admin) que clasifica cada pedido como `envio` / `posible_viaje` / `desconocido` — es decir, el sistema ya está diseñado para detectar en silencio cuándo alguien está usando "Acompañamiento" como transporte de pasajeros disfrazado, y seguir permitiéndolo.

Esto es exactamente el patrón que dijimos que no íbamos a construir hace dos mensajes — con la diferencia de que aquí no es una idea, ya está implementado en el código. No sé si esto lo construiste vos, otra sesión, o un desarrollador con instrucciones previas, pero tal como está documentado, es lo mismo que ya te expliqué que no es una zona gris legal sino evidencia de intención si algo sale mal — con el agravante de que aquí queda registrado en una base de datos con un campo llamado literalmente `posible_viaje`, que es prácticamente una prueba autoincriminatoria si alguna vez un fiscal o el MTC pide acceso a esos datos.

**Mi recomendación concreta, no solo la observación:** renombra o elimina la categoría "Acompañamiento" (o conviértela en algo que de verdad sea solo objetos — "asistencia con carga pesada", "traslado de mascota acompañado", lo que sea que no implique llevar una persona de un punto a otro), y decide qué hacer con `uso_detectado` — si lo mantienes como analítica de producto legítima ("¿la gente está pidiendo cosas que no anticipamos?"), bien, pero no lo diseñes ni lo documentes como un sistema para monitorear cuánto se está usando la app para lo que ya acordamos que no ibas a construir. El resto del análisis de abajo asume que este punto se corrige — no voy a optimizar mensajería ni growth para la categoría "Acompañamiento" tal como está descrita.

---

## 1. El roster clasificado — con honestidad sobre su precisión

Extraje y clasifiqué los 119 remitentes únicos de los 465 mensajes (19-24 julio) en un CSV: **`taxi-moto-roster-clasificado.csv`**, adjunto. La clasificación es por heurística de texto (quién dijo "soy motorizado"/"tengo moto" vs. quién usó el formato "BUSCO TAXI MOTO"), no verificación humana — trátalo como punto de partida para contactar, no como verdad absoluta. Específicamente:

- **18 personas** se identifican como motorizados con alta confianza (dijeron explícitamente "soy motorizado" o "tengo moto", o respondieron "libre en zona X").
- **38 personas** se identifican como pasajeros con alta confianza (usaron el formato formal de solicitud).
- **3 personas** aparecen en ambos roles (probablemente motorizados que también piden servicios como pasajeros alguna vez — revisa "TiMi!", "Anthony M.c🎤" y "^-^" con atención, son casos interesantes de doble perfil).
- **54 personas** no se pueden clasificar solo con el texto (dijeron "hola", "yo" sin contexto claro, o son negocios haciendo spam) — para estos, la columna "muestra_de_mensaje" del CSV te da el primer mensaje para que decidas a ojo.
- Un puñado de clasificaciones son ruido conocido (ej. "AFRODITA HAIR & NAIL SALON" quedó como MOTORIZADO por un falso positivo del patrón "yo" — ignóralo, es un negocio, no un conductor).

**Frank💚🏅 y Andreesqp destacan como los motorizados más activos y consistentes** (18 y 15 mensajes respectivamente, con múltiples calificaciones de 5 estrellas asociadas a Frank específicamente) — son tus candidatos más fuertes para contactar primero, no al azar.

---

## 2. Cómo hablarle a cada motorizado sin que se sientan amenazados

Tu miedo es válido y es el correcto miedo a tener: un motorizado que siente que "una app le va a quitar el control" se pone a la defensiva, y un grupo de 510 personas puede voltearse en contra rápido si sienten que los estás desplazando. La clave no es la redacción del mensaje — es qué le ofreces genuinamente a cambio, dicho con la secuencia correcta.

**Regla 1 — no anuncies el cambio al grupo completo primero.** Empieza uno a uno, en privado, con los motorizados que ya identificaste como más activos y confiables (Frank, Andreesqp, Baya, Jeremy, TiMi!). Un mensaje individual se siente como una oportunidad; un anuncio masivo se siente como una política.

**Regla 2 — lidera con lo que ellos ganan, no con lo que tú construiste.** No digas "hice una app". Di algo como:

> "Hola [nombre] — vi que eres de los que más carreras hace en el grupo y que la gente te recomienda seguido. Estoy armando algo para que ustedes, los motorizados serios, tengan pedidos organizados y su reputación (esas recomendaciones de 10/10 que ya se ganaron) quede guardada y visible, en vez de perderse en el chat. Sin comisión de mi parte. ¿Te interesa ser de los primeros en probarlo?"

Esto hace tres cosas a la vez: (1) lo trata como alguien que ya ganó estatus, no como alguien al que hay que reclutar desde cero, (2) enmarca la app como algo que preserva y capitaliza lo que ya construyeron (su reputación) en vez de reemplazarlos, (3) confirma "sin comisión" de entrada, que es tu ventaja real y hoy poco común frente a InDrive/Picap.

**Regla 3 — nunca compares tu app con el grupo de forma negativa.** No digas "el grupo es un caos" o "esto es mejor que WhatsApp" — eso invita a defender el grupo (que ellos ayudaron a construir con su participación). Di qué gana él, en primera persona, nunca qué está mal con lo actual.

**Regla 4 — dales algo que el grupo nunca les podrá dar:** acceso futuro a tu propia flota de delivery para clientes reales de ADIS. Esto es tu diferenciador genuino y no depende de nada regulatorio: un grupo de WhatsApp nunca puede ofrecerles ingresos estables de negocios reales — solo pedidos sueltos de desconocidos. Tú sí puedes, a futuro, cuando Publicadis tenga clientes que necesiten entregas. Ese es el "cachuelo" real y sostenible que buscas darles, y es un argumento que ningún competidor informal puede igualar.

---

## 3. Separar el grupo — sí, y así lo haría

Tienes razón en que separar riders de usuarios es correcto, por una razón operativa simple: hoy un motorizado ve pedidos de pasajeros mezclados con charla, spam de cerrajería, comentarios sobre el clima y drama de moderación — el ruido reduce su velocidad de respuesta, que es exactamente la métrica (SLA de aceptación) que tu propio equipo/código identificó como la que decide cuándo puedes retirar el grupo.

**Cómo secuenciarlo sin que se sienta como fractura:**
1. Primero, migra a los riders más activos a la app (KYC, perfil, sección "Llevar") uno a uno, como en la Regla 1.
2. Crea un canal separado solo para riders — puede ser dentro de la app misma (el feed de "Llevar" ya es, de facto, ese espacio) — y empieza a anunciar ahí, no en el grupo grande, cualquier mejora o pedido de feedback.
3. El grupo grande de WhatsApp se mantiene como está por ahora (es tu red de reserva y tu canal de pasajeros nuevos) — no lo cierres ni lo anuncies como "en extinción". Dejas que se quede quieto orgánicamente a medida que la app se vuelve más rápida, tal como ya lo planteó tu propio soft-launch doc.
4. Cuando la app iguale o supere el tiempo de respuesta del grupo (la métrica que ya tienes definida: "tiempo a aceptación app vs WA"), ahí sí puedes anunciar al grupo completo, con evidencia de qué tan rápido responde la app comparado a lo que ellos ya experimentaron ahí mismo.

---

## 4. Cómo lograr que nadie quiera saltarse la app — sin que se sienta restrictivo

Esta es la pregunta correcta, y la respuesta correcta no es fricción (bloquear números de teléfono, prohibir contacto directo) — eso sí se siente como el marketplace malo que mencionas. La respuesta es que la app tiene que ganar en las cosas que a cada lado realmente le importan, de forma verificable, no solo declarada:

**Para el pasajero, lo que hace que prefiera la app sobre escribirle directo al motorizado que ya conoce:**
- **Múltiples motorizados ven su pedido a la vez**, no solo el que tiene guardado en contactos — más rápido en la práctica, no solo en promesa.
- **Rating visible y acumulado del rider** — en el grupo, las recomendaciones ("10/10", "20/10") se pierden en el scroll en un día; en la app quedan permanentes y consultables antes de aceptar.
- **Historial propio** — puede ver sus viajes anteriores, repetir una ruta con un toque (esto conecta directo con el 31% de repetición que ya medimos — dales el atajo que ya quieren usar).
- **Seguimiento del pedido** (llegó, está en camino, entregado) — algo que un mensaje de WhatsApp suelto no da de forma estructurada.

**Para el motorizado, lo que hace que prefiera tomar pedidos desde la app y no directo de un cliente que ya lo conoce:**
- **Historial de calificación que no se pierde** — cada viaje bien hecho construye un perfil que le sirve con cualquier pasajero nuevo, no solo con quien ya lo conoce.
- **Acceso a más pedidos de los que le llegarían solo por boca a boca** — la app le muestra todo lo disponible en su zona, no solo lo que un conocido le escribe directo.
- **Cero comisión, como ya decidiste** — argumento fuerte y honesto: "te muestro los pedidos, no te cobro por tomarlos".
- **La promesa a futuro de la flota propia de delivery** (sección 2, Regla 4) — esto es lo que de verdad hace que valga la pena mantener el perfil activo en la app en vez de solo intercambiar números y seguir por WhatsApp: la app es la puerta a trabajo estable futuro, el contacto directo no.

Ninguna de estas cuatro cosas requiere bloquear nada — todas son razones genuinas para preferir la app, verificables por el propio usuario la primera vez que la usa. Eso es justo la diferencia entre "obvio que conviene" y "me obligan".

---

## 5. Revisión técnica del MVP — qué prioridad le daría a cada gap del reporte

De los gaps que ya identificó tu propio reporte, así los priorizaría en función de lo que la data del grupo de WhatsApp muestra que la gente realmente necesita:

| Gap del reporte | Prioridad | Por qué (con evidencia de la data del grupo) |
|---|---|---|
| RPC atómica `accept_moto_request` sin usar | **Alta** | Con picos de 40-57 mensajes/hora (16-20h), un UPDATE optimista sin lock real es exactamente donde vas a tener dos riders aceptando el mismo pedido en simultáneo. Actívala antes de escalar volumen. |
| Notificación no filtra por `online` | **Alta** | Igual de crítico — si notificas a riders offline, generas la sensación de "nadie respondió" que ya es una queja orgánica en el grupo (varios "?" y "alguien disponible" sin respuesta en la data). |
| Sin negociación de precio/propina en UI | **Media-alta** | La data muestra negociación constante y natural ("1.30 puede ser", "6 15 puede ser", "5 soles") — no es un caso raro, es el comportamiento normal del grupo. Tu tarifa fija S/1/km + mínimo S/3 puede generar fricción si no permite ese pequeño ajuste que la gente ya espera poder hacer. |
| Programado / notify diferido | **Media-alta** | Varias solicitudes piden explícitamente con un día de anticipación (el propio operador pide reservar 7-9am la noche anterior) — si el campo `scheduled_at` se guarda pero no dispara nada, estás perdiendo justo el caso de uso que tu propia comunidad ya pidió que se respete. |
| Foto de paquete no usada en "Pedir" | Media | Útil para delivery real (menos ambigüedad en qué se entrega), pero no es lo que frena adopción hoy. |
| Chatbot sin intents de envíos | Baja por ahora | Bien tenerlo, pero la gente ya sabe pedir con el formato del grupo — replica ese formato en el formulario antes de invertir en NLU. |
| Sync de `capability` al aprobar KYC | Media | Cuestión de higiene de datos, no de experiencia de usuario — corrígelo cuando toques esa parte del código, no es urgente por sí solo. |

**Lo más valioso que no está en la lista de gaps pero que la data sí muestra con fuerza:** la app no tiene ningún mecanismo para lo que en el grupo pasa naturalmente — múltiples motorizados respondiendo "yo" a la misma solicitud y el pasajero eligiendo (por ubicación, por si ya lo conoce, por su calificación). Tu sistema actual es "el primero que acepta se lo lleva" — más simple y más rápido, pero le quita al pasajero la sensación de elegir que hoy tiene en el grupo. No lo cambiaría necesariamente (la velocidad importa más), pero vale la pena que lo decidas a conciencia, no por default del código.

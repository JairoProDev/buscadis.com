# Taxi-Moto × Buscadis — Análisis completo (19-24 julio) y la decisión que importa más

Analicé los 465 mensajes de los 6 días que compartiste (parseados uno por uno, no por muestreo) más las dos capturas del grupo. Antes de llegar a las funcionalidades, necesito ser directo sobre una cosa: **hay una forma de hacer esto que puede poner en riesgo Buscadis entero, y una forma que no. Te las separo primero, porque cambia todo lo demás que armes.**

---

## 0. La respuesta directa a "¿lo meto en Buscadis?"

**No lo metas dentro de la marca/dominio de Buscadis. Constrúyelo aparte.** Esta es la razón, sin rodeos:

El Artículo 3 del D.S. 035-2019-MTC (que ya analizamos línea por línea) bloquea **el aplicativo o página web completo** que oferte el servicio — no una sección o feature dentro de él, el dominio/app entero. Si "pedir taxi moto" vive como una funcionalidad más dentro de la app Buscadis, y el MTC alguna vez actúa sobre eso, lo que se bloquea es **Buscadis completo** — tu marketplace, tus clientes de Publicadis que ya pagan por anunciarse ahí, cualquier venta real que empieces a tener. No es una feature aislada la que arriesgas, es la empresa entera, porque para el mecanismo de bloqueo de esta ley, "Buscadis" sería una sola cosa con nombre y dominio propio.

Hoy el grupo de WhatsApp sobrevive precisamente porque **no tiene ese nombre propio y dominio identificable** que la ley necesita para bloquear algo — es el hueco que ya identificamos. En el momento en que metes esa misma actividad dentro de una app pública, con tu nombre, tu marca, y la conectas a un negocio real que ya genera ingresos (Publicadis) — desapareces ese hueco por completo y además le das a un solo golpe regulatorio el poder de tumbar dos negocios a la vez, no uno.

**Lo que sí tiene sentido meter directo en Buscadis: delivery, no pasajeros.** Esto es importante y es una distinción legal real, no una manera de suavizar el mismo riesgo: el D.S. 035-2019-MTC regula específicamente el "**transporte público de personas**" — seres humanos como carga. El transporte de **paquetes/mercancía** (delivery, mensajería) es una actividad económica distinta, no cubierta por este decreto ni por el mecanismo de bloqueo del Artículo 3. Rappi, PedidosYa y cualquier app de delivery en moto operan en Perú sin este problema específico porque no mueven personas. Un feature de "entrega a domicilio de tus compras en Buscadis, hecha por un motorizado" está en una categoría legal completamente distinta a "pide un taxi en moto" — y esa sí la puedes construir bajo la marca Buscadis sin heredar el riesgo del Artículo 3.

**La jugada que te recomiendo, en una frase:** construye el dispatch de pasajeros como herramienta aparte (otra marca, otro dominio, sin el nombre Buscadis en ningún lado), y usa esa comunidad como canal de crecimiento hacia Buscadis — no como una feature de Buscadis. El delivery de mercancía, en cambio, sí constrúyelo directo en Buscadis cuando tengas ventas para justificarlo.

---

## 1. Lo que dice la data real de estos 6 días

**Volumen y ritmo:** 465 mensajes, 119 personas distintas escribieron algo, el operador (DARK DRIVER) generó 93 mensajes (20% del volumen) — sigue siendo mensajería manual y repetitiva, automatizable con el bot que ya te dejé especificado.

**El dato más importante que no tenías antes: el embudo real de conductores.** El propio operador lo dice explícito el día 23: *"nuestro objetivo es de momento 20 (actualmente somos 10)"*. En seis días, al menos 11 personas distintas se ofrecieron activamente como motorizados ("soy motorizado", "tengo moto", "deseo pertenecer") solo en este tramo de data — sumado a los ~19 del primer día que ya habíamos contado, estás por encima de 30 personas que se ofrecieron en total, pero **solo 10 pasaron el filtro y están operando**. Esto confirma con más fuerza lo que dijimos antes: nunca te va a faltar gente que quiera manejar. El cuello de botella real y constante es la capacidad de **filtrar y aprobar rápido**, no de reclutar.

**Demanda real, con formato estructurado — 70 solicitudes:** el operador impuso un formato ("BUSCO TAXI MOTO 🙋 Nombre 🏠 Recojo 📍Destino ⏰Hora 📆Fecha") que la gente empezó a usar consistentemente desde el día 20. Eso te da 70 solicitudes limpias, con estructura, en 6 días — un dataset real de qué pide la gente, no solo señales sueltas.

**Repetición — la señal más valiosa para tu tesis de suscripción:** de 42 personas que pidieron con el formato formal, **13 repitieron más de una vez** (31% de tasa de repetición) en apenas 6 días. Yanela pidió 4 veces, T'ika Bel 3, Anthony M.c 3, Terry 3, Adri 3. Esto no es ya "puede que exista demanda recurrente" — es demanda recurrente documentada, con nombres y rutas repetidas. Tu idea de suscripción no es una hipótesis, es lo que ya está pasando de forma orgánica y sin que nadie se lo proponga.

**Patrón horario — dos picos, no uno:** con más data se confirma y afina lo que vimos antes. Pico fuerte 16:00-20:00 (227 de 465 mensajes, 49% del volumen — salida de trabajo/colegio/universidad) y un segundo pico más chico 07:00-10:00 (78 mensajes — entrada). Las horas muertas reales son 11:00-15:00 y después de medianoche. Si vas a dimensionar cuántos conductores necesitas activos por franja, estos son tus números, no una suposición.

**Rutas más calientes (por menciones):** San Sebastián (21), San Jerónimo (12), Centro (10), Nogales (8), Plaza Nazarenas (8), Miraflores (6), Wanchaq (6), Huancaro (6). San Sebastián–Centro/San Jerónimo sigue siendo, con más data, el corredor más denso — confirma la recomendación de pilotar ahí primero si algún día decides operar zona por zona.

**El propio operador ya usa a InDrive como referencia de precio** (día 20, 17:12): les dice a los usuarios que InDrive cobra S/1.50-2.00/km "y a veces cobra el paquete como una persona", posicionando su tarifa de S/1/km como más barata. Esto valida algo que ya te dije: InDrive es la competencia real que el propio mercado ya tiene en la cabeza, no un competidor hipotético.

---

## 2. Lo que la data revela sobre riesgo y gobernanza — y que tú puedes arreglar hoy

**Admins descontrolados.** En tu captura de "Info. del grupo" cuento admins que no tienen ninguna razón operativa para serlo: un salón de belleza ("AFRODITA HAIR & NAIL SALON"), un servicio de citas/matchmaking, una productora de eventos. Ser admin en WhatsApp da poder real: pueden agregar gente, sacar gente, cambiar la descripción del grupo, fijar mensajes. Ahora que tú también eres admin, tienes la capacidad — y yo diría la responsabilidad, dado lo que sigue — de auditar esa lista y quitar a quien no cumple una función clara de moderación o conducción. Es un hueco de seguridad real, no cosmético.

**Ya hubo un episodio de "posible infiltrado".** El día 23 alguien acusó a otro usuario de ser "un ladrón", y un tercero respondió textualmente *"recuerden que la policía y el tránsito de la municipalidad pueden caer, y fácil ese man puede ser uno de ellos"*. El propio grupo ya es consciente, orgánicamente, de que puede haber vigilancia encubierta — es una prueba más de que el riesgo regulatorio no es abstracto para ellos, lo sienten. Esto refuerza por qué separar la marca Buscadis de esta actividad es la decisión correcta, no una precaución exagerada.

**Ya hubo un intento de extraer datos personales**, que el propio operador tuvo que borrar y explicar ("la otra publicación que borré era de cómo sacar datos sensibles de personas"). No sabes qué se publicó exactamente ni con qué intención, pero es una señal más de que la gobernanza actual del grupo es reactiva, no preventiva.

---

## 3. Qué construir, en orden — y bajo qué marca

### A. Herramienta de dispatch (marca propia, NO Buscadis) — esta semana
Todo lo que ya está en tu kit operativo (bot de WhatsApp, checklist de verificación, tracking) pero bajo un nombre nuevo, limpio, sin conexión visible a Buscadis, Publicadis o tu nombre público como fundador de ADIS. Úsalo para:
- Formalizar el filtro de conductores (pasar de "10 de 20 aprobados a mano" a un proceso repetible).
- Automatizar el formato "BUSCO TAXI MOTO" que la gente ya adoptó — conviértelo en un formulario o respuesta de bot, no texto libre.
- Capturar los datos de las 70+ solicitudes de forma estructurada (ya sabes qué campos usa la gente: nombre, recojo, destino, hora, fecha).

### B. Puente hacia Buscadis (el "entran por las motos, se quedan por lo demás" que quieres, pero seguro)
En vez de que la app SEA el taxi, que el taxi **apunte hacia** la app:
- En cada confirmación de viaje del bot, un mensaje de cierre tipo: *"¿Sabías que puedes comprar/vender lo que necesites en Cusco desde Buscadis? [link]"* — igual que cualquier delivery-app hace cross-sell entre verticales, pero sin que la vertical riesgosa viva dentro del dominio riesgoso.
- Los 10 conductores actuales (y los que se sumen) son exactamente el perfil de early adopter que cualquier marketplace necesita en una ciudad — dales una razón para instalar Buscadis (ofertas, verificación como "conductor de confianza" visible en su perfil de Buscadis, etc.) sin que el ride-hailing sea parte de la app.

### C. Delivery real, dentro de Buscadis — cuando haya ventas
Aquí sí construyes directo en la marca. Cuando tengas los primeros pedidos reales en el marketplace:
- Feature de "entrega por motorizado verificado" usando la misma base de conductores ya filtrados por el dispatch de la marca aparte (compartes la red de conductores, no la marca ni el riesgo legal).
- Esto no compite con la sección de "servicios" de un clasificado — es logística de cumplimiento de tus propias transacciones, una categoría de producto distinta y mucho más defendible.

### D. Suscripción de rutas recurrentes — bajo la marca del dispatch (no Buscadis), cuando tengas el bot funcionando
Con 13 repetidores documentados en 6 días, esto ya tiene demanda probada. Ofrece explícitamente a Yanela, T'ika Bel, Anthony, Terry y Adri (los repetidores identificados) un plan mensual a tarifa fija por su ruta habitual — son tus primeros 5 clientes de suscripción, ya identificados por nombre en la data, no hipotéticos.

---

## 4. Cómo hablarles — mensajes concretos

**A los conductores actuales (los 10 aprobados):**
> "Vamos a empezar a usar una herramienta simple para organizar mejor los pedidos — menos caos de mensajes, más orden en quién toma cada carrera. No cambia nada de cómo trabajas hoy, solo lo hace más rápido para ti y más confiable para el pasajero."

No les vendas "ahora eres parte de una startup" — eso genera expectativas de compromiso/exclusividad que no necesitas todavía. Véndeles herramienta, no compañía.

**A los pasajeros frecuentes (los repetidores):**
> "Vi que pides seguido la ruta [X]. Te puedo ofrecer una tarifa fija mensual para esa ruta, sin tener que escribir cada vez — ¿te interesa?"

Mensaje directo, uno a uno, a las 5-13 personas que ya identificaste con nombre. Esto no es marketing masivo, es venta directa a gente que ya demostró el comportamiento que quieres monetizar.

**A todo el grupo, sobre gobernanza (antes de que crezca más):**
> "Vamos a limpiar la lista de administradores para que solo quede el equipo que modera activamente — es por la seguridad de todos, pasajeros y conductores."

Hazlo ahora, con 485 miembros es manejable; con el doble ya no.

# Taxi-Moto Cusco — Paquete completo de Business Intelligence

Complementa el dashboard (`taxi-moto-dashboard.html`) y los rosters en CSV ya entregados. Aquí va todo lo que es más fácil de razonar en texto que en gráfico: personas, journeys, modelos de negocio, objeciones y backlog.

---

## 1. Buyer Personas — construidas con citas reales del chat, no inventadas

### Persona A — "El Conductor Ancla" (basado en Frank💚🏅 / Frank☘️❄️ / Andreesqp)
- **Quién es:** motorizado que ya trabaja la zona a diario, responde rápido ("Yo", "Aquí"), acumula reseñas espontáneas ("Frank, servicio 10/10 ✨ Recomendado"), y a veces modera el tono del grupo.
- **Motivación real (con cita):** *"también trabajo y hago mis servicios de taxi"* — no ve esto como su única fuente de ingreso, es un complemento activo a su rutina de trabajo normal.
- **Miedo principal:** perder el flujo de pedidos que ya tiene construido por reputación informal si "las reglas cambian".
- **Qué lo convence:** que su reputación (esas reseñas de 10/10) se vuelva un activo permanente y visible, no algo que se pierde en el scroll de WhatsApp.
- **Cómo hablarle:** en privado, reconociendo su estatus ya ganado, nunca en un anuncio masivo (ver sección 4 del documento anterior).

### Persona B — "El Pasajero Recurrente" (basado en Yanela, T'ika Bel, Anthony M.c, Terry, Adri)
- **Quién es:** pide la misma ruta repetidamente (2-4 veces en 11 días), usa el formato formal desde el principio, deja reseñas ("excelente servicio con Frank 5⭐️").
- **Motivación real:** ruta fija de rutina (trabajo, universidad, colegio) — no está explorando el servicio, ya decidió que es su forma de moverse.
- **Miedo principal:** que no haya un conductor disponible justo cuando lo necesita (varios "alguien disponible?" sin respuesta inmediata en la data).
- **Qué la convence:** una ruta guardada / repetible con un toque, y la certeza de que va a haber alguien — la suscripción resuelve exactamente su ansiedad principal.
- **Cómo hablarle:** oferta directa y personalizada de suscripción para su ruta específica, no una promoción genérica.

### Persona C — "El Pasajero Nuevo Inseguro" (basado en chekita)
- **Quién es:** entra al grupo, no sabe cómo funciona, pregunta lo básico ("¿cómo es eso de moto taxi?", "¿tengo que traer casco para el copiloto?").
- **Motivación real:** curiosidad + necesidad puntual, pero con fricción de onboarding real.
- **Miedo principal:** hacer algo mal o quedar expuesta (seguridad física, no saber el protocolo).
- **Qué la convence:** una explicación de 2 líneas antes del primer pedido — literalmente el "cómo funciona" que hoy no existe en ningún lado del grupo.
- **Cómo hablarle:** no le vendas nada — dale claridad primero. Esta persona convierte con un FAQ bien puesto, no con un mensaje de venta.

### Persona D — "El Oportunista de Volumen" (basado en cerrajería cusco 24hrs, Para agencias de citas y matchmaking, AFRODITA HAIR & NAIL SALON)
- **Quién es:** negocios que usan el grupo grande como canal de marketing gratuito, no como usuarios reales del servicio.
- **Relevancia para ti:** no son tu cliente, pero explican por qué "sin clasificar" es tan alto (93 de 198 contactos) — están inflando el tamaño aparente del grupo sin aportar transacciones reales. Al migrar a la app, este segmento se queda atrás naturalmente (no tiene motivo para instalarla) — es una limpieza gratuita de tu base.

---

## 2. User Journey Maps

### Journey del pasajero (estado actual, en WhatsApp)
1. **Descubrimiento:** se entera del grupo por boca a boca o por el TikTok viral original.
2. **Onboarding (fricción alta):** entra al grupo de 500+ personas, no hay explicación clara — debe preguntar o inferir el formato ("BUSCO TAXI MOTO...").
3. **Solicitud:** escribe con el formato, a veces repite el mensaje porque nadie respondió a tiempo.
4. **Espera (punto de mayor abandono):** varios "?" y "alguien disponible" sin respuesta — aquí es donde más se pierde gente.
5. **Match:** un conductor responde "Yo" — primero en responder se lo lleva, sin visibilidad de alternativas.
6. **Coordinación:** intercambio de ubicación por privado (fuera del hilo público, por seguridad).
7. **Viaje.**
8. **Reseña espontánea (opcional):** solo si el pasajero decide publicarla, sin estructura ("10/10", "excelente servicio").

**El punto de journey que tu app debe arreglar primero:** el paso 4 (espera sin visibilidad) — es donde la ansiedad y el abandono son más altos, y es exactamente donde "ver que varios conductores están viendo tu pedido" (aunque no hayan aceptado aún) reduce la sensación de estar gritando al vacío.

### Journey del motorizado (estado actual)
1. **Reclutamiento:** ve el grupo, escribe "soy motorizado, deseo pertenecer".
2. **Filtro (cuello de botella real):** espera respuesta del operador para pasar KYC informal — aquí es donde el operador mismo reconoce demora ("disculpen si me tardo en responder").
3. **Aprobación.**
4. **Trabajo activo:** monitorea el grupo constantemente para no perderse pedidos — alta carga de atención, compite con otros conductores por ser el primero en responder.
5. **Entrega + reseña social:** recibe reconocimiento público informal (menciones con nombre y estrellas) que funciona como su única "reputación portátil".
6. **Sin acumulación:** cada reseña se pierde en el historial del chat — no construye nada permanente.

**El punto de journey que tu app debe arreglar primero para el conductor:** el paso 6 — dale un lugar donde su reputación se acumule y sea visible siempre, no una vez y se pierde.

---

## 3. Business Model Canvas — Buscadis Envíos (no el taxi-moto disfrazado, el delivery real)

| Bloque | Contenido |
|---|---|
| **Segmentos de cliente** | (1) Remitentes generales en Cusco (con o sin negocio en Buscadis), (2) motorizados buscando ingresos extra, (3) a futuro: negocios/clientes de Publicadis que necesiten última milla |
| **Propuesta de valor** | Para remitentes: pedir un envío de cualquier cosa, rápido, con rider verificado y calificado. Para riders: acceso a más pedidos de los que le llegan por boca a boca, sin comisión, con reputación que se acumula |
| **Canales** | La app Buscadis (sección Envíos), migración progresiva desde el grupo de WhatsApp existente, boca a boca de conductores ancla |
| **Relación con el cliente** | Automatizada (bot/app) para lo operativo, personal/directa para el onboarding de los primeros riders y pasajeros recurrentes |
| **Fuentes de ingreso** | Ninguna todavía (decisión tuya, sección 8 del documento de la especificación) — a futuro: suscripción, pago del rider, o bundle con plan de negocio ADIS |
| **Recursos clave** | Base de riders ya verificados (los ~10-29 identificados), la data histórica del grupo (zonas, horarios, precios de referencia), la marca Buscadis ya en construcción |
| **Actividades clave** | Verificación KYC de riders, moderación de la comunidad, mejora continua de matching y notificaciones |
| **Socios clave** | Ninguno externo por ahora — a futuro, negocios que se vuelvan clientes recurrentes de delivery vía Publicadis |
| **Estructura de costos** | Desarrollo y mantenimiento de la app, tiempo de moderación/aprobación de KYC, eventual costo de incentivos a riders ancla |

---

## 4. Lean Canvas — versión rápida, enfocada en riesgo

| Bloque | Contenido |
|---|---|
| **Problema** | (1) Coordinar envíos en Cusco hoy depende de un grupo de WhatsApp caótico y sin estructura, (2) los motorizados no tienen forma de acumular reputación, (3) los remitentes no tienen certeza de que alguien va a responder |
| **Segmentos** | Motorizados de la zona (empezando por los ya identificados en el grupo), remitentes con necesidad puntual de envío |
| **Propuesta única de valor** | "Envía lo que sea, con quien ya confías en Cusco" — capitaliza la confianza social que el grupo ya construyó, sin el caos |
| **Solución** | Módulo de Envíos dentro de Buscadis (ya especificado) |
| **Canales** | Migración 1:1 desde el grupo existente + boca a boca |
| **Flujo de ingresos** | Ninguno aún — la métrica de éxito inicial es volumen y retención, no ingreso |
| **Estructura de costos** | Desarrollo (ya en marcha), moderación, verificación |
| **Métricas clave** | % de riders migrados desde el grupo, tiempo de aceptación app vs. WhatsApp (tu propio criterio para retirar el grupo), tasa de repetición de remitentes |
| **Ventaja injusta** | Ya tienes la data de 11 días de comportamiento real de esta comunidad específica (este mismo paquete de análisis) — ningún competidor que llegue después va a tener este nivel de detalle sobre cómo se comporta exactamente esta gente |

---

## 5. Manejo de objeciones — guiones concretos

**Motorizado: "¿Por qué me voy a pasar a tu app si el grupo ya me funciona?"**
> "Te sigue funcionando el grupo, no te estoy pidiendo que lo dejes. Lo que te ofrezco es que además tengas un lugar donde tus calificaciones no se pierdan como se pierden en el chat, y veas todos los pedidos disponibles de tu zona en un solo lugar, sin tener que estar pendiente del grupo a cada rato."

**Motorizado: "¿Me van a cobrar comisión?"**
> "No, cero comisión. Lo que gano yo es que la app crezca y más adelante tenga trabajo estable para dar, con clientes reales de negocios — ahí sí vamos a hablar de cómo se reparte, pero hoy no te cobro nada por usarla."

**Pasajero: "¿Es seguro? No conozco al conductor."**
> "Cada conductor pasa por el mismo filtro que ya conoces del grupo (antecedentes, SOAT, licencia) — la diferencia es que en la app ves su calificación acumulada de viajes anteriores antes de aceptar, no solo lo que alguien comentó una vez en el chat."

**Pasajero: "Prefiero escribirle directo a [conductor conocido] por WhatsApp."**
> No lo combatas de frente — es una preferencia legítima hoy. La forma de ganar esto no es un argumento, es que la app sea genuinamente más rápida y visible (sección 4 del documento anterior) la primera vez que la usa. Si insiste, no fuerces: "Perfecto, cuando quieras probar la app para ver más opciones disponibles, ahí está."

**Al grupo, si alguien acusa de "querer quedarse con el negocio de todos":**
> "No busco comisión ni reemplazar a nadie — busco que lo que ya construyeron ustedes (la confianza, las rutas, las calificaciones) tenga un lugar donde no se pierda y donde puedan crecer con más pedidos, no menos."

---

## 6. Backlog de funcionalidades — priorizado con evidencia de la data

| # | Funcionalidad | Evidencia que la respalda | Prioridad |
|---|---|---|---|
| 1 | RPC atómica de aceptación (ya en el código, sin usar) | Picos de 100+ mensajes/hora en 18-19h — alto riesgo de doble-aceptación bajo carga | Alta |
| 2 | Filtro de notificación "solo online" | Múltiples "¿alguien disponible?" sin respuesta — notificar a riders offline genera falsa sensación de abandono | Alta |
| 3 | Visibilidad de "X conductores vieron tu pedido" mientras espera | El paso de mayor abandono del journey del pasajero es la espera sin señal | Alta |
| 4 | Reservas programadas con notificación diferida | El propio operador ya pide reservas con 1 día de anticipación para franjas de 7-9am; el campo existe en el schema pero no dispara nada | Alta |
| 5 | Onboarding / FAQ de 2 líneas antes del primer pedido | Persona C (chekita) — fricción real documentada en preguntas básicas | Media-alta |
| 6 | Casilla de propina/negociación simple | Precios negociados constantemente en el chat ("1.30 puede ser", "6 15 puede ser") | Media |
| 7 | Perfil de rider con historial acumulado de calificaciones | 20 reseñas espontáneas sin sistema — la gente ya quiere calificar, falta estructura | Media |
| 8 | Ruta guardada / repetir pedido con un toque | 28% de repetición ya medido — beneficio directo e inmediato a la Persona B | Media |
| 9 | Foto de paquete en el flujo de "Pedir" (ya existe la API, no conectada en UI) | Reduce ambigüedad de qué se entrega | Baja-media |
| 10 | Sincronizar `capability` de rider al aprobar KYC | Higiene técnica, no afecta experiencia directamente | Baja |

---

## 7. Una nota sobre los límites de este análisis

Para que calibres cuánto peso darle a cada número: la clasificación de roles (motorizado/pasajero) es heurística de texto, no verificación uno a uno — algunos nombres como "AFRODITA HAIR & NAIL SALON" o "Para agencias de citas y matchmaking" quedaron mal clasificados como conductores por patrones de palabra ambiguos (revísalos en el CSV antes de contactarlos como riders). Los precios y tiempos de respuesta se estiman del texto disponible, no de timestamps de aceptación real — no hay forma de calcular con precisión cuánto tarda un conductor en aceptar sin datos de "pedido → primera respuesta" pareados explícitamente, así que ese número no está en el dashboard (preferí omitirlo a inventarlo). Todo lo demás (conteos de mensajes, zonas, repetición, crecimiento del grupo) es conteo directo sobre el texto real, no estimación.

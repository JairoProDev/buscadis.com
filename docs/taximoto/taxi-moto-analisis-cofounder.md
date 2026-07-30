# Taxi-Moto Cusco — Análisis de Cofounder
**Fecha:** 20 julio 2026 (v2, corregida) · **Fuentes:** análisis previo (image_fe7f4a.jpg + doc 1), export real del grupo de WhatsApp "Viajes Seguro y Rápido" (105 mensajes, 19/7/2026), captura de pantalla del grupo, búsqueda regulatoria y de competidores actualizada

> **Corrección sobre la v1:** el grupo NO se llama "Rappi Moto Cusco" — ese fue un error mío al leer el nombre guardado del contacto administrador ("Taxi Moto Cusco") en el export de texto. El grupo real se llama **"Viajes Seguro y Rápido"**, con **274 miembros**, y su ícono/logo dice **"RAPIMOTO CUSCO"** (con una sola P). Retiro la alerta de infracción directa de marca Rappi — sigue habiendo un parecido fonético a vigilar, pero no es la apropiación literal que reporté antes. Corrijo también el tamaño real de la comunidad: no son 42 personas en un día suelto, son 274 miembros — la señal de tracción es más grande de lo que mi primera muestra sugería.

---

## 0. Veredicto en una línea

Hay señal real de demanda y oferta, ya hay una comunidad de 274 personas activa alrededor de la idea, y **tú mismo pareces tener (o haber tenido) rol de administrador de ese grupo** — eso cambia la estrategia de "construir desde cero" a "posiblemente ya tienes el activo más difícil de conseguir: la comunidad". Antes de escribir código, hay tres cosas que resolver: quién controla el grupo hoy, qué negocio exacto vas a construir, y contra quién compites de verdad (spoiler: no es un grupo informal — son InDrive, Picap y DiDi, que ya probaron moto en Perú).

---

## 1. Lo que dice la DATA real (no la intuición)

Analicé el export del grupo de WhatsApp "RAPPI MOTO CUSCO" línea por línea. Esto es lo que hay, no lo que parece a simple vista:

**Volumen y estructura**
- 105 mensajes, 42 números únicos, capturados entre 12:16 y 23:32 de un solo día.
- El "operador" (+51 970 658 884) generó **31 de los 105 mensajes (30%)** — casi todos son el mismo texto de bienvenida copiado y pegado 15 veces. Esto es 100% automatizable con un bot de WhatsApp de una tarde de trabajo. Es tu primer quick win.

**Oferta vs. demanda — el dato que contradice la narrativa del video viral**
- 22 mensajes con señal de oferta ("soy motorizado", "tengo moto"), de **19 conductores únicos** en un solo día.
- Solo 11 mensajes con señal real de demanda (ruta + origen/destino/precio pedido).
- **Conclusión incómoda:** la oferta de conductores (19 personas en un día) es casi el doble que la demanda documentada de pasajeros (11 solicitudes). El video viral generó más gente queriendo *trabajar* que gente pidiendo *viajar*. Esto no invalida la idea, pero sí invalida la premisa de "hay tanta demanda que no doy abasto" — hoy, en este grupo, el cuello de botella es *demanda*, no oferta. Confirma un ángulo del análisis anterior (conseguir conductores no será tu problema) pero corrige el otro (no asumas demanda ilimitada sin medirla tú mismo).

**Precio — inconsistencia sin resolver, ya en el mercado**
- Leyandro cotiza S/1.50/km. El operador del grupo cotiza S/1.00/km. Es la misma "empresa" informal con dos tarifas distintas circulando el mismo día. Nadie está gobernando el pricing — es el primer problema que un dispatcher/app resolvería con valor inmediato y visible.

**Geografía de la demanda (rutas mencionadas, por frecuencia)**
San Jerónimo (9) · Centro (5) · Miraflores (4) · Amauta (4) · Pachacutec (3) · Puquin (3) · Nogales (3) · San Sebastián (2) · Wanchaq (2) · Larapa (2)

San Jerónimo–Centro es, con esta muestra, la ruta más caliente. Si sigues el "efecto de red localizado" que ya te propusieron, **este es literalmente el corredor a piloto** — no lo elijas a ciegas, ya lo tienes en la data.

**Distribución horaria** — pico entre 18:00–19:00 (39 mensajes, 37% del volumen) y un segundo pico 22:00–23:00. Coincide con salida de trabajo/universidad y salida nocturna. Útil para dimensionar cuántos conductores necesitas activos por franja, no las 24h.

---

## 1.5 Sobre si sigues siendo admin del grupo

No tengo forma de entrar a tu WhatsApp — no es algo que pueda "investigar" por ti desde aquí, tienes que verificarlo tú directamente. Es rápido:

1. Abre el grupo "Viajes Seguro y Rápido" → toca el nombre arriba → "Info. del grupo".
2. Baja hasta la lista de "Participantes" (274) — junto a cada admin aparece la etiqueta "Admin del grupo".
3. Busca tu número en la lista y revisa si tienes esa etiqueta.

**Por qué esto importa más de lo que parece:** si tu amigo te quitó como admin, alguien decidió unilateralmente que tú no participas en el control de un activo de 274 personas que ya genera transacciones reales (aunque sea informalmente). Antes de invertir tiempo construyendo una versión formal de este negocio, necesitas resolver esto con tu amigo directamente — por las buenas, hoy — porque si él controla el canal de distribución (el grupo) y tú controlas la tecnología, cualquier versión formal del negocio depende de un acuerdo de founders que hoy no existe por escrito. Trátalo como lo tratarías con cualquier cofounder: quién aportó qué, quién controla qué, y qué pasa si uno se va.

---

## 2. Corrección crítica al análisis regulatorio que recibiste

El documento que te pasaron (doc 1) acierta en el diagnóstico pero **está desactualizado en un punto importante**, y separa mal dos figuras legales distintas. Verifiqué contra fuentes de 2025-2026:

- **Moto lineal (2 ruedas) como taxi:** sigue prohibido a nivel nacional bajo el D.S. N° 035-2019-MTC, que además faculta al MTC a **bloquear aplicativos/webs** que faciliten el servicio — esto ya se ha aplicado contra apps como Picap en el pasado. Este riesgo del doc 1 es correcto y sigue vigente.
- **Lo que el doc 1 no te dijo:** el mototaxi de 3 ruedas (categoría L5) es una figura legal *distinta y sí regulada* bajo la Ley N° 31917 y su reglamento (D.S. N° 011-2025-MTC). El propio Gobierno acaba de **postergar** la entrada en vigencia de las nuevas exigencias de formalización de mototaxis hasta el 31 de diciembre de 2026 (D.S. N° 004-2026-MTC, enero 2026). Es decir: el mundo regulatorio del mototaxi de 3 ruedas está en pleno movimiento este año, con el Estado dando prórrogas y suavizando requisitos — un contexto distinto y más manejable que el de la moto lineal, que sigue siendo prohibición dura y explícita.

**Corrección importante que tú mismo me diste:** me dijiste que no hay mototaxis en Cusco. Tiene sentido con lo que encontré — el Centro Histórico de Cusco tiene ordenanzas de peatonalización y restricción vehicular fuertes por ser Patrimonio de la Humanidad (UNESCO), y a diferencia de Lima, Chiclayo o ciudades de selva, el mototaxi de 3 ruedas nunca se consolidó como parte del paisaje urbano cusqueño. Esto **invalida mi sugerencia original de "pivotea a mototaxi formal"** como salida regulatoria fácil — ese camino legal existe en el papel nacional, pero probablemente no tiene permisos municipales disponibles en Cusco ciudad, y culturalmente introducirías un vehículo que la ciudad ha evitado por décadas. Retiro esa recomendación tal como la planteé.

**Lo que sí se mantiene:** la moto lineal (2 ruedas) sigue prohibida a nivel nacional para transporte de pasajeros, sin importar la ciudad. No hay atajo regulatorio limpio en Cusco. El riesgo es el mismo que tenías, sin la salida de "cámbiate a mototaxi" que te ofrecí.

---

## 3. Naming: lo que sí vale la pena vigilar

Con la corrección, el logo dice "RAPIMOTO CUSCO" — fonéticamente cerca de Rappi pero no una copia literal del nombre. Es zona gris de marca, no infracción clara. Si formalizas esto, elige un nombre propio y limpio desde el día uno — no vale la pena heredar ni siquiera la sombra de ese parecido cuando registrar una marca nueva en Indecopi cuesta poco comparado con una carta notarial de un estudio de abogados de una multinacional.

Lo que sí es un problema real, tal como está operando el grupo hoy:
1. Cero verificación de antecedentes de conductores — solo "soy motorizado, tengo moto" y ya están coordinando viajes.
2. Datos personales (números, ubicaciones) circulando en texto plano en un grupo de 274 personas, contradiciendo su propio mensaje de "su seguridad es nuestra prioridad".
3. Pricing inconsistente (S/1.00 vs S/1.50/km) sin que nadie lo resuelva.

**No repitas ninguno de estos tres errores** si formalizas esto — son exactamente los puntos donde un accidente o una denuncia por filtración de datos te hunde en el día 1.

---

## 3.5 Contra quién compites de verdad

Esto es lo que cambia más el análisis: no compites contra un grupo informal de WhatsApp. Compites (o competirás) contra jugadores con capital que **ya probaron exactamente esto en Perú**:

- **Picap** (colombiana): lanzó taxi en moto en Lima en 2019, fue denunciada por Indecopi/El Comercio por cero verificación de conductores, el MTC bloqueó el aplicativo. Se retiró — y según fuentes del sector, volvió a intentarlo en 2023.
- **DiDi**: habilitó registro de conductores para "DiDi Moto" en 2023, pese a la prohibición vigente.
- **InDrive**: inició modo de prueba de taxi en moto en Perú en 2023, y **ya opera activamente en Cusco** (categoría auto) con comisión de 10-12% — la más baja del mercado — y modelo de negociación de tarifa entre pasajero y conductor.

**Por qué esto importa para ti:** InDrive ya tiene la app instalada en el teléfono de miles de cusqueños para pedir autos, tiene comisión más baja de lo que planteaste (10-12% vs tu 15-20%), y ya coqueteó con moto en otras ciudades del país. Si activa "InDrive Moto" en Cusco, no compites contra un grupo de WhatsApp — compites contra una app que el usuario ya tiene instalada y a la que ya le tiene confianza. Tu ventana de oportunidad real es *antes* de que eso pase, no después. Esto refuerza el punto del plan de 30 días: la velocidad de validación importa más que la perfección del producto.

---

## 4. La pregunta real que tienes que responder antes de programar una sola línea

Tienes dos negocios posibles, no uno. Elige conscientemente:

| | **Opción A — Uber de motos (B2C)** | **Opción B — Software para colectivos informales (B2B)** |
|---|---|---|
| Qué vendes | App de viajes al pasajero final | Backend de despacho/coordinación a operadores como el de "Rappi Moto Cusco" |
| Quién es tu cliente | El pasajero | El operador informal que hoy administra un grupo de WhatsApp a mano |
| Exposición regulatoria | Alta — tú eres visible como "empresa de transporte" | Baja — eres proveedor de tecnología, no operador de transporte |
| Fricción de venta | Debes crear demanda y oferta desde cero | Ya existe demanda/oferta — solo reemplazas WhatsApp manual por software |
| Con qué ya cuentas en ADIS | Nada directamente reutilizable | Publicadis ya digitaliza negocios informales — este es el mismo cliente arquetípico, otra vertical |
| Riesgo del "Caballo de Troya" (venderlo como delivery) | Lo necesitas para operar | No lo necesitas — vendes software, no transporte |

Mi lectura honesta, ya sin la salida fácil del "pivotea a mototaxi" que retiré arriba: la Opción A es la más "sexy" (la que grita el video viral y la comunidad de 274 personas) pero enfrenta la misma prohibición nacional de siempre, sin atajo legal en Cusco, y ahora sabes que compite contra InDrive, no solo contra un grupo informal. La Opción B es menos glamorosa pero es la que se parece a lo que ya sabes hacer (Publicadis), la que menos te expone personalmente ante el MTC, y la única de las dos que no depende de ganarle una guerra regulatoria a nadie. No es necesariamente la respuesta correcta — depende de tu apetito de riesgo — pero con la comunidad de 274 personas ya existente, la Opción B es más ejecutable de lo que parecía en la v1 de este análisis: no tendrías que crear un mercado de dos lados desde cero, sino ofrecerle software a un mercado que ya existe y que hoy coordina todo a mano.

---

## 5. Unit economics rápidos (con los números reales del grupo, no supuestos)

*Construí un modelo interactivo (`taxi_moto_unit_economics.xlsx`) con estas mismas fórmulas — cambia cualquier supuesto en la pestaña "Supuestos" (tarifa, comisión, conductores activos, gasolina) y todo el resto recalcula solo. Con los valores medios (S/1.25/km, 5km, comisión 18%, 10 conductores activos): margen real del conductor ≈ 54% de la tarifa, utilidad neta del piloto ≈ S/1,540/mes, y necesitarías subir a ~80 viajes/día combinados para llegar a S/500/día de comisión neta. Úsalo para probar tus propios escenarios antes de fijar precios.*

Usando el rango de tarifa observado en la data (S/1.00–1.50/km) y una comisión de 15-20% como propuso el análisis anterior:

| Distancia de viaje típica en Cusco urbano | Tarifa (S/1–1.50/km) | Comisión 15% | Comisión 20% |
|---|---|---|---|
| 3 km | S/3.00 – 4.50 | S/0.45 – 0.68 | S/0.60 – 0.90 |
| 5 km | S/5.00 – 7.50 | S/0.75 – 1.13 | S/1.00 – 1.50 |
| 8 km | S/8.00 – 12.00 | S/1.20 – 1.80 | S/1.60 – 2.40 |

Con comisiones de **S/0.45 a S/2.40 por viaje**, necesitas volumen alto para que el negocio respire — esto confirma el punto del análisis anterior sobre unit economics, pero ahora con cifras: para generar S/1,000/día en comisión necesitas entre ~400 y ~2,200 viajes/día dependiendo de distancia y comisión, concentrados en tus dos ventanas horarias pico (18-19h y 22-23h según tu propia data). Eso es el verdadero número a validar en el piloto, no "cuánta gente vio el TikTok".

---

## 6. Plan Concierge de 30 días (ajustado a lo que ya tienes)

No partes de cero: ya tienes un corredor validado por data (San Jerónimo–Centro) y decenas de conductores auto-identificados. El plan:

**Semana 1 — Formalizar el canal**
- Landing page simple + WhatsApp Business (número propio, no el del grupo informal).
- Selecciona 10 conductores del corredor San Jerónimo–Centro/Wanchaq con: antecedentes penales limpios, moto en regla, SOAT vigente. No los saques del grupo ajeno sin verificarlos tú mismo — la "confianza" de ese grupo hoy es cero.
- Fija UNA tarifa (resuelve la inconsistencia S/1 vs S/1.50 que ya vimos en el mercado) y comunícala de forma clara y consistente, a diferencia del operador actual.

**Semana 2 — Automatizar lo obvio**
- Bot de WhatsApp para el mensaje de bienvenida y captura de origen/destino (reemplaza las 15 repeticiones manuales que vimos en la data — literalmente un webhook + plantilla).
- Google Sheet o base simple para trackear: viaje, conductor, distancia, tarifa, hora.

**Semana 3-4 — Medir, no asumir**
- Métricas clave: viajes/día reales (compáralos contra los ~11 mensajes de demanda de tu muestra — ¿estás por encima o confirmas que la demanda es más chica de lo que el TikTok sugería?), tasa de repetición del mismo pasajero, margen neto del conductor después de gasolina.
- Decide entre Opción A y Opción B del punto 4 con datos de 30 días, no con el subidón del video viral.

---

## 7. Arquitectura técnica — cuándo, no antes

El stack que te propusieron (Node/NestJS + PostgreSQL/PostGIS + Socket.io + React Native) es correcto y coincide con lo que ya usas en ADIS (Next.js/TypeScript/Python/MongoDB) — la curva de aprendizaje sería PostGIS y WebSockets en tiempo real, nada que no puedas resolver. Pero constrúyelo **solo si el piloto manual valida demanda real por encima de tu muestra actual de 11 solicitudes/día**. Escribir la app antes de eso es resolver un problema que quizás no tengas.

---

## 8. Lo que haría esta semana si fueras yo

1. **Resuelve el control del grupo primero.** Verifica si sigues siendo admin (punto 1.5) y habla con tu amigo sobre roles y participación antes de que esto avance más — 274 personas es un activo real, y hoy no hay ningún acuerdo escrito sobre quién es dueño de qué.
2. Decide A vs B (punto 4) — con la corrección de que no hay atajo legal vía mototaxi, y con InDrive/Picap/DiDi como competencia real (punto 3.5), esta decisión pesa más que antes.
3. Corrobora tú mismo, con al menos 3-5 días de data propia, si la demanda real en San Jerónimo–Centro sostiene el volumen del modelo (usa el xlsx para simular distintos escenarios).
4. Si sigues con moto lineal (Opción A), habla con un abogado de tránsito ANTES de lanzar nada público — el D.S. 035-2019-MTC con bloqueo de apps es un riesgo binario, no gradual, y ahora compites contra jugadores que ya se metieron en ese problema.
5. Si te interesa la Opción B, el primer prospecto de venta literalmente ya existe: el operador de "Viajes Seguro y Rápido" — un colectivo de 274 personas con dolor real (pricing inconsistente, coordinación 100% manual, cero trazabilidad) que Publicadis ya sabe cómo digitalizar.
6. Revisa el "Kit operativo" (`taxi-moto-kit-operativo.md`) — checklist de verificación de conductores, guion del bot de WhatsApp para automatizar el mensaje que el operador repitió 15 veces a mano, y copy de landing listos para usar en la Fase Concierge.

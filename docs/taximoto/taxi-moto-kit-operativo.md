# Kit Operativo — Fase Concierge (Taxi-Moto Cusco)

Listo para usar en la Semana 1-2 del plan de 30 días. Todo esto reemplaza lo que hoy el operador de "Viajes Seguro y Rápido" hace a mano, mensaje por mensaje.

---

## 1. Checklist de verificación de conductores

No aceptes a nadie en el piloto solo porque escribió "soy motorizado" en un grupo — así es como opera la competencia informal y es exactamente el punto débil que Indecopi/El Comercio le encontraron a Picap en 2019.

**Documentos obligatorios antes de activar a un conductor:**
- [ ] DNI vigente (verificar que la foto coincida con la persona)
- [ ] Licencia de conducir categoría correspondiente a motocicleta, vigente (no vencida)
- [ ] Certificado de antecedentes penales (Poder Judicial) — máximo 30 días de antigüedad
- [ ] Certificado de antecedentes policiales
- [ ] SOAT vigente de la moto (foto de la tarjeta + verificación en la web de la SBS)
- [ ] Tarjeta de propiedad de la moto (verificar que el conductor sea el propietario o tenga autorización del dueño)
- [ ] Revisión técnica / estado visual de la moto (foto de frenos, luces, llantas)
- [ ] Foto del conductor con el casco puesto y con la moto (para el registro interno)

**Entrevista corta (5-10 min, en persona o videollamada):**
- [ ] Confirma zona donde vive/trabaja (para armar cobertura por distrito)
- [ ] Pregunta por qué quiere manejar — filtra urgencia económica extrema sin criterio de seguridad
- [ ] Explica las reglas: 1 pasajero, casco obligatorio para el pasajero también, no llevar menores sin adulto
- [ ] Deja claro que no acepta pagos adelantados ni comparte datos personales del pasajero fuera del canal oficial

**Regla de oro:** si falta un solo documento de la lista obligatoria, no entra al piloto. Es más barato perder un conductor entusiasta que absorber el costo reputacional y legal de un accidente con un conductor sin papeles — el propio análisis previo lo identificó como el riesgo más asimétrico de todo el negocio.

---

## 2. Guion del bot de WhatsApp (reemplaza el copy-paste manual)

El operador actual mandó esencialmente el mismo mensaje de bienvenida **15 veces a mano** en un solo día (confirmado en la data). Esto se automatiza con cualquier herramienta simple de WhatsApp Business API o incluso con respuestas rápidas configuradas — no necesitas el backend completo todavía.

**Mensaje de bienvenida automático (nuevo miembro o primer contacto):**
```
👋 Bienvenido/a a [NOMBRE DEL SERVICIO].
Tu seguridad es nuestra prioridad — todos nuestros conductores están verificados
(antecedentes, SOAT y licencia vigente).

¿Qué necesitas?
1️⃣ Pedir un viaje
2️⃣ Postular como conductor
3️⃣ Ver tarifas

Responde con el número de la opción.
```

**Flujo "Pedir un viaje" (opción 1):**
```
Perfecto. Para asignarte un conductor, necesito:
📍 Punto de recojo:
📍 Destino:
🕐 ¿Para ahora o programado? (indica día y hora si es programado)

Escribe los 3 datos en un solo mensaje, por ejemplo:
"San Jerónimo (Kayra) - Centro - ahora"
```
Con esto capturas exactamente los 3 datos que en la data real la gente daba desordenados y en varios mensajes (mira los mensajes de las 18:11, 18:12, 18:27) — reducir la fricción aquí es una mejora inmediata y visible sobre lo que existe hoy.

**Flujo "Postular como conductor" (opción 2):**
```
Genial, gracias por tu interés 🏍️
Postular toma 5 minutos. Necesitamos que envíes:
1. Foto de tu DNI
2. Foto de tu licencia de conducir
3. Foto de tu SOAT vigente
4. Foto de tu antecedentes penales y policiales (o número de trámite)
5. Foto de tu moto (placa visible)
6. Tu zona habitual (distrito/sector)

Una vez enviado todo, te contactamos en 24-48h para confirmar tu ingreso al piloto.
```

**Mensaje de confirmación de viaje (una vez asignado conductor):**
```
✅ Viaje confirmado.
Conductor: [NOMBRE] · Moto: [PLACA] · Tarifa acordada: S/[MONTO]
Llegará en aprox. [X] min.

Recuerda: usa casco, no compartas tu ubicación en tiempo real por este chat,
y confirma el pago directo con el conductor al finalizar.
```

**Aviso de seguridad recurrente (una vez por semana al grupo/lista):**
```
🔒 Recordatorio de seguridad: nunca compartas tu ubicación exacta ni datos
personales en el grupo público. Todo el proceso de coordinación va por
mensaje privado con el conductor asignado.
```

---

## 3. Copy para landing page / WhatsApp Business (perfil)

**Nombre del perfil de WhatsApp Business:**
`[Nombre del servicio] — Moto segura Cusco`

**Descripción corta (bio):**
`Transporte en moto verificado en Cusco. Conductores con antecedentes, SOAT y licencia al día. Pide tu viaje por acá 👇`

**Landing (hero section):**
```
Llega rápido, llega seguro.
Transporte en moto en Cusco con conductores 100% verificados.

[Pedir un viaje ahora] [Quiero ser conductor]

✔ Antecedentes penales y policiales verificados
✔ SOAT y licencia vigente en cada conductor
✔ Tarifa clara antes de subir — sin sorpresas
```

**Sección "Cómo funciona" (3 pasos):**
```
1. Escríbenos tu punto de recojo y destino
2. Te asignamos un conductor verificado cerca de ti
3. Confirmas la tarifa y viajas seguro
```

**Sección de confianza (usa el problema real que viste en la data — pricing inconsistente y cero verificación de la competencia informal):**
```
A diferencia de otros grupos informales de moto en Cusco, cada conductor
que ves aquí pasó por un proceso de verificación de documentos antes de
tomar su primer viaje. Y la tarifa es siempre la misma — no cambia según
quién te responda.
```

---

## 4. Plantilla de tracking (para la Google Sheet de la Semana 2)

Columnas mínimas para tu hoja de cálculo del piloto:

| Fecha | Hora | Conductor | Pasajero (solo iniciales) | Origen | Destino | Distancia (km) | Tarifa cobrada (S/) | Comisión (S/) | ¿Completado? | Nota |
|---|---|---|---|---|---|---|---|---|---|---|

Con esto alimentas directamente el modelo `taxi_moto_unit_economics.xlsx` — reemplaza los supuestos de la pestaña "Supuestos" por tus promedios reales apenas tengas 5-7 días de data, y la utilidad proyectada del piloto se actualiza sola.

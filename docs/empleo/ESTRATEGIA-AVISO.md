# Aviso de empleo: estrategia, pantallas y versiones

Índice para abrirlas: `/empleo/versiones`.

Este documento junta lo que ya estaba construido, lo que propusieron Gemini y Claude, y lo que queda en pie. No reemplaza los HTML: cada versión sigue abriéndose sola.

## Objetivo

Que un negocio de Cusco arme su aviso en Buscadis antes de imprimir, pasar el estado o publicar en un grupo, y que quien busca trabajo postule ahí en un minuto.

La métrica que manda, la que propuso Claude y encaja con el negocio: **puestos cubiertos por semana a través de Buscadis**.

Lo demás se mira después: avisos compartidos fuera, escaneos del QR, postulantes por aviso, negocios que publican un segundo aviso, y paso al plan de difusión.

## Primeros principios

1. El negocio no quiere “estar en un marketplace”. Quiere cubrir el turno esta semana, sin regalar el número personal y sin leer ochenta “info”.
2. Quien busca quiere sueldo, horario y zona antes de escribir, y no quiere que le pidan plata.
3. Canva gana en diseño. Buscadis solo gana si el aviso **contrata**: postulantes ordenados, QR que se apaga al cubrir el puesto, y un lugar al que volver.
4. Todo lo que se exporta (imagen, afiche, texto, tira) lleva el enlace o el QR. Si la imagen no regresa a Buscadis, es un generador de PDF.
5. Un aviso es un puesto. Cuatro vacantes en un título obligan a adivinar.
6. No se inventan datos. Si el local no dijo el sueldo, el aviso muestra que no lo dijo.
7. Nadie paga por postular. Nadie postula sin que el teléfono del local esté identificado. El candidato no crea cuenta ni adjunta CV para un puesto de salón.
8. El aviso de empleo no caduca al día siguiente. Un QR pegado en la pared que muere en 24 horas quema la marca.

## Cómo se alinean las propuestas

| Tema | Gemini | Claude | Lo que queda |
|---|---|---|---|
| Gancho | Herramienta de afiche en 45 s | “No diseñes. Dilo.” El aviso contrata | El de Claude. El afiche es el envoltorio |
| Duración gratis | No la fija | Hasta cubrir el puesto, tope 15–30 días | Empleos: abierto hasta cubrirlo o 30 días. Se cobra el alcance, no los días |
| Gratis de 24 h del resto del sitio | — | Lo señala como incompatible | Empleos quedan fuera de esa regla |
| Talones | Teléfono en la tira | Tiras, sin decir si llevan número | Tira con puesto, pago y enlace. Sin teléfono |
| Filtro del candidato | Casillas que apagan el botón | “Necesitas / No necesitas”, sin bloquear | La pareja de listas. Las casillas no |
| Ficha | Nombre, edad y zona, experiencia | Nombre, teléfono, disponibilidad, audio opcional | Nombre, teléfono, disponibilidad. Sin edad. Audio en un segundo paso |
| WhatsApp suelto | El botón abre el chat | Botón principal de ficha y uno secundario de preguntas | Principal: ficha. Preguntas: mensaje ya escrito, número fuera del papel |
| Sello RUC | Verificado de adorno | Diferenciador contra estafas | El sello existe cuando el RUC está revisado. Antes, la frase es “sin sello todavía” |
| Precio | No lo pone | Plan de S/50 al mes | En la calle ya hay muestras de S/50 y un destacado de S/30 a 7 días. No se fija el precio en la interfaz hasta cerrarlo en ventas |
| Crear el aviso | Formulario con chips | Una frase, un audio o una foto del papel | Los chips ya se pueden probar. La frase y la foto son el siguiente creador, no están en el laboratorio |
| Google for Jobs | No | JobPosting en servidor, y quitarlo al cerrar | Correcto y pendiente. El laboratorio es HTML estático y no indexa |

## Pantallas

El paquete de Claude (`claude-mobile.html`) muestra seis. Esta es la función de cada una y qué no debe hacer.

### 1. Aviso, vista de quien busca

Orden: negocio y sello, puesto y sueldo, chips (horario, inicio, experiencia), aviso de “nunca pagues”, lo que harás en tres líneas, necesitas / no necesitas, beneficios, lugar, ficha del negocio, avisos cerca, botón fijo “Postular en 1 minuto”.

El botón abre la ficha. No abre un chat vacío.

### 2. Creador, “dilo en una frase”

El local habla o pega el texto del papel. La estructura sale de eso: puesto, pago, horario, zona. Si falta el pago, se pregunta una vez, no se inventa.

Todavía no está construido. La suite de Gemini es el sustituto de hoy: campos cortos y chips.

### 3. Kit de difusión

Cuatro salidas del mismo aviso: historia 9:16, imagen de post, afiche A4, texto para el grupo. Todas con el enlace. Contador simple de vistas y de fichas armadas.

### 4. Bandeja de postulantes

Lista de fichas (nombre, teléfono, disponibilidad, horario elegido). Un toque marca el puesto cubierto y ese estado llega al enlace y al QR. No es un ATS: no hay ranking, pruebas ni video obligatorio.

### 5. Afiche A4

Letra grande, QR real, leyenda de no escribir solo “info”, tiras para arrancar sin el número. Al imprimir, el resto de la pantalla no sale.

### 6. Historia 9:16

La misma información, en vertical, para el estado. No es otro diseño: es el mismo dato.

## Vista del anunciante y vista de quien busca

Quien publica ve el kit, la bandeja y el cierre. Quien busca ve el aviso y la ficha. No comparten la misma primera pantalla.

El anunciante no ve un editor de lienzo. Quien busca no ve “compartir, imprimir, editar” como si el aviso fuera suyo. En el laboratorio, “Compartir” sigue visible en la prueba de Buscadis para poder recorrer el flujo; en el producto, eso queda detrás de quien creó el aviso.

## Ejemplos

En `/empleo-lab/ejemplos.html` se alternan cuatro casos. Los tres primeros salen de avisos reales ya redactados para publicar. El cuarto es el modelo completo.

| Caso | Qué contrasta |
|---|---|
| Pucará | Cocina en Saphy. Dos pagos y dos horarios. Lo más cerca del ideal. Le falta sello y mapa |
| Black Llama | Bar del centro. Cuatro puestos, planilla, sin sueldo, pide CV |
| Tambobamba | Provincia. Pasaje, comida y cuarto. Sin sueldo, dos teléfonos, tres puestos |
| Ideal | La estructura de arriba, completa, marcada como modelo. El sueldo y la puerta son los de Pucará para no inventar cifras |

Wild Rover queda fuera del interruptor a propósito: pide CV en puerta y por correo, sueldo “acorde al mercado”, y varias vacantes. Es el mismo problema que Black Llama, con más puestos. No suma un contraste nuevo.

## Ideas que se descartan

- Editor libre tipo Canva, aunque sea con tres colores “por si acaso” en la primera versión. Tres plantillas fijas, cuando existan, no un lienzo.
- Registro o CV antes de postular.
- Casillas que impiden postular si no marcas “cumplo”.
- Pedir la edad.
- Teléfono en el afiche o en la tira.
- QR dibujado que no abre nada.
- Sello de verificado, “85 ofertas” o mapa si el dato no existe.
- Caducidad de 24 horas en empleos.
- Cobrar por ver el contacto del empleo (la compuerta de leads del resto del sitio).
- Marca de agua que tape al negocio.
- Que el aviso de empleo sea un clasificado más del feed y nada más. El feed es una puerta; la razón de entrar es el kit.
- Un sistema de selección, ranking o videocurrículum para competir con CazVid. La ventaja local es el papel, el QR y la ficha corta.
- Fijar en la interfaz “S/50 al mes” o “S/30” hasta que ventas use una sola oferta. Los dos números ya aparecen en campañas distintas.

## Contradicciones que ya estaban

- La estrategia comercial de empleos decía no regalar el aviso para siempre, y cobrar destacado y días. Claude dice que cobrar los días rompe el afiche. Se separan: la duración del empleo es hasta cubrirlo (tope 30 días); el pago es difusión y destacado.
- Gemini ponía el número en la tira y a la vez pedía que la gente entrara a Buscadis. Las dos cosas no caben. Gana el enlace.
- Claude pone un WhatsApp secundario “para preguntas” y a la vez dice que el número personal es el problema. El secundario solo existe dentro de la página, con el texto ya armado, nunca impreso.
- El sello de RUC es el diferenciador de confianza y, si se pinta sin revisión, es otra estafa. Se diseña el lugar del sello y se deja vacío hasta verificar.
- “Dilo en una frase” y “tres plantillas” no pelean: la frase llena la plantilla. No se elige tipografía.

## Qué versión mirar para qué

| Pregunta | Ábrela |
|---|---|
| ¿Cómo se siente el taller de afiches? | Gemini · Creator |
| ¿Cómo se llena y se ve al mismo tiempo? | Gemini · Suite |
| ¿Cómo postula alguien en el celular? | Gemini · Postulante |
| ¿Cómo quedó con los dos turnos de Pucará? | Buscadis · prueba |
| ¿Qué pasa si se juntan suite, ficha y tiras sin teléfono? | Fusión |
| ¿Cómo son las seis pantallas de Claude? | Claude · mobile |
| ¿Cómo se ve el mismo esqueleto con avisos reales distintos? | Ejemplos |

## Qué no está construido

Creador por frase, audio o foto. Bandeja de postulantes de verdad. JobPosting en el servidor y su baja al cerrar. Sello de RUC. Métricas de escaneo más allá del contador de esta sesión. Plan de pago dentro del producto.

El laboratorio sirve para elegir la forma. El sprint que sigue, si se confirma, es la página del aviso en el servidor con un puesto real, el enlace, el QR y la ficha de tres campos.

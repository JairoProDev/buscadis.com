# 06 — Componentes: especificación completa

> **CONTEXTO PARA LA IA:** cada sección es un brief autónomo. Para implementar un componente basta con esta sección + `05-DESIGN-SYSTEM.md` + el tipo correspondiente de `07`. No implementes más de dos componentes por sesión.
>
> Estructura de cada sección: **Por qué existe · Qué resuelve · Dónde va y por qué ahí · Qué debe contener · Qué nunca debe hacer · Cómo se hace excelente · Especificación técnica**.

---

## §1 — Hero / Identidad

**Por qué existe.** Es la respuesta a la única pregunta que el visitante tiene en los primeros tres segundos: "¿es este el negocio que busco?". Su función no es impresionar, es confirmar. Un visitante que llegó desde un enlace de WhatsApp, desde el mapa o desde Google necesita reconocer instantáneamente que aterrizó donde quería; si duda, se va, y ese abandono es invisible en las métricas porque nunca hubo interacción.

**Qué resuelve.** Identidad, categoría, lugar y legitimidad, en un bloque que debe ocupar lo mínimo posible. El error central de los mockups actuales es tratar el hero como una portada de revista: portada grande, logo enorme, eslogan, categoría, ciudad y una fila de estadísticas, todo antes de que exista una sola acción posible. Eso consume la mitad de la pantalla de un teléfono para decir algo que se resuelve en cuatro líneas.

**Dónde va y por qué ahí.** Primero. Visual 2.0: portada más inmersiva (~200px) + identidad con tipografía display; la barra sticky garantiza acción primaria siempre visible. El módulo siguiente debe asomar para invitar al scroll.

**Qué debe contener.** Portada 16:9 recortada a ~200px con degradado de legibilidad. Logo **72px**, cuadrado con radio grande — no circular (recorta logos rectangulares). Nombre en display 26–28px. Meta: `Categoría · Distrito`. Sello de verificación al lado del nombre. Eslogan baja a "Quiénes somos".

**Qué nunca debe hacer.** No debe llevar carrusel de portadas ni video con autoplay: multiplica el peso, mueve el LCP por encima del presupuesto y no aporta información. No debe apilar badges ("Premium", "Top Seller", "24/7", "Pet Friendly"): cuando hay cinco insignias, ninguna significa nada. Máximo dos, y solo si son verificables. No debe contener el botón de compartir sobre la portada, donde compite con la identidad: va en la barra de acción.

**Cómo se hace excelente.** Tres detalles. Primero, el color dominante de la portada se extrae en la subida y se usa como fondo de carga, de modo que la transición no sea un salto de gris a foto. Segundo, si el negocio no tiene portada, no se muestra un placeholder gris: se genera un fondo con el color de marca y una textura sutil derivada del nombre, de manera que un perfil sin foto igual se vea intencional. Tercero, el sello de verificación es tocable y abre una hoja que explica qué se verificó y cuándo — una insignia que explica su propio criterio vale diez veces más que una que solo brilla.

**Especificación técnica.**
```
Alto total: ~248–268px (portada 200 + solapa ~56) — Visual 2.0
Logo: 72×72, radius --rd-lg, borde 2px --sf-elev, solapado -36px sobre la portada
Nombre: --ts-nombre, máx 2 líneas, elipsis
Meta: --ts-meta, --tx-muted, formato "Categoría · Distrito"
Verificación: 18px, --bs-chicha (nivel 2-3) o --tx-muted (nivel 1), abre hoja
Portada: <img> con fetchpriority="high", sizes correcto, LQIP inline
Sin portada: fondo var(--mk-suave) + patrón SVG determinista por slug
Estados: cargando (color dominante), sin logo (iniciales sobre --mk-accion)
Eventos: perfil_visto {slug, origen, arquetipo}
```

---

## §2 — Métricas de confianza

**Por qué existe.** Un visitante que no conoce el negocio necesita un atajo para decidir si vale la pena invertir treinta segundos más. Las métricas son ese atajo. Bien hechas, sustituyen a párrafos de autopromoción; mal hechas, son la parte del perfil que más rápido destruye la credibilidad de toda la plataforma.

**Qué resuelve.** La pregunta "¿otros ya confiaron en este negocio?", que es la forma en que un humano evalúa riesgo cuando no tiene información directa. Es prueba social comprimida.

**Dónde va y por qué ahí.** Inmediatamente bajo el nombre, en la misma región visual que la identidad, porque la confianza se evalúa *junto* con el reconocimiento, no después. Va antes que cualquier acción: pedirle a alguien que escriba por WhatsApp antes de darle una razón para confiar es pedirle un salto de fe.

**Qué debe contener.** Dos clases claramente distinguibles. Las **verificadas** las calcula la plataforma y son las únicas con peso visual pleno: calificación con número de reseñas, tiempo medio de respuesta medido, antigüedad en Buscadis, número de pedidos o contactos concretados. Las **declaradas** las escribe el negocio, se limitan a dos, van en color atenuado y con un signo discreto de "dato del negocio". La separación tipográfica es lo que salva al sistema: permite que el negocio muestre su orgullo ("25 años en el rubro") sin que eso contamine la confianza de los datos reales.

**Qué nunca debe hacer.** No debe presentarse como una tabla de cuatro columnas con divisores verticales — eso obliga a comprimir cada dato a 10px y a truncar las etiquetas. No debe mostrar métricas cero: un "0 reseñas" es peor que no mostrar nada, porque convierte la ausencia en un dato negativo explícito. No debe inventar unidades grandilocuentes: "+18K clientes felices" en una barbería de Cusco es matemáticamente absurdo y el visitante local lo sabe.

**Cómo se hace excelente.** Con una línea, no con una tabla. Un renglón continuo con separadores de punto medio, donde la calificación va primero con la estrella en `--bs-sol` y el número en mono, y el resto sigue en texto normal. Cuando el negocio es nuevo y no tiene métricas verificadas, en lugar de vacío se muestra la fecha de incorporación: "En Buscadis desde julio 2026" — un dato honesto, pequeño y que crece de valor con el tiempo. Y la calificación debe abrir la distribución de estrellas al tocarla: un 4.7 con distribución visible convence más que un 5.0 sin explicación.

**Especificación técnica.**
```
Layout: una línea, flex-wrap, gap --sp-2, separador "·" en --tx-faint
Verificadas: --ts-cuerpo, --tx-base; números en --ff-data
Declaradas: --ts-meta, --tx-muted, prefijo ícono 12px
Calificación: estrella 14px --bs-sol + "4.7" mono + "(128)" --tx-muted, tocable
Sin datos: "En Buscadis desde {mes año}"
Máximo 4 elementos en la línea; el resto se ve en la hoja de detalle
```

---

## §3 — Estado vivo *(elemento distintivo del producto)*

**Por qué existe.** Porque es lo único del perfil que cambia cada vez que alguien entra, y porque responde a las dos ansiedades reales de comprarle a un negocio pequeño en Perú: "¿estarán atendiendo?" y "¿me van a contestar o me van a dejar en visto?". Ninguna plataforma actual responde la segunda pregunta. Google dice si está abierto. Instagram no dice nada. Nosotros decimos si está abierto, cuánto tardan en responder y si hay actividad hoy.

**Qué resuelve.** Convierte un perfil estático en algo que se siente conectado con un negocio que existe ahora mismo. Es lo que hace que valga la pena volver, y por lo tanto lo que sostiene una suscripción mensual.

**Dónde va y por qué ahí.** Pegado bajo las métricas, antes de las acciones. Es el último dato que el usuario necesita antes de decidirse a contactar, y su posición ahí reduce la principal causa de abandono en el momento del contacto.

**Qué debe contener.** Un punto de color y una a tres afirmaciones cortas, todas calculadas: apertura ("Abierto · cierra 8:00 p. m." o "Cerrado · abre mañana 9:00 a. m."), velocidad de respuesta medida sobre los contactos reales de los últimos 30 días ("Responde en ~8 min"), y actividad cuando existe volumen suficiente ("4 pedidos hoy", "delivery activo"). Cada afirmación solo aparece si el dato existe y supera un umbral de confianza estadística.

**Qué nunca debe hacer.** Nunca puede mentir ni estimar. "3 personas viendo esto ahora" cuando no hay tres personas es un patrón oscuro y, en una plataforma que apuesta su valor a la confianza, es suicida. Nunca debe parpadear ni animarse de forma llamativa: un punto que late suavemente basta y es el único elemento animado permitido en todo el perfil. Nunca debe deshabilitar el contacto cuando el negocio está cerrado; solo cambia el texto del botón para ajustar la expectativa.

**Cómo se hace excelente.** El cálculo del tiempo de respuesta debe ser conservador y explicable: mediana, no promedio, sobre al menos 10 contactos, con corte por horario de atención, y con una hoja que explique "cómo calculamos esto" al tocarlo. La honestidad del cálculo es el producto. Además, para el negocio, este módulo es el mejor argumento de venta que existe: en la demo se le muestra que su perfil literalmente le dice al cliente que está atendiendo ahora.

**Especificación técnica.**
```
Layout: fila de 32px, punto 8px + texto --ts-meta
Colores: --ok / --warn (falta <60min para cerrar) / --err (cerrado)
Cálculo apertura: en zona horaria del negocio, con feriados peruanos y cierres puntuales
Respuesta: mediana de primer_respuesta_min, n≥10, ventana 30d, redondeada a 5min
Actividad: solo con n≥3 en el día; nunca "personas viendo"
Actualización: SSR + revalidación cada 60s; aria-live="polite"
Animación: pulso 2s en el punto, solo si estado = abierto; respeta reduced-motion
```

---

## §4 — Acciones rápidas y barra de acción

**Por qué existe.** Todo el perfil existe para producir un contacto. Este es el módulo donde se cobra el trabajo de los demás.

**Qué resuelve.** El problema de que la acción principal solo esté disponible en un punto del scroll. Un visitante decide contactar en un momento impredecible — a veces al ver el precio, a veces al leer una reseña — y en ese instante la acción tiene que estar bajo su pulgar.

**Dónde va y por qué ahí.** En dos lugares complementarios. La **barra fija inferior** contiene únicamente la acción primaria del arquetipo y está siempre presente. La **fila de acciones rápidas** aparece una vez, bajo el estado, con las tres a cinco acciones secundarias en formato ícono + etiqueta corta. Esta separación resuelve el problema que señalaste: en los mockups hay tres botones grandes de colores distintos, todos gritando lo mismo, y el usuario no tiene jerarquía para decidir.

**Qué debe contener.** La barra fija: un botón a ancho casi completo con el color de marca, más dos íconos pequeños a la izquierda (favorito y compartir). La fila de acciones rápidas: llamar, cómo llegar, catálogo, cotizar, agendar — según arquetipo, máximo cinco, con ícono de 24px y etiqueta de 12px debajo, en scroll horizontal si excede el ancho.

**Qué nunca debe hacer.** Visual 2.0 permite **hasta tres** CTAs táctiles en la fila (WA verde semántico, llamar con `--mk-accion`, llegar outline) — no cuatro saturados iguales. Nunca un enlace de WhatsApp sin mensaje pre-armado. Nunca redirigir sin registrar el evento. Nunca ocultar la barra al hacer scroll hacia abajo.

**Cómo se hace excelente.** Con el contexto en el handoff. Un mensaje pre-armado convierte una conversación fría en una venta empezada: *"Hola, vi en Buscadis su Pomada Mate (S/45). ¿Tienen stock?"*. Y cada redirección pasa por `/r/{token}`, lo que permite decirle al negocio "12 personas te escribieron esta semana desde tu perfil, 7 desde la ficha de ese producto". Ese informe es lo que renueva la suscripción. Además: fuera del horario, el texto cambia a "Escribir (responden mañana 9:00 a. m.)", que sube la tasa de contacto porque elimina la sensación de estar hablándole a una pared.

**Especificación técnica.**
```
Barra fija: alto 64 + env(safe-area-inset-bottom), fondo --sf-elev, borde superior --bd-hair
Botón primario: alto 48, --rd-lg, fondo --mk-accion, texto --mk-sobre, --ts-cuerpo 600
Iconos izquierda: 44×44 cada uno, sin color de marca
Acciones rápidas Visual 2.0:
  Fila A (3 CTAs): min-height 48, --rd-lg, WA #128C7E, llamar --mk-accion, llegar outline
  Fila B (secundarias): ícono 22 en círculo 48 --mk-suave, etiqueta 12px
Handoff: siempre /r/{token} → 302 → destino
  WhatsApp: https://wa.me/{tel}?text={mensaje contextual urlencoded}
  Teléfono: tel:{e164}   ·   Ruta: geo: en móvil, Google Maps en escritorio
Eventos: accion_click {tipo, origen, item_id?}, handoff_redirigido {canal, token}
```

---

## §5 — Novedades / Highlights

**Por qué existe.** Porque el formato circular de historias es el patrón de navegación más aprendido del mundo: cualquier persona con Instagram o WhatsApp sabe qué hacer con una fila de círculos, sin instrucciones. Aprovechar ese aprendizaje es gratis. Pero copiarlo tal cual desperdicia la oportunidad: en Instagram los highlights son archivo; aquí deben ser el índice visual del negocio.

**Qué resuelve.** Dos cosas: da al negocio un lugar para publicar sin fricción (una foto y un título, desde el celular, en veinte segundos), y da al visitante un menú visual de lo que el negocio quiere destacar hoy.

**Dónde va y por qué ahí.** Depende del arquetipo. En Retail y Comida va **después** del catálogo, porque el catálogo es lo que el visitante vino a ver y las novedades son complemento. En Servicios y Alto Ticket puede ir antes, porque ahí la prueba visual del trabajo *es* la oferta. Los mockups las ponen siempre arriba, lo que en una ferretería significa poner "Detrás de cámaras" encima de los productos.

**Qué debe contener.** Círculos de 68px con anillo en color de marca, título de una línea debajo, indicador de contenido nuevo cuando corresponde. Cada highlight puede contener imágenes, video corto, un producto enlazado, una promoción, un PDF o un enlace. Al tocar, se abre el visor a pantalla completa con avance por toque, barra de progreso, deslizar hacia abajo para cerrar, y un botón de acción contextual al pie ("Ver producto", "Pedir por WhatsApp").

**Qué nunca debe hacer.** No debe tener más de ocho highlights visibles: más allá de eso es un archivo que nadie recorre. No debe permitir video vertical de más de 30 segundos por diapositiva. No debe reproducir con sonido por defecto. No debe mostrar highlights sin actualizar en más de 90 días con el indicador de "nuevo".

**Cómo se hace excelente.** Con el puente a Deals. Un highlight publicado aquí puede convertirse en un Deal del feed de Buscadis con un toque, y viceversa. Eso convierte al perfil en la puerta de entrada al ecosistema y le da al negocio una razón concreta para publicar seguido: su contenido no muere en su propio perfil, sale al feed donde hay tráfico que no es suyo. Ese es el bucle que ninguna competencia local puede replicar.

**Especificación técnica.**
```
Círculo 68px ⌀, anillo 2.5px --mk-accion (o degradado si contenido <24h), gap --sp-4
Título: --ts-meta, 1 línea, centrado, máx 12 caracteres visibles
Visor: pantalla completa, barras de progreso 2px arriba, toque der/izq navega,
  swipe abajo cierra, autoavance 5s (imagen) o duración del video
Precarga: solo el primer frame de cada highlight; el resto bajo demanda
Máximo 8 highlights · 10 diapositivas c/u · video ≤30s ≤3MB
Eventos: highlight_abierto {id}, highlight_completado {id}, highlight_cta {id, destino}
```

---

## §6 — Categorías

**Por qué existe.** A partir de cierto tamaño, un catálogo sin categorías es una pila. La categoría es el primer filtro mental del comprador: no busca "todo", busca "postres" o "cemento".

**Dónde va y por qué ahí.** Justo antes o después del catálogo destacado, nunca lejos de él. Solo aparece cuando hay al menos 3 categorías y 20 ítems: por debajo de ese umbral, categorizar cuatro productos hace ver al negocio más pequeño de lo que es.

**Qué debe contener.** Chips o cards pequeñas con nombre y conteo real ("Cementos · 42"). El conteo es información de densidad: le dice al visitante dónde está el surtido. Al tocar, no navega a otra página: filtra el catálogo destacado en el sitio y hace scroll suave hacia él, con el chip marcado como activo y un botón para limpiar.

**Qué nunca debe hacer.** No debe usar fotos genéricas de banco de imágenes por categoría; si no hay foto real, un ícono es más honesto y pesa 1 KB. No debe tener más de 12 categorías visibles.

**Cómo se hace excelente.** Ordenando por popularidad real medida (cuáles se tocan más, cuáles se compran más), no por orden alfabético ni por el orden en que el negocio las creó. El sistema aprende y reordena solo.

---

## §7 — Catálogo destacado

**Por qué existe.** Es el módulo que sostiene el valor entero del producto para la mayoría de tus clientes. Un negocio que vende cosas entra a Buscadis para que se vean sus cosas con su precio. Todo lo demás es contexto.

**Qué resuelve.** La pregunta central del visitante — "¿tienen lo que quiero y cuánto cuesta?" — sin obligarlo a escribir a nadie ni a esperar respuesta. Cada producto con precio visible es una consulta de WhatsApp que el negocio no tiene que contestar y una venta que no se pierde por no responder a tiempo.

**Dónde va y por qué ahí.** En Retail y Comida, inmediatamente después de las acciones rápidas. Tu instinto era correcto y hay que ser todavía más agresivo: el catálogo va antes que las promociones, antes que las novedades, antes que las reseñas y muchísimo antes que "Quiénes somos". El visitante no entró a leer la historia del negocio; entró a comprar. En Servicios, este módulo se reemplaza por "Servicios y precios" (§7b) y en Alto Ticket por un listado con atributos comparables.

**Qué debe contener.** Un carrusel horizontal de 8 a 12 productos destacados, seleccionados por el negocio o, si no eligió, por el algoritmo (más vistos, más consultados, con mejor foto). Cada card: imagen 1:1, nombre en dos líneas legibles, precio en mono destacado, precio anterior tachado si hay descuento, y **una** etiqueta de estado como máximo. La cabecera del módulo lleva el enlace con el número real: "Ver los 358 →". Ese número es un dato de venta: comunica surtido antes de entrar.

**Qué nunca debe hacer.** No debe ocultar el precio. No debe apilar tres badges en el mismo card ("Nuevo" + "Más vendido" + "Oferta"), porque cada badge adicional resta credibilidad a los anteriores. No debe abrir el producto en una página nueva desde el carrusel: se abre en hoja modal, para que el usuario pueda mirar cinco productos sin perder su posición en el scroll. No debe comprimir el card por debajo de 156px para que entren más — ese es el error concreto que detectaste.

**Cómo se hace excelente.** Con la ficha de producto. Al tocar, la hoja sube con imagen grande, precio, descripción, atributos, disponibilidad y un botón "Preguntar por este producto" que abre WhatsApp con el mensaje ya escrito y el enlace del producto incluido. La conversación empieza con el negocio sabiendo exactamente qué le están pidiendo. Segundo detalle: los productos agotados no se ocultan, se muestran en escala de grises con "Avísame cuando llegue" — eso captura demanda que hoy se pierde en silencio. Tercero: la ficha de producto es una ruta real e indexable, lo que convierte cada producto en una puerta de entrada desde Google.

**Especificación técnica.**
```
Card 156×~250, imagen 156×156 --rd-md, nombre --ts-card 2 líneas, precio --ts-precio
Badge: 1 máximo, esquina superior izquierda, --ts-etiqueta
Agotado: filtro grayscale(1) opacity .6 + cinta "Agotado"
Carrusel: snap x mandatory, peek 20–40%, bleed lateral al borde
Cabecera: "Productos destacados" + "Ver los {n} →"
Hoja de producto: 92vh máx, history.pushState, galería con snap, CTA fijo abajo
Ruta indexable: /{slug}/producto/{id} con schema Product + Offer
Eventos: producto_visto, producto_abierto, producto_contacto {id, precio}
```

### §7b — Servicios y precios

Misma mecánica, distinto card: sin fondo fotográfico obligatorio, con nombre, precio "Desde S/", duración estimada y una línea de qué incluye. El precio "Desde" resuelve la resistencia real de los negocios de servicios a publicar tarifas, sin caer en "consultar precio", que es la principal causa de abandono en este arquetipo. Cada servicio abre una hoja con el detalle y el botón de agendar o cotizar.

---

## §8 — Reseñas

**Por qué existe.** Porque la opinión de un desconocido pesa más que cualquier cosa que el negocio diga de sí mismo, y porque la calificación es el multiplicador de conversión más potente disponible: la evidencia de mercado indica que subir dos décimas de estrella puede casi duplicar la conversión, y que el volumen de reseñas importa tanto como la nota.

**Qué resuelve.** El riesgo percibido de comprarle a alguien que no conoces, que en el comercio local peruano es alto y justificado.

**Dónde va y por qué ahí.** Después del catálogo. El orden importa: primero se despierta el deseo (producto y precio), después se resuelve el miedo (reseñas). Invertirlo hace que el visitante evalúe la confianza de algo que todavía no quiere.

**Qué debe contener.** Una cabecera con la nota grande, el total y la **distribución de estrellas** en barras — la distribución es lo que hace creíble la nota. Luego un carrusel de reseñas de 282px con iniciales sobre color derivado del nombre (nunca fotos de banco de imágenes), nombre, estrellas, fecha relativa, tres líneas de texto y, cuando existe, la respuesta del negocio destacada con fondo suave. La respuesta del negocio a una reseña negativa convierte más que cinco reseñas positivas: demuestra que hay alguien atendiendo.

**Qué nunca debe hacer.** No debe mostrar solo las cinco estrellas ni permitir que el negocio borre reseñas negativas — solo puede responderlas y reportar abuso. No debe mostrar reseñas sin fecha: una reseña sin fecha podría ser de 2019. No debe usar avatares generados.

**Cómo se hace excelente.** Con la captura automática. Cuarenta y ocho horas después de un contacto concretado, el sistema envía al comprador un enlace de una sola pregunta con estrellas; una respuesta toma cinco segundos. Ese flujo, y no el diseño del carrusel, es lo que hace que un perfil pase de 0 a 40 reseñas en tres meses. Segundo: etiquetar "Contacto verificado por Buscadis" cuando la interacción ocurrió en la plataforma, lo que crea una diferencia visible con las reseñas de Google que cualquiera puede escribir.

---

## §9 — Promoción vigente

**Por qué existe.** Para dar una razón de urgencia y una razón de retorno. Es el módulo que convierte al que estaba mirando en el que compra hoy.

**Dónde va y por qué ahí.** Después del catálogo, nunca antes: una promoción mostrada antes de que el visitante sepa qué vende el negocio es publicidad sin contexto. La excepción es una campaña puntual muy fuerte, y aun así con un solo banner.

**Qué debe contener.** Una sola promoción visible: la de mayor prioridad y vencimiento más cercano. Título corto, condición en una línea, contador de tiempo cuando faltan menos de 72 horas, y botón que lleva a WhatsApp con el código ya incluido en el mensaje. Si hay más, un enlace discreto "Ver las 4 promociones".

**Qué nunca debe hacer.** No debe rotar automáticamente. Aquí te contradigo con fundamento: en carruseles automáticos la interacción se concentra casi por completo en la primera diapositiva, el auto-avance incumple el criterio WCAG 2.2.2 si no se puede pausar, y el movimiento durante la lectura es una de las causas más comunes de frustración medida en móvil. Si aun así quieres rotación, debe ser pausable, detenerse permanentemente ante cualquier interacción, tener altura fija y máximo tres diapositivas. Tampoco debe usar cuentas regresivas falsas que se reinician: es el patrón oscuro más denunciado del comercio electrónico.

**Cómo se hace excelente.** Con vencimiento real y desaparición automática. Una promoción vencida que sigue publicada es la señal más clara de que un perfil está abandonado. El sistema la retira sola y le avisa al negocio.

---

## §10 — Galería

**Por qué existe.** Porque hay negocios cuyo producto no es un objeto sino un resultado: un corte de cabello, una fachada de drywall, una torta personalizada, un jardín. Para ellos la galería *es* el catálogo.

**Dónde va.** En Servicios, alto en la página, justo después de los servicios y precios. En Retail, bajo, como refuerzo del local y el equipo.

**Qué debe contener.** Carrusel de 136px con visor a pantalla completa, y soporte para el par antes/después con deslizador comparativo, que en estética, dental y construcción es la pieza de contenido de mayor conversión que existe.

**Qué nunca debe hacer.** No debe mezclar fotos del local con fotos de trabajos sin etiquetar. No debe mostrar más de 12 sin paginar. No debe cargar todas las imágenes a resolución completa.

---

## §11 — Publicaciones / Feed del negocio

**Por qué existe.** Es la diferencia entre un directorio y una red social. Da al negocio un motivo para volver a entrar a su perfil, y a los seguidores un motivo para volver a mirarlo.

**Dónde va.** En la mitad baja, salvo en Profesional/B2B, donde los artículos son prueba de competencia y suben.

**Qué debe contener.** Cards de 204px con imagen, título en dos líneas, fecha y reacciones. Al tocar, ruta real indexable. Cada publicación puede promoverse a Deals.

**Cómo se hace excelente.** Con notificación a los seguidores y con la vinculación al catálogo: una publicación puede etiquetar productos, de modo que el contenido no sea solo contenido sino un camino de vuelta a la venta.

---

## §12–14 — Ubicación, Horario y Métodos de pago

**Por qué existen.** Son los tres datos que el visitante busca con más intención explícita y los que hoy están peor resueltos en el resto de internet: la dirección está desactualizada, el horario es de 2023 y nadie sabe si aceptan Yape.

**Sobre tu observación de que se ven apretados: sí, lo están.** En los mockups los tres se meten en una fila de tres columnas de ~110px, donde el mapa mide menos que una uña, el horario se corta y los logos de pago quedan a 20px. Estos tres módulos son de *lectura*, no de exploración: comprimirlos horizontalmente rompe justo la información que el usuario quiere leer con calma.

**Cómo se resuelven.** Ubicación y horario van juntos en un bloque de ancho completo, apilados: mapa estático de 160px de alto (imagen, no iframe, para no cargar 400 KB de SDK de Google), dirección en dos líneas, referencia ("frente al Mall Aventura" — en Cusco la referencia vale más que la dirección), y dos botones: "Cómo llegar" y "Ver en mapa". Debajo, el horario de hoy en una línea destacada con el estado, y un acordeón "Ver toda la semana". Los métodos de pago van en su propia fila, como logos de 56×36 sin texto, envueltos en grilla, porque el usuario reconoce Visa y Yape sin leer.

**Qué nunca hacer.** No cargar el mapa interactivo en la carga inicial: es el mayor costo de rendimiento evitable del perfil. No mostrar los siete días desplegados por defecto. No poner el horario en scroll horizontal: es información comparable y el scroll horizontal impide compararla.

**Cómo se hace excelente.** Con el horario de hoy resuelto en lenguaje humano ("Abierto hasta las 8:00 p. m.") en vez de una tabla, y con detección de feriados peruanos, que es la causa número uno de que un cliente llegue a una puerta cerrada.

---

## §15 — Canales y redes

**Por qué existe.** Porque la web y las redes son canales del mismo negocio, y tenías razón: la web es un canal más, no una categoría aparte.

**Qué debe contener.** Fila horizontal de logos a color, 44px de área tocable, sin texto — el logo de Instagram no necesita decir "Instagram". Scroll horizontal cuando exceden el ancho, sin botón de "más": el corte del último logo ya comunica que hay más, y un menú oculto mata el clic.

**Qué nunca debe hacer.** No mezclar aquí las acciones de contacto (WhatsApp y teléfono no son "redes"). No mostrar redes sin publicaciones recientes: un enlace a un Instagram muerto le resta credibilidad al perfil, así que el sistema detecta inactividad prolongada y sugiere al negocio ocultarlo.

---

## §16 — Compartir y QR

**Por qué existe.** El compartir es el motor de crecimiento del producto: cada perfil compartido por WhatsApp es distribución gratuita de Buscadis.

**Qué debe contener.** Botón en la barra fija que abre `navigator.share` con título, texto y URL; en desktop, hoja con copiar enlace, WhatsApp, Facebook y descargar QR. La opción "Guardar contacto" (vCard) aparece aquí y solo en arquetipos B2B.

**Sobre el QR.** No vive en el perfil público. Vive en el panel del negocio, como generador de piezas listas: sticker de mostrador, afiche A4, tarjeta física, adhesivo para vidrio, plantilla para historia de Instagram, arte para la mochila de un rider. El QR con logo integrado, corrección de error alta y un enlace corto con parámetro de origen, para que el negocio sepa cuántas visitas vinieron del sticker de la puerta.

**Cómo se hace excelente.** Con la imagen de vista previa. Cuando alguien comparte el perfil por WhatsApp, la tarjeta que aparece se genera dinámicamente con el logo, el nombre, la calificación y tres productos. Esa imagen es el anuncio de Buscadis más visto que vas a tener y hoy nadie la diseña.

---

## §17 — Medidor de completitud *(solo en el panel)*

**Por qué existe.** Porque la completitud del perfil correlaciona directamente con visitas y contactos, y porque el negocio necesita que le digan exactamente qué hacer después.

**Qué debe contener.** Barra de progreso, porcentaje y **una sola** tarea siguiente, formulada como beneficio y no como tarea: "Agrega 3 productos más → los perfiles con 10+ productos reciben el doble de consultas". Nunca una lista de doce pendientes: paraliza.

---

## §18–22 — Módulos de soporte

**Quiénes somos.** Colapsado por defecto, dos líneas visibles y "Leer más". Es el módulo que más espacio ocupa y menos se lee. Su lugar es el fondo de la página. Aquí vive el eslogan que sacamos del hero.

**Preguntas frecuentes.** Acordeón, todo cerrado al inicio, con el texto de las respuestas en el HTML (aunque esté colapsado) porque es de los contenidos que más se citan en respuestas generadas por IA y en resultados enriquecidos. Es el módulo con mejor relación esfuerzo/beneficio para SEO de todo el perfil.

**Equipo.** Solo en Servicios y Profesional, donde la persona es el producto. Cards de 112px con foto, nombre, rol y, en barberías y salones, disponibilidad y agenda directa.

**Certificaciones y garantías.** Grilla de íconos con etiqueta. Solo elementos verificables; una insignia inventada aquí es peor que ninguna. En arquetipos B2B, este módulo sube: "Distribuidor autorizado", "RUC activo", "Garantía de 30 días" son argumentos de compra reales.

**Documentos descargables.** Catálogo PDF, lista de precios, brochure, ficha técnica. Fundamental en distribuidoras y ferreterías, donde el comprador es otro negocio que necesita el archivo para cotizar. Debe mostrar peso y fecha de actualización — un PDF sin fecha no lo abre nadie.

---

## §23 — Pregúntale al negocio (ADIS AI)

**Por qué existe.** Porque el 70% de los mensajes de WhatsApp que recibe un negocio pequeño son las mismas cinco preguntas: precio, stock, horario, ubicación, delivery. Contestarlas automáticamente le devuelve horas al dueño y le da respuesta inmediata al cliente a las 11 de la noche.

**Dónde va.** Como botón discreto en la barra de secciones y como entrada al pie del catálogo, no como módulo grande. La IA es una utilidad, no una atracción.

**Qué debe contener.** Un campo con tres sugerencias contextuales generadas del catálogo real ("¿Tienen cemento Sol?", "¿Hacen delivery a San Sebastián?"). La respuesta se construye únicamente con datos del perfil: catálogo, horarios, políticas, publicaciones. Cuando no sabe, no inventa: ofrece pasar la pregunta al negocio por WhatsApp, con la pregunta ya escrita.

**Qué nunca debe hacer.** Nunca afirmar disponibilidad de stock que no está confirmada. Nunca negociar precios. Nunca hablar como si fuera el dueño: debe identificarse como asistente del negocio.

**Cómo se hace excelente.** Registrando las preguntas sin respuesta y mostrándoselas al negocio: "Te preguntaron 14 veces si haces delivery a Wanchaq y tu perfil no lo dice". Eso convierte a la IA en un instrumento de mejora del perfil, cierra el ciclo del producto, y genera exactamente el corpus de datos comerciales locales que necesitas para entrenar tu propio modelo.

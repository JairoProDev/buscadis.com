# 15 — Biblioteca de prompts para Claude Design

> Todos asumen que ya pegaste el **brief de sesión** de `14 §3` al inicio de la conversación. Los `[corchetes]` son lo que tú reemplazas.
>
> Regla: un prompt = una sesión = un entregable.

---

## A. Perfil público — exploración inicial

**A1 · Tres direcciones para el arquetipo Retail**
```
Diseña 3 direcciones visuales distintas de la pantalla de perfil de una ferretería
de Cusco (Corporación Quival, av. Ejército, distribuidora de cemento, fierro y
calaminas). Mismo contenido en las tres, distinta expresión visual.
Muéstralas lado a lado en 375x812, sin marco de teléfono.
Contenido visible: hero, métricas en una línea, estado vivo, acciones rápidas,
catálogo destacado con 5 productos, promoción, ubicación+horario, barra fija.
Prohibido: fondo crema con serif, negro con verde neón, degradados morados,
glassmorphism, tarjetas gigantes con mucho aire.
Para cada dirección dime en una línea qué apuesta estás haciendo.
```

**A2 · Convergencia**
```
Me quedo con la dirección [2]. Ahora hazme 3 variaciones solo del tratamiento
del hero y las métricas, manteniendo el resto idéntico. Quiero comparar
densidad: una más compacta, una igual, una con más aire.
```

**A3 a A7 · Los otros cinco arquetipos** (cambia el negocio y el orden de módulos según `04 §3`)
```
Diseña la pantalla de perfil para el arquetipo [SERVICIOS POR CITA], usando
[Majestic Barbershop, barbería en av. El Sol, Cusco].
Orden de módulos: hero, estado, acciones, servicios y precios, galería de trabajos,
reseñas, equipo, horario+ubicación, canales.
El card de servicio es de 168px con precio "Desde S/" y duración.
La galería debe incluir un par antes/después con deslizador comparativo.
Debe verse claramente DISTINTO al perfil de la ferretería que ya diseñamos,
no el mismo layout con otro color.
```
Repite con: **Comida** (Café Aurora, carta destacada + delivery activo) · **Profesional** (Alpha Legal, confianza antes que oferta) · **Alto ticket** (Urbania Inmobiliaria, cards de 248px con m²/dormitorios) · **Local** (bodega o farmacia, perfil corto de 6 módulos con ubicación en tercer lugar).

**A8 · Prueba de estrés del sistema**
```
Pon los 6 perfiles de arquetipo uno al lado del otro. Dime honestamente:
¿se ven como 6 negocios distintos o como la misma plantilla con otro color?
Señala qué elementos son demasiado iguales y propón cómo diferenciarlos
sin romper el sistema de diseño.
```

---

## B. Componentes individuales
*Adjunta la sección correspondiente de `06`.*

**B1 · Hero**
```
Diseña el módulo Hero en 5 versiones de contenido, en una fila:
1) negocio completo (logo bueno, portada profesional, verificado nivel 3)
2) sin portada (debe generarse un fondo con el color de marca y una textura)
3) logo horizontal y ancho (probar que el contenedor cuadrado no lo destruya)
4) nombre muy largo: "Distribuidora de Materiales de Construcción San Jerónimo E.I.R.L."
5) sin logo (iniciales sobre el color de marca)
Máximo 208px de alto en todos. Logo cuadrado radio 16.
```

**B2 · Estado vivo**
```
Diseña la franja de estado vivo en sus 6 variantes, apiladas y etiquetadas:
abierto normal · por cerrar en menos de 60 min · cerrado · cerrado por feriado ·
delivery activo · negocio nuevo sin datos de respuesta.
Una sola línea de 32px, punto de color de 8px, texto de 13px.
Es el único elemento animado del perfil: un pulso suave de 2s en el punto.
Diséñalo para que sea lo más creíble y honesto posible: nunca "3 personas viendo".
```

**B3 · Carrusel de catálogo — prueba de densidad**
```
Diseña el carrusel de productos a 156px de ancho y, debajo, el mismo carrusel
a 120px, en un viewport de 375px, con nombres largos reales:
"Cemento Sol Tipo I 42.5kg", "Fierro corrugado 1/2 x 9m", "Calamina galvanizada 3.05m".
Quiero ver el daño de la compresión lado a lado.
En ambos el siguiente card debe quedar cortado. Precio en Geist Mono 16px.
Después dime cuántos caracteres del nombre sobreviven en cada versión.
```

**B4 · Hoja de producto**
```
Diseña la hoja modal de producto (bottom sheet, 92vh) que sube al tocar un card:
galería con snap, nombre, precio grande en mono, disponibilidad, 4 atributos,
descripción, y CTA fijo abajo "Preguntar por este producto".
Muestra también el estado agotado con "Avísame cuando llegue".
```

**B5 · Reseñas**
```
Diseña el módulo de reseñas: cabecera con nota grande, total y distribución de
estrellas en barras; debajo carrusel de cards de 282px con iniciales sobre color
derivado del nombre (NUNCA fotos de banco de imágenes), estrellas, fecha relativa,
3 líneas de texto y respuesta del negocio destacada.
Incluye una reseña de 3 estrellas con respuesta del negocio: es la más importante.
```

**B6 · Ubicación + horario + pagos**
```
Rediseña el bloque de ubicación, horario y métodos de pago. Actualmente están
apretados en 3 columnas de 110px y es ilegible. Hazlos a ancho completo,
apilados: mapa estático de 160px, dirección en 2 líneas con referencia
("frente al Mall Aventura"), 2 botones, horario de hoy en lenguaje humano
("Abierto hasta las 8:00 p. m.") con acordeón para la semana, y logos de pago
de 56x36 en grilla sin texto.
```

**B7 · Highlights y visor**
```
Diseña la fila de highlights (círculos de 68px con anillo de color de marca) y
el visor a pantalla completa: barras de progreso arriba, toque para avanzar,
deslizar abajo para cerrar, y CTA contextual al pie ("Ver producto").
Muestra 3 tipos de diapositiva: foto, producto enlazado y promoción.
```

**B8 · Barra de acción y acciones rápidas**
```
Diseña la barra fija inferior (64px + safe area) con UNA acción primaria de color
de marca y dos íconos pequeños a la izquierda, más la fila de acciones rápidas.
Hazme 4 versiones según arquetipo: "Escribir por WhatsApp", "Reservar cita",
"Pedir por WhatsApp", "Cómo llegar". Y una versión fuera de horario:
"Escribir (responden mañana 9:00 a. m.)".
```

**B9 · Barra de secciones sticky**
```
Diseña la barra de secciones que aparece cuando el hero sale de pantalla:
44px, scroll horizontal, sección activa marcada, solo los módulos con contenido.
Muéstrala en 3 momentos del scroll.
```

**B10 · Pregúntale al negocio (ADIS AI)**
```
Diseña el módulo de IA: campo discreto con 3 preguntas sugeridas generadas del
catálogo real ("¿Tienen cemento Sol?", "¿Hacen delivery a San Sebastián?"),
la respuesta en burbuja, y el caso en que NO sabe y ofrece pasar la pregunta
al negocio por WhatsApp con el texto ya escrito.
Que se vea como una utilidad discreta, no como una atracción.
```

---

## C. Estados y casos borde *(sesión dedicada, no negociable)*

**C1 · El perfil del día 1**
```
Diseña el perfil de un negocio recién creado: sin reseñas, 3 productos con fotos
tomadas con celular, sin portada, logo pixelado, sin promociones, sin highlights.
Tiene que verse DIGNO e intencional, no incompleto ni vacío.
Este es el 80% de nuestros clientes reales. Si esto no funciona, nada funciona.
```

**C2 · Esqueletos de carga**
```
Diseña los estados de carga de cada módulo, con la forma real del contenido.
Nada de spinners. El hero y la barra de acción nunca tienen esqueleto porque
vienen en el HTML del servidor.
```

**C3 · Errores y desconexión**
```
Diseña: módulo de catálogo que falló (el resto de la página sigue bien),
perfil sin conexión mostrando la última versión guardada, y negocio pausado
por el dueño. En ningún caso se bloquea el contacto.
```

**C4 · Casos borde de contenido**
```
Diseña el perfil con contenido extremo: nombre de 60 caracteres, 47 productos
destacados, 3 promociones activas, 12 categorías, 9 redes sociales,
precios de 5 cifras (S/ 24,500.00) y un producto sin foto.
Quiero ver dónde se rompe el sistema.
```

**C5 · Modo oscuro**
```
Pasa los 6 perfiles de arquetipo a modo oscuro usando los tokens del sistema.
Fondo #0E0D12, nunca negro puro. Verifica que los colores de marca derivados
sigan cumpliendo contraste AA sobre el fondo oscuro.
```

---

## D. Creación del perfil — el flujo para el que no sabe de tecnología
*Adjunta `16-EXPERIENCIA-CREADOR.md`.*

**D1 · Prueba del tendero**
```
Diseña el flujo de creación de perfil para este usuario: dueño de ferretería,
52 años, usa WhatsApp y Facebook a nivel básico, escribe lento, tiene un
Android de gama media con la pantalla rajada y lo usa con sol directo.
Nunca llenó un formulario web. Nunca usó un panel de administración.
6 pantallas máximo, una pregunta por pantalla, texto de 17px mínimo,
botones de 56px, siempre con la opción "hacerlo después".
Debe sentirse como un chat de WhatsApp, no como un formulario.
```

**D2 · Importar desde lo que ya tiene**
```
Diseña la primera pantalla del onboarding: "¿Dónde está tu negocio ahora?"
con 4 opciones grandes: mi aviso de Buscadis · mi Instagram · mi Facebook ·
mi negocio en Google. Y debajo, "Empezar de cero".
Luego la pantalla de confirmación donde ve su perfil YA ARMADO con esos datos
y solo tiene que revisar. Objetivo: menos de 60 segundos.
```

**D3 · Modo conversación por voz**
```
Diseña el modo de creación por voz: el usuario mantiene presionado un botón
grande y habla ("tengo una ferretería en el Cusco, vendo cemento, fierro,
calaminas, abro de 8 a 6"), y la IA va llenando el perfil en vivo al lado.
Muestra 3 momentos: antes de hablar, mientras habla con el perfil llenándose,
y el resultado con los campos marcados como "revisa esto".
```

**D4 · Cargar productos con fotos**
```
Diseña el flujo de carga de catálogo por fotos: el usuario elige 10 fotos de su
galería, la IA las recorta, las mejora y propone nombre y categoría de cada una,
y él solo escribe el precio con un teclado numérico grande.
Muestra el antes/después del procesamiento de una foto mala real
(con flash, torcida, fondo desordenado).
```

**D5 · Momento wow**
```
Diseña la pantalla de "tu perfil está listo": vista previa de cómo lo verán sus
clientes, y un botón grande "Enviármelo por WhatsApp" para que lo vea en su
propio chat. Este es el momento emocional del producto: diséñalo para que dé
ganas de compartirlo inmediatamente.
```

**D6 · Ayuda y rescate**
```
Diseña el sistema de ayuda dentro del creador: botón flotante discreto con dos
opciones, "Preguntar" (chat con IA que responde con lenguaje simple) y
"Que lo hagan por mí" (agenda a alguien de ADIS).
Y el mensaje de guardado automático que aparece cuando el usuario abandona
a mitad: "Guardamos tu avance. Sigue cuando quieras."
```

**D7 · Sin jerga**
```
Revisa todos los textos del flujo de creación y reemplaza cualquier palabra
técnica. Prohibidas: módulo, CTA, SEO, banner, hero, layout, optimizar,
configurar, dashboard, template.
Dame una tabla de antes/después con las palabras que el dueño de una ferretería
sí entiende.
```

**D8 · El editor de todos los días**
```
Diseña el editor del perfil ya creado, para uso cotidiano desde el celular:
lista de bloques arrastrables con vista previa en vivo, cambiar precio en 2 toques,
subir una novedad en 20 segundos, marcar producto agotado desde la lista.
El caso de uso número uno es: "se acabó el cemento, quiero marcarlo agotado
mientras atiendo a un cliente". Diseña eso primero.
```

---

## E. Panel del negocio

**E1 · Panel semanal**
```
Diseña el panel del negocio con 4 bloques en este orden: lo que pasó esta semana
(3 números grandes con comparación), qué hacer ahora (UNA recomendación
formulada como beneficio con evidencia), de dónde vinieron (barras simples),
tus reseñas sin responder. El usuario no es analista: nada de gráficos complejos.
```

**E2 · Informe mensual por WhatsApp**
```
Diseña la imagen que el negocio recibe por WhatsApp el día 1 de cada mes:
formato 1080x1350, sus 3 números del mes, su producto estrella y una
recomendación. Debe verse tan bien que le den ganas de reenviarla.
```

**E3 · Medidor de completitud**
```
Diseña el medidor de completitud con UNA sola tarea siguiente, no una lista.
Formato: barra, porcentaje, y la tarea escrita como beneficio con evidencia
("Los perfiles con 10+ productos reciben el doble de consultas. Te faltan 4").
Diseña 5 versiones con distintas tareas y distintos porcentajes.
```

**E4 · Preguntas sin responder**
```
Diseña la pantalla donde el negocio ve las preguntas que le hicieron a la IA y
que no se pudieron responder, con la acción de un toque para agregar el dato
al perfil. Ejemplo: "Te preguntaron 14 veces si haces delivery a Wanchaq".
```

---

## F. Piezas físicas y de marketing

**F1 · Kit de QR**
```
Diseña el kit de piezas físicas de un negocio: sticker de mostrador de 10x10cm,
afiche A4 para la puerta, adhesivo para vidrio, tarjeta de bolsillo y plantilla
para historia de Instagram. Todas con el QR, el color del negocio y el sello
de Buscadis. Deben imprimirse bien en una impresora barata de Cusco:
sin degradados finos, sin texto menor a 8pt, alto contraste.
```

**F2 · Imagen de vista previa al compartir**
```
Diseña la imagen OG que aparece cuando alguien comparte un perfil por WhatsApp:
1200x630, logo, nombre, categoría, calificación y 3 productos con precio.
Es el anuncio de Buscadis más visto que vamos a tener. Hazme 3 versiones.
```

**F3 · Comparativa para vender**
```
Diseña una pieza de una sola pantalla que compare el perfil de Buscadis contra
Instagram, Google Business, Linktree y una web de agencia de S/3,000.
Honesta: reconoce en qué gana cada uno. Para mostrar en el celular durante
una visita comercial.
```

**F4 · Antes y después**
```
Diseña la plantilla de contenido "antes y después": a la izquierda, cómo se ve
hoy el negocio en internet (nada, o información equivocada en Google);
a la derecha, su perfil de Buscadis. Formato vertical 1080x1920 para TikTok
e Instagram, con espacio para grabar encima.
```

**F5 · Página de precios**
```
Diseña la página de planes (Free S/0, Pro S/30/mes, Max S/300/mes) para
alguien que no compra software. Sin tabla de checkmarks técnica:
en lenguaje de resultados. Ancla el precio contra los S/3,000 de una web.
```

**F6 · Deck de venta**
```
Diseña un deck de 10 láminas para presentar el Perfil Vivo a un negocio mediano
(distribuidora ferretera con 15 empleados). Problema, solución, demo,
resultados de otros negocios, precio, siguiente paso. Exportable a PPTX.
```

---

## G. Handoff a código

**G1**
```
Empaqueta el diseño de [pantalla] para handoff a Claude Code. Incluye:
tokens usados, medidas exactas, estados, comportamiento de scroll y snap,
eventos de interacción y los textos finales en español.
```

**G2 · Verificación final antes del handoff**
```
Revisa este diseño contra las reglas del sistema y dime punto por punto qué
incumple: 1) valores fuera de los tokens, 2) los 4 estados, 3) contraste AA,
4) objetivos táctiles de 44px, 5) peek en los carruseles a 360/375/390/430px,
6) texto menor a 13px, 7) más de una acción con color de marca,
8) copy con jerga o exclamaciones. Corrige solo lo que falle.
```

---

## H. Prompts de rescate (cuando algo sale mal)

**Cuando sale una landing page:**
```
Esto se ve como una página web, no como una app. Recomprímelo: menos aire,
más densidad de información, secciones más cortas, cards más juntos,
la primera acción visible sin scroll. Piensa en la ficha de un restaurante
en Google Maps, no en una landing de startup.
```

**Cuando sale genérico:**
```
Esto podría ser de cualquier producto. Dime qué 3 decisiones tomaste que son
específicas de Buscadis y de un negocio de Cusco, y si no hay ninguna,
rehazlo tomándolas.
```

**Cuando el contenido es de mentira:**
```
El contenido de ejemplo no es creíble para Cusco. Reemplázalo con datos reales:
precios en soles de verdad, nombres de productos que existen, direcciones
del Cusco, calificaciones de 4.3 a 4.8 con entre 12 y 200 reseñas.
Nada de "+18K clientes felices".
```

**Cuando todo se ve igual entre arquetipos:**
```
Estos dos perfiles se ven casi idénticos y son negocios distintos.
Cambia la ESTRUCTURA, no el color: distinto orden de módulos, distinto tipo
de card principal, distinta acción primaria. Justifica cada cambio con la
intención de visita de cada tipo de negocio.
```

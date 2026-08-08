# 14 — Manual de trabajo con Claude Design

> Cómo montar el entorno, qué pasarle, cómo estructurar decenas de sesiones y cómo evitar los errores que producen resultados genéricos.

---

## 1. Qué es y qué no es (para calibrar expectativas)

Claude Design vive en `claude.ai/design`: chat a la izquierda, lienzo a la derecha. Describes, revisa, refinas, repites. No hay panel de capas ni inspector de objetos — todo es marcado renderizado, no un documento vectorial. Acepta imágenes, DOCX, PPTX, XLSX y enlace a un repositorio de código; tiene captura web para tomar elementos de un sitio real; exporta a PDF, PPTX, HTML, Canva editable y URL compartible; y empaqueta un **handoff bundle** que se pasa a Claude Code con una sola instrucción. Está en research preview: espera errores de guardado y comentarios perdidos, así que **exporta al terminar cada sesión importante**.

Consecuencias prácticas para ti:

- **No es Figma.** No pidas "un componente reutilizable con variantes". Pide pantallas y estados concretos.
- **El handoff a Claude Code es el objetivo real**, no el PNG bonito. Diseña pensando en que el bundle salga limpio.
- **El sistema de diseño publicado es el factor número uno de calidad.** Anthropic lo dice explícitamente: sin él, la salida es "funcional pero genérica". Por eso el archivo `13` existe.
- **Un editor a la vez.** Coordínate con Shantall por turnos, no simultáneo.

---

## 2. Montaje inicial (hazlo una sola vez, en este orden)

**Paso 1 — Publica el sistema de diseño.** Sube `13-CLAUDE-DESIGN-SISTEMA.md` como sistema de diseño de la organización. Si te pide colores y tipografías por separado, dáselos con los valores exactos del archivo. Verifica después con un prompt de prueba: *"Muéstrame un botón primario, un card de producto y un badge de estado usando el sistema"*. Si el botón no sale con el color de marca derivado y el precio no sale en monoespaciada, el sistema no se cargó bien: corrígelo antes de seguir.

**Paso 2 — Conecta el repositorio** cuando exista código real (después del Sprint 0 de `11`). A partir de ahí lee tus componentes y tokens reales y deja de aproximar. Este paso duplica la calidad de todo lo posterior; adelántalo si puedes.

**Paso 3 — Sube el material de referencia como assets del proyecto**, no como texto: los 8 mockups de ChatGPT marcados como "referencia de lo que NO queremos" y 4–6 capturas de lo que sí (ficha de Google Maps, ficha de Airbnb, ficha de producto de Mercado Libre, WhatsApp Business). Claude Design usa imágenes como referencia de estilo con mucha eficacia, más que cualquier descripción escrita.

**Paso 4 — Usa la captura web** sobre buscadis.com para que los prototipos partan del producto real y no de una simulación.

**Paso 5 — Crea la estructura de proyectos.** Un proyecto por área, nunca todo en uno:

```
BUSCADIS / Perfil Vivo — Retail
BUSCADIS / Perfil Vivo — Servicios
BUSCADIS / Perfil Vivo — Comida
BUSCADIS / Perfil Vivo — Profesional
BUSCADIS / Perfil Vivo — Alto ticket
BUSCADIS / Perfil Vivo — Local
BUSCADIS / Creador — Onboarding
BUSCADIS / Creador — Editor
BUSCADIS / Panel del negocio
BUSCADIS / Estados y casos borde
BUSCADIS / Piezas físicas y QR
BUSCADIS / Marketing y ventas
```

---

## 3. Qué documentos pasarle (respuesta directa)

**No le pases los 13 archivos.** Diluye el contexto y hace que promedie. La regla de tres capas:

| Capa | Qué | Cuándo |
|---|---|---|
| **Permanente** | `13-CLAUDE-DESIGN-SISTEMA.md` | Una vez, como sistema de diseño |
| **Por sesión** | El brief de sesión (abajo, ~40 líneas) | Pegado al inicio de cada conversación |
| **Por entregable** | La sección específica de `06` + lo que aplique de `04`/`05` | Adjunto solo en esa sesión |

El brief de sesión reemplaza a los documentos largos. Los archivos `02`, `03`, `09`, `10` y `11` **no van nunca a Claude Design**: son para ti, para producto y para Claude Code.

### Brief de sesión (cópialo tal cual al inicio de cada conversación)

```
CONTEXTO DEL PRODUCTO
Buscadis es un marketplace peruano. Estoy diseñando el "Perfil Vivo": el perfil
público de un negocio. Usuario final: alguien buscando un negocio local en Cusco
desde su celular, con 4G, apurado, con intención de comprar hoy.

REGLAS QUE NO SE ROMPEN
- Móvil primero: 375x812. Contenedor máx 640px. Un solo scroll vertical, sin pestañas.
- Se siente app nativa, no landing page. Referencias: Google Maps, Airbnb,
  Mercado Libre, WhatsApp Business. NO Linktree ni plantillas de constructor web.
- Una sola acción primaria con el color de marca. Barra fija abajo de 64px.
- Card de producto: 156px de ancho, imagen 1:1, nombre 14px en 2 líneas,
  precio en Geist Mono 16px. En los carruseles el siguiente card SIEMPRE queda
  cortado entre 20% y 40%.
- Logo cuadrado con radio 16, nunca circular. Hero completo en máx 208px.
- Métricas en UNA línea con separadores "·", nunca en tabla de 4 columnas.
- Texto mínimo 13px. Objetivo táctil mínimo 44px. Contraste AA siempre.
- Copy en español peruano, sentence case, verbos concretos, sin exclamaciones.
  "Escribir por WhatsApp", no "Contáctanos". "Ver los 358 productos", no "Ver más".
- Contenido REALISTA de un negocio de Cusco: nada de "+18K clientes felices"
  ni fotos de estudio. Precios en soles. Nombres y direcciones creíbles.

CÓMO QUIERO QUE TRABAJES
Antes de diseñar, dime en 4 líneas tu plan y qué decisión estás tomando que yo
no te di. Luego diseña. Al final, critica tu propio trabajo contra estas reglas
y dime qué incumpliste.
```

---

## 4. Cómo estructurar decenas de sesiones

**Una sesión = un entregable = una pantalla o un flujo.** Nunca "diseña el perfil completo": el resultado será una landing genérica. La secuencia que funciona:

1. **Exploración divergente** (1 sesión por área). Pide 3 direcciones distintas, no una. Claude Design está optimizado para explorar barato.
2. **Convergencia.** Eliges una y pides variaciones de detalle sobre ella.
3. **Estados.** Sesión aparte, siempre. Los estados vacío/cargando/error son el 40% del trabajo real y nunca salen si los pides junto con el diseño principal.
4. **Contenido real.** Sesión de reemplazo de contenido de ejemplo por datos de un negocio real tuyo.
5. **Handoff.** Empaquetas y pasas a Claude Code con `12`.

**Regla del lote:** cuando pidas variaciones, pide 3. Con 2 comparas, con 5 pierdes el hilo.

---

## 5. Tips y hacks que suben la calidad de forma medible

**Muestra, no describas.** Una captura de la ficha de Airbnb con la instrucción "esta densidad de información, este ritmo vertical" produce mejor resultado que tres párrafos describiéndola.

**Prohíbe explícitamente lo que no quieres.** Los modelos de diseño gravitan hacia tres estéticas por defecto: crema con serif y acento terracota; negro casi puro con un acento verde ácido; y columnas tipo periódico con reglas finas. Escribe la prohibición: *"nada de fondo crema con serif, nada de negro con verde neón, nada de degradados morados"*.

**Ancla los números.** "Card de 156px" produce resultados; "cards no muy chicos" no. Cada vez que veas un error recurrente, conviértelo en un número y mételo al brief.

**Pide el estado vacío primero.** Invierte el orden: *"Diseña la pantalla de un negocio nuevo: sin reseñas, 3 productos, sin portada, logo malo. Que se vea digno."* Si eso funciona, lo lleno funciona solo.

**Exige contenido realista con nombres reales.** *"Usa una ferretería de Cusco: Corporación Quival, av. Ejército, cemento Sol 42.5kg S/32.50, fierro de construcción, calaminas."* El contenido falso genérico produce diseños genéricos; el contenido específico obliga a resolver problemas reales (nombres largos, precios de 5 cifras, categorías raras).

**Usa el móvil como marco de verdad, no como maqueta.** Pide 375×812 sin el marco del iPhone. El marco esconde problemas de densidad y hace que todo se vea mejor de lo que es.

**Diseña dos anchos críticos: 360px y 430px.** El 360 es donde se rompe todo (Android de gama media, el teléfono real de tu cliente).

**Pide autocrítica.** *"Revisa lo que hiciste contra las reglas y dime tres cosas que incumpliste"* es el prompt individual con mejor retorno de todos. Casi siempre encuentra algo.

**Termina cada sesión exportando.** HTML para revisar en tu teléfono real, y el bundle de handoff si va a código. Es research preview: no acumules trabajo sin exportar.

**Revisa en el teléfono, no en el monitor.** Exporta el HTML, ábrelo en tu celular con sol afuera. La mitad de los problemas de contraste y tamaño solo se ven ahí.

**Nombra las cosas como el sistema.** Si dices "el hero", "la barra de acción", "el peek", el modelo se mantiene dentro del vocabulario del sistema y no reinventa componentes. Mantener el léxico es una técnica de consistencia barata.

---

## 6. Errores que vas a cometer (y cómo evitarlos)

| Error | Síntoma | Antídoto |
|---|---|---|
| Pedir "el perfil completo" | Sale una landing con secciones y mucho aire | Una pantalla o un flujo por sesión |
| No prohibir estéticas por defecto | Crema + serif, o negro + verde neón | Prohibición explícita en el brief |
| Contenido de ejemplo genérico | Diseño que no resiste datos reales | Datos de un negocio tuyo, siempre |
| Saltarse los estados | Se descubre en código que falta todo | Sesión dedicada a estados |
| Aceptar la primera versión | Convergencia prematura | Siempre 3 direcciones |
| No exportar | Se pierde trabajo | Exportar al cerrar |
| Mezclar diseño y estrategia en el chat | Respuestas largas, poco lienzo | La estrategia se decide aquí, en el chat normal; allá solo se diseña |

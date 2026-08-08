# 01 — Veredicto y las 24 decisiones fundacionales

## Parte A — Diagnóstico

### El veredicto en tres líneas

No tienes un sistema de diseño: tienes **tres sistemas que compiten** (CSS vars de marca, Tailwind "Luminous Void", tokens de tenant) y 265 componentes que resuelven cada uno su propio problema. La identidad de marca es buena y salvable. Lo que falta no es gusto — es **una fuente de verdad y mecanismos que impidan divergir**.

Tu problema no es estético. Es de **entropía**: cada pantalla nueva cuesta más que la anterior porque nada se reutiliza, y cada decisión se vuelve a tomar desde cero.

### Los cinco problemas de raíz

**1. No hay capa semántica.** Tienes valores (`#53acc5`) y tienes usos (`--brand-blue`), pero no tienes el eslabón intermedio: `--bs-fg-on-accent`, `--bs-bg-surface-2`, `--bs-border-focus`. Sin capa semántica, el modo oscuro se escribe a mano, el tema de negocio pisa variables del shell, y ningún componente es tematizable. Es la causa técnica de casi todo lo que aparece en tu archivo 09.

**2. La marca se usa como color de acción y no puede serlo.** `#53acc5` tiene demasiada luminosidad para llevar texto blanco. Contraste estimado de blanco sobre `#53acc5`: **~2.3:1**. Contraste del CTA Publicar (`#53acc5` sobre `#ffc24a`): **~1.5:1**. El mínimo AA para texto es 4.5:1 y para componentes de UI 3:1. Tu botón más importante es ilegible para una parte de tus usuarios y para cualquiera bajo el sol de Cusco. Esto no se arregla cambiando la marca: se arregla separando identidad de acción.

**3. Tres modos claros.** `:root`, `.light-mode` (paleta tipo Facebook residual) y el light de negocio tienen valores distintos para los mismos tokens. Cualquier componente se ve diferente según dónde viva. Es el tipo de bug que nadie reporta y todos sienten.

**4. La accesibilidad y el rendimiento no están instrumentados.** Objetivos táctiles de 40px donde el estándar es 44, glass con `backdrop-filter: blur(40px)` (uno de los efectos más caros en Android de gama media, justo tu dispositivo objetivo), un `logo.svg` de 3 MB. Nada de esto falla en CI porque no hay CI de diseño.

**5. El shell no se renderiza en el servidor.** Verificado hoy: buscadis.com entrega `Cargando…` a un cliente sin JavaScript. Es un problema de negocio de primer orden (SEO y AEO nulos) y una restricción de diseño: los componentes del sistema deben poder renderizarse sin JS y mejorar progresivamente.

### Lo que hay que conservar

La identidad celeste + amarillo es distintiva en un mercado donde todo el mundo usa azul corporativo o verde WhatsApp. La escala de 4px es correcta. La lógica de elevación en oscuro (canvas < superficie < elevado) es la correcta y coincide con Material. Las 8 categorías como semántica de producto son un activo: son tu modelo de negocio hecho interfaz. El composer dual buscar/publicar es una idea de producto genuinamente buena y poco común. Los presets de storefront anticipan bien el multi-tenant.

**Conclusión: no se rehace la marca. Se rehace la infraestructura debajo de la marca.**

---

## Parte B — Las 24 decisiones

Cada una lleva su razón. Ninguna es de gusto.

### Fundamentos

**D1 · La fuente de verdad es un paquete de tokens, no el CSS.**
`@buscadis/tokens` en JSON, compilado con Style Dictionary a CSS vars, TS y JSON para Figma. *Por qué:* mientras la verdad viva en `globals.css`, Figma, Tailwind y el código siempre van a divergir — es exactamente lo que documenta tu auditoría. Un paquete versionado convierte un cambio de color en un PR revisable con changelog, no en un hallazgo arqueológico.

**D2 · Tokens en tres capas: primitivo → semántico → componente.**
`adis-600` (primitivo) → `--bs-action` (semántico) → `--bs-button-primary-bg` (componente). *Por qué:* es el modelo que usan Adobe Spectrum, Atlassian, Shopify Polaris y Material 3, y resuelve el problema de raíz #1. El modo oscuro y el tema de negocio pasan a ser un remapeo de la capa semántica, no un rediseño.

**D3 · Prefijo `--bs-` en todos los tokens.**
*Por qué:* elimina el choque conceptual entre `--brand-blue` (shell) y `--brand-color` (negocio) que registra tu B7, y permite detectar con lint cualquier variable fuera del sistema.

**D4 · Se elimina la paleta Tailwind "Luminous Void".**
Obsidian, graphite, platinum, electric, amber y los `glow-*` se borran. *Por qué:* baja adopción, contradice la regla anti-morado, y su existencia hace que cualquier persona nueva (o cualquier IA de código) elija mal. Un sistema muerto en el repo es peor que ningún sistema: es una trampa. `BentoCard` se migra.

**D5 · Tailwind se configura desde los tokens, no en paralelo.**
El `theme` de Tailwind se genera desde `@buscadis/tokens`. Las clases utilitarias quedan como azúcar sintáctica, no como segunda fuente de verdad.

### Marca y color

**D6 · Se congela la marca en `#53acc5` (celeste) y `#ffc24a` (amarillo).**
Se actualizan spec, PWA `theme_color`, OG y skip-link a estos valores. `#38bdf8` y `#fbbf24` quedan derogados. *Por qué:* el logo es el activo más caro de cambiar y ya está en la calle. La coherencia vale más que el matiz.

**D7 · El color de identidad no es el color de acción.**
`#53acc5` es `adis-400`, el tono de identidad. El color de acción es `adis-600` (~`#2A7C94`), que sí pasa AA con texto blanco. *Por qué:* con 2.3:1 el botón es inaccesible. Separar los dos roles es práctica estándar (el verde de Spotify o el índigo de Stripe tampoco son el mismo tono en el logo y en el botón). El usuario percibe la misma marca; la interfaz se vuelve legible.

**D8 · El CTA Publicar conserva el amarillo y cambia el texto a tinta.**
Fondo: el gradiente amarillo actual. Texto e ícono: `--bs-fg-on-warm` (~`#10242B`), no celeste. *Por qué:* celeste sobre amarillo da ~1.5:1. Con tinta sube a ~11:1 y la firma visual del producto se conserva intacta.

**D9 · Rampas completas de 11 pasos generadas en OKLCH.**
*Por qué:* HSL miente sobre el brillo percibido, así que las rampas hechas variando L en HSL salen sucias e inconsistentes. OKLCH es perceptualmente uniforme y hace que el contraste sea predecible, lo que permite verificarlo en CI.

**D10 · Se unifica `.light-mode` con `:root`.**
La paleta residual tipo Facebook desaparece. *Por qué:* dos claros distintos es un bug estructural.

**D11 · Una sola fuente de categorías, en TypeScript, que genera las CSS vars.**
Se resuelven los conflictos de `empleos` y `negocios`. *Por qué:* dos fuentes garantizan divergencia; el generador la hace imposible.

**D12 · Los colores de categoría se re-afinan por separación de matiz y contraste.**
Ningún color de categoría puede caer a menos de 25° del matiz de marca, y todos deben pasar 3:1 sobre ambos fondos. *Por qué:* hoy `vehiculos` (`#0284c7`) y `comunidad` (`#0891b2`) están tan cerca del celeste de marca que un chip de categoría se confunde con un elemento del sistema, y `empleos` en gris no comunica nada porque el gris es ausencia de señal.

**D13 · El color nunca es la única señal.**
Toda categoría se acompaña de ícono y etiqueta. Todo estado (agotado, error, verificado) lleva forma o texto además de color. *Por qué:* requisito WCAG 1.4.1 y realidad de mercado — alrededor del 8% de los hombres tiene alguna deficiencia de visión cromática, y tus categorías más rentables (vehículos, inmuebles) tienen público mayoritariamente masculino.

### Tipografía

**D14 · System-first para la interfaz, una sola fuente de marca para display.**
UI en el stack del sistema (0 bytes, render inmediato, familiar por defecto). Display en **Archivo Variable**, self-hosted y subconjuntada (~28 KB), solo para el nombre del producto, títulos de sección y precios grandes. *Por qué:* tu usuario está en 4G con un Android de gama media; cada fuente cargada retrasa el primer render. Archivo es una grotesca de origen editorial diseñada para titulares y texto pequeño en prensa — exactamente el linaje de los clasificados que Buscadis digitaliza. Es una elección con historia, no un default.

**D15 · Se elimina el `!important` del stack tipográfico y las fuentes fantasma.**
`--font-geist-sans` y `--font-outfit` se borran de Tailwind. *Por qué:* declarar lo que no existe hace que cada desarrollador (y cada IA) crea que hay un sistema tipográfico donde no lo hay.

**D16 · Los precios usan cifras tabulares y una sola forma de escribirse.**
`font-variant-numeric: tabular-nums`, formato `S/ 1,250` sin decimales cuando son cero. *Por qué:* alinea columnas en las rejillas y evita el salto visual al comparar precios, que es la acción central de un marketplace.

### Componentes

**D17 · Se adoptan Radix UI + CVA para las primitivas.**
No shadcn completo: se copian solo las piezas necesarias. *Por qué:* el 80% del trabajo de una primitiva accesible (trampa de foco, roles ARIA, navegación por teclado, cierre con Esc) ya está resuelto y probado en Radix. Reescribirlo es regalar semanas y garantizar bugs de accesibilidad. CVA da variantes tipadas, que es lo que convierte 265 componentes ad-hoc en un sistema.

**D18 · 18 primitivas antes que cualquier componente nuevo.**
Ver `07`. Ningún feature nuevo puede introducir su propio botón o su propio modal.

**D19 · Dos kits sobre un mismo núcleo: Marketplace y Storefront.**
Comparten primitivos y primitivas; difieren en la capa semántica. *Por qué:* el storefront es multi-tenant y su color lo define el cliente; el marketplace es marca fija. Mezclarlos es lo que produce hoy que un tema de negocio pise las variables del shell.

**D20 · El tema de negocio es un contrato explícito y acotado.**
El tenant solo puede modificar un conjunto cerrado de tokens (`--bs-tenant-*`) dentro de un scope. Nunca toca `--bs-bg-*` ni `--bs-fg-*` globales. *Por qué:* hoy `buildBusinessThemeVars()` sobrescribe variables del shell, lo que hace impredecible cualquier componente compartido.

### Iconografía y assets

**D21 · Una sola familia de íconos: Lucide.**
Se migra desde `react-icons` (FA + MD + FC hoy conviven). Tamaños tipados 16/20/24/32, grosor 2 para 16-20 y 1.5 para 24+. Las 8 categorías conservan íconos custom de marca. *Por qué:* tres familias son tres lenguajes visuales distintos en la misma pantalla; además `react-icons` importado directamente en 25 archivos infla el bundle. Lucide es tree-shakeable, coherente y tiene cobertura completa.

**D22 · Política de assets: presupuesto por archivo y verificación en CI.**
`logo.svg` de 3 MB se optimiza a menos de 15 KB. Toda imagen sube por un pipeline que genera AVIF/WebP y variantes. *Por qué:* es la vía más barata que tienes para mejorar Core Web Vitals.

### Movimiento y calidad

**D23 · El glass se restringe y se degrada.**
`backdrop-filter` como máximo en dos superficies simultáneas, desactivado bajo `prefers-reduced-transparency` y en dispositivos de baja capacidad, con sustituto sólido tintado. *Por qué:* el desenfoque de fondo es de los efectos más caros de componer en GPU móvil y provoca caídas de fotogramas al hacer scroll justo en la gama de teléfonos de tus usuarios.

**D24 · Puertas de calidad automáticas en CI.**
Contraste de todos los pares semánticos, presupuestos de peso, objetivos táctiles, ausencia de hex sueltos, ausencia de imports directos de íconos. *Por qué:* la disciplina que depende de la memoria del equipo se pierde en tres semanas; la que está en CI dura para siempre.

---

## Parte C — Lo que decido no hacer (y por qué)

**No migramos a un framework de componentes completo (MUI, Chakra).** Impondría una estética ajena y multiplicaría el bundle. Radix es headless: da comportamiento, no apariencia.

**No adoptamos CSS-in-JS.** El `styled-jsx` aislado que existe se elimina. Tailwind + tokens cubre el caso y no tiene costo en runtime.

**No hacemos rediseño visual grande ahora.** Primero infraestructura, después estética. Un rediseño sobre cimientos rotos se vuelve deuda en seis meses. La única excepción son las correcciones de contraste, que son de accesibilidad y no de gusto.

**No unificamos marketplace y storefront en un solo kit.** Sus restricciones son opuestas.

**No congelamos las 8 categorías como definitivas.** Son un activo, pero su color se debe validar con usuarios reales antes de imprimirlas en material físico. Ver el experimento E3 en `13`.

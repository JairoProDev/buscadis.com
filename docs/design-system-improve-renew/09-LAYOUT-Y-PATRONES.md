# 09 — Layout y patrones

---

## 1. Chrome

| Elemento | Móvil | Escritorio | Cambio vs. hoy |
|---|---|---|---|
| Header | 56px | 64px | −16px móvil |
| Logo | 32px | 40px | −16px |
| Botón de ícono | 44px | 44px | +4px (corrige a11y) |
| Barra de categorías | 72px | 88px | sin cambio |
| Composer | 52px | 56px | sin cambio |
| Barra de herramientas | 44px | 48px | sin cambio |
| Navegación inferior | 56px + safe-area | — | −8px |
| Panel de detalle | — | 420px | sin cambio |

**Suma de chrome permanente en móvil:** 56 (header) + 56 (nav) = 112px de 640 útiles ≈ 17.5%. Hoy es 136px ≈ 21%. Recuperar cuatro puntos porcentuales de pantalla en todas las sesiones es una de las mejoras de mayor impacto agregado del sistema.

**Sticky:** el buscador se adhiere bajo el header con `top: var(--bs-header-height)`. Con la escala de z-index de `03 §7`, desaparece el parche actual de forzar header y sticky a `z-index: 1` cuando hay un modal abierto.

---

## 2. Rejillas

### Listado de avisos

| Viewport | Columnas | Gap | Justificación |
|---|---|---|---|
| 360–479 | 2 | 12 | tarjeta ~162px — el mínimo legible |
| 480–767 | 2 | 16 | tarjeta ~220px |
| 768–1023 | 3 | 16 | |
| 1024–1279 | 4 | 16 | |
| ≥1280 con panel | 4 | 20 | el panel de 420px consume una columna |
| ≥1280 sin panel | 5 | 20 | |
| Modo feed | 1 | 24 | máx 480px |

**Por qué dos columnas en móvil y no una.** En un marketplace, comparar es la tarea. Dos columnas duplican los elementos comparables por pantalla y reducen el scroll a la mitad. El costo es una tarjeta más pequeña, y por eso el ancho mínimo de 156px es una restricción dura: por debajo, se pierde más en legibilidad de lo que se gana en densidad.

**Por qué no tres columnas en móvil.** A 360px, tres columnas dan tarjetas de ~106px: el título se trunca a una línea inútil y el precio baja a 12px. Es el error que hay que evitar y el mismo que detectaste en los mockups del perfil.

### Contenedores

Definidos en `03 §9`. Regla adicional: **el perfil de negocio no se estira en escritorio.** Se centra en 640px sobre un fondo con la portada difuminada. Estirarlo a 1200px lo convierte en la landing corporativa que estamos evitando.

---

## 3. Patrones de navegación

**Scroll vertical único con anclas, no pestañas**, para contenido de una misma entidad (perfil de negocio, detalle de aviso). *Por qué:* los usuarios rara vez exploran pestañas —se quedan en la primera—, y el contenido de pestañas ocultas queda fuera del alcance de los crawlers y de los modelos que responden preguntas.

**Pestañas solo para contenido paralelo y comparable** (Mis avisos / Guardados / Mensajes).

**Hojas modales para detalle rápido, rutas reales para detalle profundo.** Un aviso abierto desde la rejilla se ve en hoja (el usuario mantiene su posición y puede ver cinco seguidos); la URL directa del aviso es una ruta real indexable. Ambas comparten el mismo componente.

**Botón atrás siempre funciona.** Toda hoja y todo modal empujan estado al historial.

**Volver conserva la posición del scroll y el estado de los filtros.** Es el error más caro y más común en marketplaces: el usuario abre un aviso, vuelve, y aterriza arriba de todo con los filtros perdidos. Se abandona ahí.

---

## 4. Densidad y jerarquía visual

Tres niveles de énfasis, y solo tres. Cada pantalla tiene exactamente un elemento de nivel 1.

| Nivel | Recurso | Ejemplo |
|---|---|---|
| 1 · Acción | Color de acción, peso 600 | botón primario, precio |
| 2 · Estructura | Peso 600, `fg-default` | títulos de sección, títulos de tarjeta |
| 3 · Soporte | `fg-muted`, 12–13px | metadatos, ayudas, fechas |

**Prohibido:** dos elementos de nivel 1 en la misma pantalla; usar color de acción para algo que no es accionable; usar negrita para "dar importancia" a texto de soporte.

---

## 5. Formularios

**Una columna siempre**, incluso en escritorio. Los formularios de dos columnas aumentan errores y tiempo de completado de forma consistente en la investigación de usabilidad.

**Etiqueta arriba del campo**, nunca dentro ni al lado. Nunca solo placeholder.

**Errores en línea, después de que el usuario sale del campo**, nunca mientras escribe. El mensaje dice qué pasó y cómo arreglarlo: "Falta el código de país. Ejemplo: +51 984 123 456".

**Progresivo.** El composer de publicación acepta primero texto libre y la IA propone categoría, título y precio; la estructura se confirma después. La fricción se paga al final. *Por qué:* el vendedor ocasional compara con publicar en un grupo de Facebook, que le toma 40 segundos.

**Guardado automático de borradores** en todo formulario de más de tres campos, con mensaje que no culpa: "Guardamos tu avance".

---

## 6. Estados de página

| Estado | Tratamiento |
|---|---|
| Cargando | Esqueletos con forma real; el chrome y la primera fila vienen del servidor |
| Sin resultados | Explicar por qué y ofrecer la salida: quitar un filtro, ampliar el radio, avisarme si aparece |
| Error | El módulo falla solo; el resto de la página se renderiza |
| Sin conexión | Última versión en caché con franja informativa; las acciones de teléfono siguen funcionando |
| Sin permisos de ubicación | Nunca bloquear: pedir distrito manualmente |

---

## 7. Responsive: reglas, no excepciones

**Móvil primero de verdad:** se escribe el CSS para 360px y se añade con `min-width`. El patrón inverso produce el código que hoy tienes, lleno de `isDesktop` en JavaScript.

**`useMediaQuery` en JS solo cuando cambia la estructura del DOM**, no para estilos. Cada branch por JS es un salto de layout potencial y un fallo de hidratación.

**Táctil primero:** hover es una mejora, nunca un requisito. Toda información disponible solo en hover debe estar disponible de otra forma en táctil.

---

## 8. Requisitos de layout para SEO y AEO

Consecuencia directa del hallazgo de que hoy el HTML no contiene contenido.

El contenido crítico va en el HTML del servidor: título, precio, ubicación, descripción, imagen principal. La rejilla de avisos se sirve renderizada, no montada en cliente. Un `<h1>` por página. Los datos comparables (precio, atributos, horarios) en tablas o listas de definición semánticas, no en divs con estilo, porque los modelos de lenguaje extraen estructura. El contenido de los acordeones va en el HTML aunque esté colapsado. La paginación usa enlaces reales, no solo scroll infinito: el scroll infinito sin enlaces deja páginas 2 en adelante inalcanzables para cualquier crawler.

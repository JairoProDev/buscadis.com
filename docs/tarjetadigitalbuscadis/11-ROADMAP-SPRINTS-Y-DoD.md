# 11 — Roadmap, sprints y definición de terminado

> **CONTEXTO PARA LA IA:** cada sprint es una unidad entregable y demostrable. No empieces el siguiente sin cumplir la DoD del anterior. Duración asumida: 1 semana por sprint trabajando con asistentes de código.

---

## Principio de secuencia

El orden no es por dificultad, es por **riesgo de invalidación**. Primero lo que, si está mal, obliga a rehacer todo: el motor de módulos, los tokens y el rendimiento. Al final lo vistoso.

---

## Sprint 0 — Fundación (bloqueante)

**Entrega:** repositorio con tokens, tipos, motor de temas y renderizador de módulos vacío que ya pinta un perfil con datos falsos.

- Next.js App Router + TypeScript estricto + Tailwind configurado **solo con los tokens de `05`** (nada de la paleta por defecto)
- Fuentes self-hosted y subconjuntadas, con precarga
- `derivarTema()` implementado y probado con 20 colores semilla, verificando contraste AA en todos
- Tipos de `07` + validadores Zod
- `<RenderizadorModulos>` que recibe `ConfigModulo[]` y despacha componentes
- Lighthouse CI con los presupuestos de `08` como umbrales de fallo

**DoD:** un perfil de prueba renderiza con 5 módulos vacíos, LCP < 1.2 s, 0 errores de contraste, CI en verde.

---

## Sprint 1 — Núcleo del perfil (arquetipo Retail)

**Entrega:** perfil real, funcional y compartible de la distribuidora ferretera.

- Hero, Métricas, Estado vivo, Acciones + barra fija
- Catálogo destacado con carrusel y hoja de producto
- Ubicación + Horario + Métodos de pago
- Canales y redes
- `/r/{token}` con handoff a WhatsApp con mensaje contextual
- SSG + ISR, JSON-LD `LocalBusiness` + `Product`

**DoD:** un negocio real publicado en producción, compartido por WhatsApp con vista previa correcta, LCP < 1.8 s en 4G simulada, primera acción visible sin scroll en 375×667.

---

## Sprint 2 — Editor y carga de catálogo

**Entrega:** el negocio puede crear y editar su perfil desde el celular sin ayuda.

- Onboarding en 6 pasos, con **conversión desde aviso clasificado existente** (prioridad máxima)
- Editor de identidad, contacto, horario, módulos (arrastrar para ordenar)
- Carga de productos: individual, por lote (CSV/Excel) y por fotos múltiples
- Pipeline de imágenes: recorte inteligente, normalización, compresión, variantes, LQIP
- Medidor de completitud con tarea única

**DoD:** una persona sin conocimientos técnicos crea un perfil con 10 productos en menos de 15 minutos, cronometrado con un cliente real.

---

## Sprint 3 — Confianza

- Reseñas: carrusel, distribución, respuesta del negocio, hoja completa
- Flujo de captura de reseña post-contacto (enlace de una pregunta)
- Verificación de 3 niveles, con hoja explicativa
- Certificaciones y garantías
- Métricas verificadas calculadas (respuesta mediana, contactos, antigüedad)

**DoD:** un perfil con 10 reseñas reales capturadas por el flujo automático.

---

## Sprint 4 — Analítica y panel

- Taxonomía completa de `09`, con envío por lotes
- Panel del negocio con los cuatro bloques
- Generador de QR y piezas imprimibles
- Informe mensual por WhatsApp (automatizado)

**DoD:** el negocio recibe su primer informe con datos reales y lo entiende sin explicación.

---

## Sprint 5 — Arquetipos restantes

- Servicios y precios, Galería con antes/después, Equipo
- Configuraciones por defecto de los 6 arquetipos
- Listado con atributos comparables para Alto Ticket
- Categorías con filtrado en el sitio

**DoD:** seis perfiles reales publicados, uno por arquetipo, visiblemente distintos entre sí.

---

## Sprint 6 — Contenido vivo

- Novedades/Highlights con visor a pantalla completa
- Publicaciones con ruta indexable
- Promociones con vencimiento automático
- Puente a Deals
- Seguidores y notificaciones

**DoD:** una promoción vence sola y desaparece; un highlight publicado aparece en Deals.

---

## Sprint 7 — SEO/AEO y ADIS AI

- Catálogo y producto como rutas indexables completas
- FAQ con `FAQPage`, `llms.txt`, imagen OG dinámica
- Páginas de categoría por distrito
- "Pregúntale al negocio" con RAG sobre datos del perfil
- Registro de preguntas sin respuesta hacia el panel

**DoD:** un producto de un perfil aparece en Google para una consulta de cola larga; la IA responde 10 preguntas de prueba sin inventar stock.

---

## Backlog posterior (priorizado)

1. Reservas con calendario (arquetipo Cita)
2. Pedidos con carrito y pago Yape/Culqi
3. Programa de fidelización con sellos
4. Modo escaparate offline (PWA instalable)
5. Perfiles multi-sucursal
6. Traducción automática al inglés para negocios turísticos de Cusco — alto valor local, bajo costo
7. Integración con WhatsApp Business API para respuestas automáticas

---

## Definición de terminado (aplica a todo)

Un componente está terminado cuando: tiene sus cuatro estados implementados (cargando, vacío, error, lleno); cumple contraste AA y objetivo táctil de 44px; es navegable por teclado; respeta `prefers-reduced-motion`; no supera su parte del presupuesto de rendimiento; emite sus eventos de analítica; funciona en un iPhone SE real y en un Android de gama media real; y su texto está escrito según las reglas de copy de `02`.

**Regla de oro del proyecto:** ninguna función entra si sube el LCP por encima de 1.8 s. Si hay conflicto entre una función y la velocidad, gana la velocidad. Es la decisión que más te va a costar sostener y la que más valor conserva.

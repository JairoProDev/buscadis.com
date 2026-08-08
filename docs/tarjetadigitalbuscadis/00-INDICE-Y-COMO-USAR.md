# Buscadis — Perfil Vivo del Negocio
## Paquete de especificación completa (v1.0 · Agosto 2026)

Este paquete no describe una "tarjeta de presentación digital". Describe **el Perfil Vivo**: la ficha oficial, indexable, interactiva y actualizable de un negocio dentro del ecosistema ADIS. Es el nodo comercial sobre el que se apoyan Buscadis (marketplace), Deals (video corto), el Mapa y ADIS AI.

El objetivo del paquete es que puedas entregarlo, completo o por partes, a IAs especializadas en código (Claude Code, Cursor, v0) y que construyan sin tener que preguntar nada. Todo lo que hace falta decidir, está decidido aquí. Donde algo queda abierto, está marcado como `DECISIÓN PENDIENTE` con las opciones y el criterio de desempate.

---

## Orden de lectura

| # | Archivo | Qué contiene | Para quién |
|---|---|---|---|
| 01 | `01-CRITICA-Y-DECISIONES.md` | Crítica técnica a los 8 mockups actuales + las 14 decisiones irreversibles del producto | Tú, antes que nada |
| 02 | `02-FILOSOFIA-Y-POSICIONAMIENTO.md` | Círculo dorado, principios de diseño, qué nunca hacemos, naming | Producto, marketing |
| 03 | `03-INVESTIGACION-UX-Y-EVIDENCIA.md` | Comportamiento real del usuario, benchmarks, qué convierte y qué no | Diseño, producto |
| 04 | `04-ARQUITECTURA-DE-INFORMACION.md` | Sistema de módulos, orden canónico, 6 arquetipos de negocio, reglas de layout | Frontend, diseño |
| 05 | `05-DESIGN-SYSTEM.md` | Tokens, motor de temas por marca, tipografía, densidad y tamaño de cards | Frontend, diseño |
| 06 | `06-COMPONENTES.md` | Cada componente explicado a fondo: razón de ser, reglas, estados, anti-patrones | Frontend (núcleo) |
| 07 | `07-DATA-MODEL-Y-API.md` | Esquemas TypeScript, contratos de API, modelo de módulos configurables | Backend, frontend |
| 08 | `08-SEO-AEO-Y-RENDIMIENTO.md` | Indexación en Google, citabilidad por IAs, JSON-LD, presupuestos de performance | Backend, SEO |
| 09 | `09-ANALITICA-Y-CONVERSION.md` | Taxonomía de eventos, KPIs, panel del negocio, experimentos | Producto, data |
| 10 | `10-GTM-VIRALIDAD-Y-PRECIOS.md` | Estrategia de lanzamiento, loops virales, precios, guion de venta | Tú, Shantall |
| 11 | `11-ROADMAP-SPRINTS-Y-DoD.md` | 8 sprints, backlog priorizado, definición de terminado | Ejecución |
| 12 | `12-PROMPTS-PARA-IAS-DE-CODIGO.md` | Prompts listos para copiar, por fase | Tú |

---

## Cómo usarlo con IAs de código

**Regla base:** nunca pegues los 12 archivos juntos. Se diluye el contexto y la IA promedia.

Secuencia recomendada:

1. **Fundación del repo** → entrega `04`, `05`, `07`. Pide el esqueleto: tipos, tokens, motor de temas, renderizador de módulos vacío.
2. **Componentes** → entrega `05`, `06` y **un solo componente por sesión**. `06` está escrito para que cada sección sea un brief autónomo.
3. **Datos y API** → entrega `07` completo.
4. **SEO, rendimiento y accesibilidad** → entrega `08`. Esto es una pasada aparte, nunca mezclada con la de UI.
5. **Instrumentación** → entrega `09`.

Cada archivo abre con un bloque `CONTEXTO PARA LA IA` que puedes copiar tal cual como preámbulo.

---

## Glosario mínimo

- **Perfil Vivo** — el producto especificado aquí. Nombre interno. Al cliente se le vende como "tu perfil de negocio en Buscadis".
- **Módulo** — bloque funcional independiente del perfil (Hero, Catálogo, Reseñas...). Activable, ordenable, con estado vacío propio.
- **Arquetipo** — plantilla de configuración de módulos para una familia de negocios (Retail, Cita, Comida, Profesional, Alto Ticket, Local).
- **Intención dominante** — la acción que el 60%+ de visitantes de ese negocio quiere ejecutar. Define el orden de módulos.
- **Peek** — recorte intencional del siguiente elemento de un carrusel para señalar que hay más.
- **Handoff** — el salto del perfil a WhatsApp/llamada/mapa. Es el momento de mayor pérdida de datos y contexto del producto.

# 04 — Arquitectura de información

> **CONTEXTO PARA LA IA:** este documento define la estructura del Perfil Vivo: sistema de módulos, orden por arquetipo, reglas de navegación y layout. Combínalo con `07` (tipos) para construir el renderizador.

---

## 1. El modelo mental: pila de módulos, no página

El perfil no es una página con secciones. Es una **pila ordenada de módulos** que el sistema arma en tiempo de render a partir de: arquetipo del negocio + módulos activados + datos disponibles + plan contratado.

```
PerfilVivo = Hero
           + BarraEstado
           + [módulos ordenados por arquetipo, filtrados por datos y plan]
           + PieDeConfianza
           + BarraAcción (fija)
```

Cada módulo cumple el mismo contrato:

```ts
interface Modulo {
  id: string;                    // 'catalogo'
  tipo: TipoModulo;
  titulo: string;                // editable por el negocio, con default
  visible: boolean;              // activación manual
  orden: number;                 // dentro de límites del arquetipo
  minDatos: number;              // bajo este umbral, no se renderiza
  estadoVacio: 'ocultar' | 'invitar' | 'mostrar';
  plan: 'free' | 'pro' | 'max';
  ancla: string;                 // para la barra sticky y para #hash en la URL
}
```

**Regla de oro:** un módulo sin datos suficientes **no se renderiza en el perfil público**. En el panel del dueño, ese mismo módulo aparece como tarjeta de invitación ("Agrega 3 productos y activa tu catálogo"). Nunca se le muestra al visitante un "Aún no hay contenido".

---

## 2. Catálogo de módulos (22)

| # | Módulo | Tipo | Mín. datos | Plan | Detalle en |
|---|---|---|---|---|---|
| 1 | Hero / Identidad | fijo | siempre | free | `06 §1` |
| 2 | Métricas de confianza | fijo | siempre | free | `06 §2` |
| 3 | Estado vivo | fijo | horario | free | `06 §3` |
| 4 | Acciones rápidas | fijo | 1 canal | free | `06 §4` |
| 5 | Novedades / Highlights | colección | 1 | pro | `06 §5` |
| 6 | Categorías | navegación | 3 cat. + 20 ítems | free | `06 §6` |
| 7 | Catálogo destacado | colección | 3 ítems | free | `06 §7` |
| 8 | Servicios y precios | colección | 2 ítems | free | `06 §7b` |
| 9 | Promoción vigente | contenido | 1 activa | pro | `06 §9` |
| 10 | Reseñas | social | 1 | free | `06 §8` |
| 11 | Galería | colección | 3 fotos | free | `06 §10` |
| 12 | Publicaciones / Feed | social | 1 | pro | `06 §11` |
| 13 | Ubicación | info | dirección | free | `06 §12` |
| 14 | Horario | info | horario | free | `06 §13` |
| 15 | Métodos de pago | info | 1 | free | `06 §14` |
| 16 | Canales y redes | navegación | 1 | free | `06 §15` |
| 17 | Quiénes somos | contenido | texto | free | `06 §18` |
| 18 | Preguntas frecuentes | contenido | 2 | pro | `06 §19` |
| 19 | Equipo | colección | 1 | pro | `06 §20` |
| 20 | Certificaciones y garantías | confianza | 1 | pro | `06 §21` |
| 21 | Documentos descargables | recurso | 1 | pro | `06 §22` |
| 22 | Pregúntale al negocio (ADIS AI) | IA | catálogo ≥ 10 | max | `06 §23` |

Módulos fijos = siempre presentes, no se pueden desactivar ni reordenar. Los demás son ordenables dentro de los límites del arquetipo.

---

## 3. Los 6 arquetipos

Cada arquetipo define: intención dominante, acción primaria, orden por defecto y qué módulos vienen activos.

### A. RETAIL / CATÁLOGO
*Ferretería, boutique, vivero, distribuidora, minimarket, librería.*
**Intención dominante:** "¿tienen X y cuánto cuesta?" · **Acción primaria:** WhatsApp con contexto de producto.

```
Hero → Estado → Acciones → Catálogo destacado → Promoción → Categorías
→ Reseñas → Ubicación+Horario → Pago → Novedades → Canales → Quiénes somos
```
El catálogo va inmediatamente después de las acciones. Nada se interpone entre el usuario y el producto.

### B. SERVICIO POR CITA
*Barbería, salón, clínica dental, veterinaria, spa, taller mecánico.*
**Intención dominante:** "¿cuánto cuesta y cuándo pueden atenderme?" · **Acción primaria:** Reservar / WhatsApp.

```
Hero → Estado (con disponibilidad) → Acciones → Servicios y precios → Galería de trabajos
→ Reseñas → Equipo → Horario+Ubicación → Promoción → Canales → FAQ
```
La galería de trabajos es la prueba principal en este arquetipo: sustituye al catálogo. En estética, el "antes y después" convierte más que cualquier texto.

### C. COMIDA
*Restaurante, cafetería, pastelería, juguería, comida rápida.*
**Intención dominante:** "¿qué tienen, cuánto cuesta, hacen delivery, están abiertos?" · **Acción primaria:** Pedir por WhatsApp.

```
Hero → Estado (abierto + delivery activo) → Acciones → Carta destacada → Categorías de carta
→ Promoción → Reseñas → Ubicación+Horario → Pago → Novedades → Canales
```
Aquí "abierto ahora" y "delivery activo" son casi tan importantes como la carta.

### D. PROFESIONAL / B2B
*Abogado, contador, agencia, constructora, consultora, imprenta.*
**Intención dominante:** "¿son competentes y confiables? ¿cuánto cobran?" · **Acción primaria:** Agendar consulta / Cotizar.

```
Hero → Métricas → Acciones → Servicios y precios → Certificaciones → Reseñas/Casos
→ Equipo → Publicaciones → Documentos → FAQ → Ubicación+Horario → Canales
```
Único arquetipo donde la confianza va antes que la oferta, y el único donde "guardar contacto" (vCard) aparece en el menú de compartir.

### E. ALTO TICKET
*Inmobiliaria, automotriz, maquinaria, turismo, eventos.*
**Intención dominante:** "quiero explorar opciones y comparar" · **Acción primaria:** Agendar asesoría.

```
Hero → Métricas → Acciones → Listado destacado (con filtros) → Servicios
→ Reseñas → Publicaciones/Guías → Certificaciones → Documentos → Equipo
→ Ubicación+Horario → Canales
```
Los ítems necesitan atributos comparables (m², dormitorios, año, km) y el card es más alto que en retail.

### F. LOCAL / TRÁNSITO
*Bodega, farmacia, lavandería, copias, gimnasio, cabinas.*
**Intención dominante:** "¿dónde queda y están abiertos?" · **Acción primaria:** Cómo llegar.

```
Hero → Estado → Acciones → Ubicación+Horario → Servicios/Productos → Pago
→ Reseñas → Promoción → Canales
```
Único arquetipo donde Ubicación sube al tercer lugar. Perfil más corto de todos: 6–8 módulos.

---

## 4. Navegación

**Scroll vertical único.** Sin pestañas. Sin paginación.

**Barra de secciones sticky:** aparece cuando el hero sale del viewport (`IntersectionObserver`), altura 44px, scroll horizontal, marca la sección activa. Muestra solo los módulos con contenido. Al tocar, `scrollIntoView` suave con offset y actualización del hash de la URL (`/negocio/#catalogo`) — el hash es compartible y sirve para deep-linking desde el buscador de Buscadis.

**Barra de acción fija (inferior):** 64px + safe-area. Contiene la acción primaria a ancho completo con el color de marca, y a la izquierda dos íconos pequeños (favorito, compartir). Nunca más de una acción con color de marca.

**Modales, no páginas.** Producto, reseña, promoción, horario completo y galería abren en hoja modal (bottom sheet) con `history.pushState`, para que "atrás" cierre la hoja. Excepción: el catálogo completo es una ruta real (`/negocio/catalogo`) porque necesita ser indexable y compartible.

**Rutas del perfil:**
```
/[slug]                       Perfil (SSR, ISR 60s)
/[slug]/catalogo              Catálogo completo, filtrable, paginado
/[slug]/producto/[id]         Producto (indexable, Product schema)
/[slug]/resenas               Todas las reseñas
/[slug]/novedades/[id]        Publicación individual
/r/[token]                    Redirección medida a WhatsApp/tel/maps
/qr/[slug].png                QR generado
```

---

## 5. Reglas de layout

**Ancho.** Contenedor máximo 640px, centrado. En desktop no se estira: se muestra centrado sobre un fondo que puede llevar la portada difuminada. El perfil es móvil por naturaleza; estirarlo a 1200px lo convierte en la landing que estamos evitando.

**Ritmo vertical.** Separación entre módulos: 32px. Padding interno de módulo: 16px. Padding lateral de página: 16px. Los carruseles rompen el padding lateral (bleed) para que el peek llegue al borde de la pantalla — esto es lo que hace que se sienta app y no web.

**Títulos de módulo.** Fila de 44px: título a la izquierda (17px, semibold), enlace de acción a la derecha con el número real ("Ver los 358 →"). El número es información, no decoración: comunica el tamaño del catálogo antes de entrar.

**Carruseles.** Scroll horizontal con `scroll-snap-type: x mandatory`, `scroll-padding-left: 16px`, gap 12px. **Peek obligatorio:** el ancho del card se calcula para que el siguiente quede visible entre 20% y 40%. En ≥768px se convierten en grilla con `Ver todos` conservado.

**Densidad.** Ver `05 §6` para las medidas exactas de cada tipo de card. Regla: contenido mínimo legible define el ancho; el ancho define cuántos entran.

**Prohibido:** dos carruseles horizontales consecutivos sin un bloque estático entre ellos. Cansa y desorienta. Si el arquetipo los pone seguidos, se intercala un módulo de altura fija (promoción, ubicación) o el segundo se convierte en grilla de 2 columnas.

---

## 6. Estados globales

| Estado | Comportamiento |
|---|---|
| **Carga** | Esqueletos con la forma real del módulo (nunca spinner). Hero y acciones se sirven en el HTML inicial: nunca hay esqueleto sobre el pliegue. |
| **Sin conexión** | Última versión desde caché con franja "Mostrando la última versión guardada". Acciones de teléfono y WhatsApp siguen funcionando. |
| **Negocio cerrado** | El estado cambia a rojo, el CTA no se deshabilita: cambia el texto a "Escribir (responden mañana 9:00 a. m.)". Nunca bloquear el contacto. |
| **Negocio pausado por el dueño** | Franja neutra "Este negocio está temporalmente sin atención". Catálogo visible, acciones desactivadas con explicación. |
| **Perfil suspendido** | 410 Gone, sin contenido, sin caché. |
| **Plan vencido** | El perfil sigue online pero degradado a módulos free. Nunca se apaga: apagarlo destruye enlaces compartidos y nos quita SEO. Se muestra al dueño, no al visitante. |
| **Error de un módulo** | El módulo falla solo. El resto del perfil se renderiza. Nunca una pantalla de error completa. |

---

## 7. Límites de la personalización

El negocio puede: elegir color de marca (de una paleta derivada), portada, logo, orden de módulos no fijos, títulos de módulos, tema claro/oscuro, forma de los cards (redondeado suave / marcado), y qué métricas declaradas mostrar.

El negocio **no** puede: cambiar tipografías, alterar el color del chrome, mover módulos fijos, quitar la barra de acción, esconder la marca Buscadis del pie, ni desactivar la sección de reseñas cuando ya tiene reseñas.

**Fundamento:** la personalización libre produce perfiles feos y destruye el reconocimiento del sistema. La personalización con guardarraíles produce perfiles que se sienten propios y siguen siendo reconociblemente Buscadis. La segunda es lo que hace que un perfil ajeno le genere confianza a un usuario nuevo.

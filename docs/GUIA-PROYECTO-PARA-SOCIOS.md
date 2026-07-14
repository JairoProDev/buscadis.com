# ADIS / Buscadis / Publicadis — Guía completa (sin tecnicismos)

> Documento pensado para que alguien **no técnico** entienda a fondo qué es este proyecto, qué problema resuelve, cómo encajan las piezas, qué ya existe y hacia dónde vamos.  
> Última actualización: julio 2026  
> Alcance principal: el producto vivo en **[buscadis.com](https://www.buscadis.com)** y su hermana **[publicadis.com](https://publicadis.com)** dentro del ecosistema **ADIS**.

---

## 1. En una frase

**ADIS** es un ecosistema digital para personas y negocios en Perú (y luego LatAm):  
encontrar oportunidades, publicar avisos, tener perfil/catálogo de negocio, y —para quienes lo necesitan— una página web profesional, todo conectado a la misma cuenta y a los mismos datos.

Piensa en esto:

| Si eres… | En ADIS consigues… |
|----------|---------------------|
| Persona que busca | Empleo, cuarto, moto, servicio, producto, evento… en un solo lugar |
| Persona que vende / ofrece | Avisos (clasificados) que la gente encuentra en el feed y la búsqueda |
| Negocio | Tarjeta digital + catálogo + WhatsApp + presencia en el marketplace |
| Negocio que quiere “web de verdad” | Sitio en Publicadis (más bonito / más ecommerce), alimentado por los mismos productos |

---

## 2. Las marcas del ecosistema (no son “tres apps al azar”)

```
                         ADIS
            (marca paraguas / cuenta única)
                           │
         ┌─────────────────┼─────────────────┐
         ▼                 ▼                 ▼
     Buscadis          Publicadis        (Futuro)
   Marketplace +      Sitio web del      Conectadis,
   perfiles +         negocio            auth.adis.lat…
   catálogo
```

### 2.1 Buscadis (buscadis.com) — el corazón actual

**Qué es:** el marketplace / clasificados + perfiles de negocio.

**Analogías útiles:**

- Un poco **Facebook Marketplace** (gente busca y publica)
- Un poco **Instagram + Linktree** (perfil del negocio con logo, portada, botones, catálogo)
- Un poco **Google Business Profile** (datos, horarios, contacto, reseñas)

**URL típicas:**

- Inicio / feed: `https://www.buscadis.com`
- Perfil de un negocio: `https://www.buscadis.com/@villachaco`  
  (el `@` dice “esto es un perfil”, como en redes)

### 2.2 Publicadis (publicadis.com) — la “web profesional”

**Qué es:** páginas web más completas de cada negocio (historia, catálogo grande, look de tienda o marca).

**Analogía:** la web de empresa / tienda (antes WordPress, Wix, Shopify…), pero ojalá alimentada por **los mismos productos** que el negocio ya cargó en Buscadis.

**Ejemplos reales hoy:**

| Negocio | En Buscadis | En Publicadis |
|---------|-------------|----------------|
| Villa Chaco | `/@villachaco` | `/p/villachaco` (página tipo marca / producto) |
| Quival | `/@quival` | `/quival` (catálogo / ecommerce) |
| Agrilsur | `/@agrilsur` | `/p/agrilsur` (tienda propia conectada) |

### 2.3 ADIS (marca mayor)

**Qué es:** la visión de “una cuenta, muchas puertas”.  
Hoy la autenticación y los datos viven principalmente ligados a Buscadis (con Supabase).  
A futuro: login unificado tipo `auth.adis.lat` / Conectadis.

**Regla de oro del negocio:**  
**Un negocio = una ficha en la base de datos.**  
Buscadis y Publicadis son **dos formas de mostrar** lo mismo, no dos bases de clientes duplicadas (ese es el objetivo; algunos sitios aún están a medio migrar).

---

## 3. ¿Para quién es? (personas y roles)

### 3.1 Persona común (busca o publica un aviso)

- Entra al feed, busca, filtra por categoría (empleos, inmuebles, vehículos, servicios, productos, eventos, negocios, comunidad).
- Abre un aviso, ve fotos, comparte, escribe por WhatsApp.
- Puede marcar favoritos, ver mapa, chats, deals (ofertas/clips), etc.

### 3.2 Anunciante individual

- Publica un “adiso” (aviso clasificado).
- Puede tener tiers de publicación (gratis / pago / destacar), expiraciones, promoción.

### 3.3 Dueña o dueño de negocio

- Crea o edita su **perfil de negocio**.
- Sube **catálogo de productos** (con o sin fotos).
- Invita a su equipo (roles: dueño, admin, editor…).
- Publica el perfil para que el mundo lo vea (`is_published`).
- Ve métricas (visitas, WhatsApp, QR…).
- Opcional: tiene sitio en Publicadis y botón “Web” desde el perfil.

### 3.4 Equipo interno ADIS / administradores de plataforma

- Cuentas con permisos elevados (platform admin).
- Herramientas de admin, inteligencia, moderación, etc.

---

## 4. Qué ve un usuario en Buscadis (recorrido)

### 4.1 Página de inicio (feed)

- Buscador grande.
- Categorías horizontales.
- Stories / deals (según diseño actual).
- Grilla de avisos: **mezcla de clasificados clásicos + productos de catálogo** de negocios.
- Orden típico “Más recientes” (con toques de personalización e imágenes).
- Contadores tipo “X anuncios con actividad – Y vistas” (pulso social).

**Importante comercialmente:**  
cuando un negocio sube productos al catálogo, **deberían aparecer también en este marketplace**, no quedarse encerrados solo dentro del perfil. Eso es parte del valor: *audiencia incluida*.

### 4.2 Perfil de negocio (`/@nombre`)

Como una “página oficial” del negocio:

- Portada (banner) + logo  
- Nombre, frase, descripción  
- Botones: WhatsApp, carrito, compartir, a veces Web (Publicadis)  
- Pestañas: **Catálogo · Deals · Información · Reseñas**  
- Categorías del catálogo (estilo “historias” / highlights)  
- Contador de visitas / métricas de confianza  

**Modo edición (dueño):**  
puede reordenar productos arrastrando, editar campos, agregar productos, publicar/despublicar el perfil.

### 4.3 Otras puertas importantes

| Puerta | Para qué sirve |
|--------|----------------|
| Publicar | Crear un aviso clasificado |
| Mi negocio | Panel del negocio / catálogo / equipo |
| Favoritos | Guardados |
| Mapa | Explorar por ubicación |
| Chat | Conversaciones |
| Deals / Feed | Contenido tipo oferta / clips |
| QR (`/q/...`) | Escaneo impresos → perfil |
| Login / Perfil de persona | Cuenta del usuario |
| Progress / Guia / Ayuda | Onboarding y soporte |

---

## 5. Los tres “pilares” de datos (conceptos de negocio, no de código)

Imagina tres cajones en el mismo almacén:

### 5.1 Adisos (clasificados)

- Un aviso suelto: “Busco cajera”, “Alquilo local”, “Vendo moto”.
- Vive en el feed y la búsqueda.
- Históricamente Buscadis nació de aquí (incluso de digitalizar avisos de revistas).

### 5.2 Perfiles de negocio

- La “tarjeta de identidad” del negocio: Villa Chaco, Quival, Agrilsur, el propio Buscadis showcase, etc.
- Tiene dueño(s), logo, portada, horarios, redes, si está publicado o no.
- Genera URL canónica `buscadis.com/@slug`.

### 5.3 Productos de catálogo

- Ítems de la tienda del negocio: chocolates, tubos PVC, pinturas…
- Pueden tener foto, precio, categoría, variantes (tamaños).
- Se muestran en el perfil y **también** (idealmente) en el feed del marketplace.
- Son la fuente que Publicadis debería leer para no cargar el catálogo dos veces a mano.

**Frase para la socia:**  
*El clasificado es un anuncio puntual. El catálogo es el inventario del negocio. El perfil es la vitrina.*

---

## 6. Publicadis vs Buscadis — cómo explicarlo a un cliente

| Pregunta del cliente | Respuesta simple |
|----------------------|------------------|
| “¿Buscadis es mi web?” | Es tu **perfil + catálogo + presencia en el marketplace**. Perfecto para compartir en WhatsApp e Instagram. |
| “¿Y Publicadis?” | Es tu **página web profesional** (más marca o más tienda). |
| “¿Cargo productos dos veces?” | **No debería.** La visión es: cargas en un lado y se refleja en el otro. |
| “¿Cuál link doy a clientes?” | Perfil corto: `buscadis.com/@tu-negocio`. Web: `publicadis.com/...` según el caso. |
| “¿Puedo editar sola?” | En Buscadis sí, con el editor del negocio. Publicadis hoy depende del tipo de sitio (algunos aún son páginas hechas a medida). |

### Estado real de los sitios piloto (honestidad estratégica)

| Cliente | Madurez |
|---------|---------|
| **Villa Chaco** | Sitio Publicadis tipo marca (más estático / editorial). Perfil Buscadis vivo con catálogo. |
| **Quival** | Muchos productos en Buscadis (~500); ~70 con foto “oficiales”. Publicadis tipo catálogo/ecommerce; se está alineando al catálogo de Buscadis. |
| **Agrilsur** | Tienda con despliegue propio, conectada bajo el paraguas Publicadis. |

Esto no es desorden por capricho: es la etapa en la que **vários modelos de página web** coexisten mientras unificamos backend y datos.

---

## 7. Lo que la plataforma ya hace (lista de valor)

### Para quien busca

- Buscar y filtrar por categoría, texto, filtros avanzados, fotos, precio, ubicación.
- Ver detalle del aviso / producto.
- Contactar por WhatsApp sin exponer números al azar de forma torpe.
- Favoritos, historial, mapa, compartir links.

### Para quien publica avisos

- Flujo de publicación (incluyendo ayuda con IA en varios puntos del producto).
- Promoción / destacar / planes.
- Control de avisos gratis vs pagados, expiración.

### Para negocios

- Perfil público con diseño moderno.
- Catálogo con vista grilla / lista / feed.
- Reordenar productos (el orden que el dueño define es el que deberían ver los clientes).
- Editor con guardado, publicar perfil, equipo / invitaciones.
- Analítica de visitas (contador de perfil + actividad de la semana).
- QR hacia el perfil (útil en tienda física / tarjetas).
- Productos del catálogo visibles en el marketplace (feed).
- Botón hacia Publicadis cuando tienen sitio.

### Inteligencia artificial (ya integrada en partes del producto)

- Ayuda a redactar / publicar.
- Catálogo con asistencia (categorizar, procesar, mejorar imágenes en flujos específicos).
- Chatbot / asistencia en la experiencia.
- Personalización ligera del feed según intereses del usuario.

*(La IA no “es magia suelta”: está al servicio de publicar más rápido y ordenar mejor.)*

---

## 8. Cómo genera (o generará) valor el negocio

Modelo típico de este tipo de plataforma (mezcla de lo ya construido y la visión):

1. **Gratuito generoso** para crecer marketplace (perfiles, catálogos básicos, avisos free limitados).  
2. **Pago por destacar / promover** avisos y visibilidad.  
3. **Planes de negocio** (más productos, analítica, equipo, plantillas Publicadis, dominio propio…).  
4. **Publicadis / sitios** como producto premium o incluido en planes altos.  
5. A futuro: publicidad, leads, servicios de agencia (Publicadis también nace con ADN de marketing).

Para la socia:  
**El marketplace da audiencia. El perfil da confianza. La web da marca. Los datos compartidos dan eficiencia.**

---

## 9. Cómo se “siente” el día a día operativo (sin código)

### Cuando un negocio nuevo entra

1. Crea cuenta / inicia sesión.  
2. Crea negocio (nombre → se genera un “apodo” URL, el *slug*: `villachaco`, `quival`…).  
3. Completa logo, portada, WhatsApp, dirección, horarios.  
4. Sube productos (uno a uno, o en masa / con IA cuando el flujo lo permite).  
5. Publica el perfil.  
6. Comparte `buscadis.com/@su-negocio` o un QR.  
7. Opcional: se le arma / conecta Publicadis.

### Cuando alguien visita el perfil

1. Entra por link, QR o marketplace.  
2. Se cuenta una visita (métricas para el dueño).  
3. Navega catálogo, escribe por WhatsApp o agrega a carrito según el perfil.  
4. Puede dejar reseña / ver info.

### Cuando Publicadis y Buscadis están bien conectados

- Subes un producto con foto en Buscadis → puede salir en el feed **y** en la web Publicadis.  
- Cambias el orden en el editor → el visitante ve el mismo orden.  
- No hay “dos Excel diferentes”.

---

## 10. Problemas que hemos encontrado (y por qué importan)

Estos no son chismes técnicos: son riesgos de negocio.

| Problema | Efecto en el negocio | Dirección de solución |
|----------|----------------------|------------------------|
| Perfil no “publicado” | En modo incógnito sale “Negocio no encontrado”; solo el dueño lo ve | Publicar perfil; reglas claras de visibilidad |
| Caché de imágenes / PWA | Tú ves la portada nueva; otros dispositivos la vieja | Cache-bust, políticas de caché, redeploy |
| Tres URLs históricas (`/@`, `/p/`, `/nombre`) | Confusión de links impresos y QR | **Canónica `@`**, el resto redirige |
| Feed mostraba productos abajo | Parecía que “el catálogo no publica en el marketplace” | Corregir fechas y mezcla del feed |
| Catálogo Quival mezclado (con/sin foto, duplicados por medida) | Página sucia; Publicadis vacío o confuso | Solo sincronizar con foto; fusionar variantes; categorías claras |
| Publicadis en varios repos / estilos | Difícil de operar y de vender “self-serve” | Un solo backend de datos + plantillas + IA después |

---

## 11. Dónde “vive” el proyecto (mapa para no técnicos)

No necesitas programar; sí conviene saber **dónde se decide cada cosa**.

| Pieza | Qué es en cristiano | Dónde suele estar |
|-------|---------------------|-------------------|
| **Buscadis (producto)** | La app que la gente usa | Carpeta/repo `buscadis.com` → internet en Vercel → dominio buscadis.com |
| **Publicadis (host)** | La casa de las webs y marketing Publicadis | Repo `publicadis.com` → Vercel proyecto publicadis → publicadis.com |
| **Agrilsur web** | Tienda hecha a medida | Repo `agrilsur` → su propio Vercel → se muestra bajo Publicadis |
| **Base de datos** | El almacén de perfiles, productos, avisos, visitas | **Supabase** (proyecto activo de Buscadis) |
| **Fotos** | Archivos de imágenes | “Storage” de Supabase (no en WhatsApp ni en el código) |
| **GitHub** | Historial y copia del código | Repos del equipo |
| **Vercel** | “La fábrica que pone la web en internet” | Deploys automáticos al subir cambios |

**Analogía:**  
GitHub = el libro de recetas.  
Vercel = la cocina que cocina y sirve el plato.  
Supabase = la despensa.  
Dominios (.com) = la dirección del restaurante.

---

## 12. Visión a mediano plazo (lo que la socia debe exigir como norte)

1. **Una sola fuente de verdad**  
   Perfil + productos + miembros en la misma base. Buscadis y Publicadis solo “disfraces” distintos.

2. **Self-serve real**  
   El negocio edita solo (y más adelante: pide cambios a la IA en lenguaje natural: “pon el chocolate de cacao primero”, “usa tonos tierra”).

3. **Plantillas Publicadis**  
   No mil webs sueltas: pocas bases (marca artesanal, ferretería/catálogo, agro/ecommerce…) personalizables.

4. **Marketplace = canal de adquisición**  
   Subir un producto = aparecer delante de personas que ya buscan.

5. **Confianza**  
   Verificación, reseñas, analítica transparente, QR físicos.

6. **Escala LatAm**  
   Empezar fuerte en Cusco/Perú; arquitectura pensada para cientos de miles de negocios.

---

## 13. Glosario (léelo cuando te trabes)

| Palabra | Significado humano |
|---------|-------------------|
| **Adiso** | Aviso clasificado |
| **Feed** | Timeline / muro de avisos de la home |
| **Slug** | Apodo corto de URL (`villachaco`) |
| **Perfil / business profile** | Ficha del negocio |
| **Catálogo** | Lista de productos del negocio |
| **Marketplace** | El lugar donde muchos vendedores y compradores se encuentran (Buscadis) |
| **Publicar (perfil)** | Hacer visible el negocio a gente no logueada |
| **Deploy** | Publicar una nueva versión de la web en internet |
| **Repo / repositorio** | Carpeta versionada del proyecto en GitHub |
| **Supabase** | Servicio de base de datos + usuarios + archivos |
| **Vercel** | Servicio que hospeda la web Next.js |
| **QR** | Código que al escanear abre el perfil |
| **PWA** | “App” instalable desde el navegador; a veces guarda fotos en caché |
| **Caché** | Memoria rápida que a veces muestra cosas viejas |
| **API** | Puerta automática para que Publicadis pida productos a Buscadis |
| **RLS / permisos** | Reglas de quién puede ver u ocultar datos |
| **IA** | Funciones que ayudan a redactar, ordenar, categorizar, editar |

---

## 14. Preguntas frecuentes entre socias

**¿Buscadis y Publicadis compiten?**  
No. Uno atrae y convierte en el marketplace/perfil; el otro proyecta marca/web profunda. Juntos son el paquete.

**¿Por qué a veces un cliente ve algo distinto que nosotros?**  
Caché, modo incógnito (sin sesión de dueño), perfil no publicado, o versión aún no desplegada.

**¿Qué link imprimimos en un volante?**  
Preferible: `buscadis.com/@negocio` (corto, estable). Si ya hay QR antiguos, deben redirigir ahí.

**¿Cuándo está “listo para vender” un negocio en la plataforma?**  
Perfil publicado, logo/portada, WhatsApp, al menos algunos productos con foto, y (opcional) Publicadis alineado.

**¿Qué es lo más estratégico ahora?**  
1) Que el marketplace muestre bien los productos recientes,  
2) Unificar datos Buscadis↔Publicadis,  
3) Operar pocos clientes piloto excelentes (Villa Chaco, Quival, Agrilsur) como casos de venta.

---

## 15. Resumen ejecutivo (para reenviar por WhatsApp)

1. **ADIS** es el ecosistema; **Buscadis** es marketplace + perfiles; **Publicadis** son las webs profesionales.  
2. Un negocio tiene **una identidad**; idealmente **un catálogo** que alimenta ambas puertas.  
3. Buscadis ya permite publicar, vender presencia, catálogo, equipo, QR, métricas e IA de apoyo.  
4. Publicadis hoy tiene sitios piloto de distintos tipos; el norte es plantillas + mismos datos + edición fácil (luego con IA).  
5. Los dolores actuales (caché, publicación, feed, Quival sin fotos en Publicadis) son de **madurez de producto**, no de falta de visión.  
6. El diferenciador comercial: **audiencia incluida + gratis para empezar + todo conectado**, frente a pagar web + ads + herramientas sueltas.

---

## 16. Documentos técnicos hermanos (si un día quieres más detalle)

- `docs/ECOSISTEMA-ADIS-ARQUITECTURA.md` — arquitectura Buscadis × Publicadis  
- `docs/PUBLICADIS-MAPA.md` — dónde está cada repo / deploy / cliente  
- `docs/BUSINESS-PAGE-EVOLUTION-MASTERPLAN.md` — visión ambiciosa de la página de negocio  
- `docs/CATALOG-*.md` — detalle del sistema de catálogo  

Este archivo (`docs/GUIA-PROYECTO-PARA-SOCIOS.md`) es la **versión para decisiones y alineación humana**, no el manual de programadores.

---

*Si algo de este documento no coincide con lo que ustedes venden comercialmente mañana, actualizar esta guía primero: es el contrato de entendimiento entre producto y negocio.*

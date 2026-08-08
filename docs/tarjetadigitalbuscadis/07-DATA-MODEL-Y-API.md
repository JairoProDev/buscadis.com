# 07 — Modelo de datos y API

> **CONTEXTO PARA LA IA:** estos tipos son la fuente de verdad. Genera a partir de ellos el esquema de base de datos, los validadores (Zod) y los tipos del cliente. No inventes campos: si falta algo, es una decisión de producto pendiente.

Stack asumido: Next.js (App Router) + TypeScript + PostgreSQL (datos relacionales del perfil) + MongoDB (catálogo y contenido) + Redis (estado vivo, contadores) + Elasticsearch (búsqueda) + S3/R2 (media). Coherente con la estrategia poliglota ya definida del ecosistema.

---

## 1. Tipos principales

```ts
type Arquetipo = 'retail' | 'cita' | 'comida' | 'profesional' | 'alto_ticket' | 'local';
type Plan = 'free' | 'pro' | 'max';
type NivelVerificacion = 0 | 1 | 2 | 3; // 0 sin verificar · 1 registrado · 2 RUC · 3 visita física

interface Negocio {
  id: string;
  slug: string;                    // único, inmutable tras 7 días
  nombre: string;                  // ≤ 60
  eslogan?: string;                // ≤ 90
  categoria: { id: string; nombre: string; padre?: string };
  arquetipo: Arquetipo;
  plan: Plan;
  estado: 'activo' | 'pausado' | 'suspendido' | 'vencido';

  identidad: {
    logoUrl?: string;
    portadaUrl?: string;
    colorSemilla: string;          // hex elegido por el negocio
    tema: 'claro' | 'oscuro' | 'auto';
    formaCards: 'suave' | 'marcado';
  };

  contacto: {
    whatsapp?: string;             // E.164
    telefono?: string;             // E.164
    email?: string;
    web?: string;
    redes: RedSocial[];
  };

  ubicacion?: {
    direccion: string;
    referencia?: string;           // "frente al Mall Aventura"
    distrito: string; provincia: string; departamento: string;
    lat: number; lng: number;
    mostrarDireccionExacta: boolean; // false para negocios sin local
  };

  horario: Horario;
  metodosPago: MetodoPago[];
  verificacion: { nivel: NivelVerificacion; fecha?: string; ruc?: string; notas?: string };

  metricasDeclaradas: MetricaDeclarada[];  // máx 2
  modulos: ConfigModulo[];
  seo: { titulo?: string; descripcion?: string; palabrasClave: string[] };

  creadoEn: string;
  actualizadoEn: string;
}

interface Horario {
  zona: 'America/Lima';
  semana: Record<'lun'|'mar'|'mie'|'jue'|'vie'|'sab'|'dom', Franja[]>;
  excepciones: { fecha: string; franjas: Franja[]; motivo?: string }[]; // feriados, cierres
}
interface Franja { desde: string; hasta: string } // "09:00" | "18:30"

interface RedSocial { tipo: 'instagram'|'facebook'|'tiktok'|'youtube'|'linkedin'|'x'|'pinterest'|'web'; url: string; activa: boolean }
type MetodoPago = 'efectivo'|'yape'|'plin'|'visa'|'mastercard'|'amex'|'transferencia'|'credito'|'cripto';
interface MetricaDeclarada { icono: string; valor: string; etiqueta: string } // "25", "años en el rubro"

interface ConfigModulo {
  tipo: TipoModulo; visible: boolean; orden: number; titulo?: string;
}
type TipoModulo =
  | 'hero'|'metricas'|'estado'|'acciones'          // fijos
  | 'novedades'|'categorias'|'catalogo'|'servicios'|'promocion'|'resenas'
  | 'galeria'|'publicaciones'|'ubicacion'|'horario'|'pago'|'canales'
  | 'nosotros'|'faq'|'equipo'|'certificaciones'|'documentos'|'ia';
```

## 2. Catálogo

```ts
interface Producto {
  id: string; negocioId: string;
  nombre: string;                        // ≤ 80
  descripcion?: string;                  // ≤ 600
  precio?: { valor: number; moneda: 'PEN'|'USD'; tipo: 'exacto'|'desde'|'rango'; valorMax?: number };
  precioAnterior?: number;
  imagenes: Imagen[];                    // 1..8, primera es la principal
  categoriaId?: string;
  atributos: { clave: string; valor: string }[];   // marca, material, m², año...
  disponibilidad: 'disponible'|'agotado'|'bajo_pedido'|'ultimas_unidades';
  stock?: number;
  destacado: boolean; orden?: number;
  etiquetas: ('nuevo'|'mas_vendido'|'oferta'|'popular')[];  // máx 1 se muestra
  sku?: string;
  activo: boolean; creadoEn: string;
}

interface Servicio extends Omit<Producto,'stock'|'disponibilidad'> {
  duracionMin?: number;
  incluye?: string[];
  agendable: boolean;
}

interface Imagen { url: string; ancho: number; alto: number; lqip: string; alt?: string; colorDominante: string }
```

## 3. Contenido social

```ts
interface Highlight {
  id: string; negocioId: string; titulo: string;   // ≤ 14 caracteres visibles
  portadaUrl: string; orden: number;
  slides: Slide[];                                  // máx 10
  expiraEn?: string; publicadoEn: string;
}
interface Slide {
  tipo: 'imagen'|'video'|'producto'|'promocion'|'enlace';
  url?: string; productoId?: string; promocionId?: string;
  duracionMs?: number; cta?: { texto: string; destino: string };
}

interface Publicacion {
  id: string; negocioId: string; slug: string;
  titulo: string; cuerpo: string; portadaUrl?: string;
  productosEtiquetados: string[];
  publicadoEn: string; reacciones: Record<string, number>;
  promovidaADeals: boolean;
}

interface Promocion {
  id: string; negocioId: string;
  titulo: string; condicion?: string; codigo?: string;
  descuento?: { tipo: 'porcentaje'|'monto'|'2x1'; valor?: number };
  imagenUrl?: string;
  inicia: string; vence: string;         // vencida ⇒ oculta automáticamente
  prioridad: number;
  productosAplicables?: string[];
}

interface Resena {
  id: string; negocioId: string;
  autor: { nombre: string; iniciales: string };
  estrellas: 1|2|3|4|5;
  texto?: string; fotos?: string[];
  contactoVerificado: boolean;           // ocurrió vía Buscadis
  respuesta?: { texto: string; fecha: string };
  creadaEn: string; estado: 'publicada'|'reportada'|'oculta';
}
```

## 4. Datos calculados por la plataforma (nunca editables)

```ts
interface MetricasVerificadas {
  negocioId: string;
  calificacion?: { promedio: number; total: number; distribucion: Record<1|2|3|4|5, number> };
  respuestaMedianaMin?: number;      // mediana, n≥10, ventana 30d, dentro de horario
  contactos30d: number;
  pedidosHoy?: number;               // solo con n≥3
  visitas30d: number;
  antiguedadDesde: string;
  completitud: number;               // 0-100
  siguienteTarea?: { clave: string; texto: string; impacto: string };
}

interface EstadoVivo {
  abierto: boolean;
  cierraEn?: string; abreEn?: string;
  porCerrar: boolean;                // <60 min
  deliveryActivo?: boolean;
  mensaje: string;                   // ya formateado en español
}
```

## 5. Endpoints

```
GET  /api/perfil/:slug                → Negocio + módulos resueltos + metricas + estadoVivo
GET  /api/perfil/:slug/catalogo       → ?cat=&q=&orden=&cursor=  (20 por página)
GET  /api/perfil/:slug/producto/:id
GET  /api/perfil/:slug/resenas        → ?cursor=
GET  /api/perfil/:slug/estado         → EstadoVivo (Redis, TTL 60s) — para revalidación ligera
POST /api/perfil/:slug/pregunta       → ADIS AI, RAG solo sobre datos del perfil
GET  /r/:token                        → 302 al destino, registra el evento
POST /api/eventos                     → lote de eventos de analítica (sendBeacon)

# Panel (autenticado)
PATCH /api/negocio/:id                 → identidad, contacto, horario, módulos
POST  /api/negocio/:id/productos       → alta individual
POST  /api/negocio/:id/productos/lote  → CSV / Excel / fotos múltiples
POST  /api/negocio/:id/media           → subida + postprocesado
GET   /api/negocio/:id/panel           → métricas, contactos, preguntas sin respuesta
POST  /api/negocio/:id/qr              → genera piezas (PNG/PDF/A4/sticker/story)
```

**Contrato de respuesta del perfil.** Un solo request devuelve todo lo necesario para el render inicial: nada de cascadas. El catálogo devuelve solo los 12 destacados; el resto se pide bajo demanda. Cabeceras: `Cache-Control: public, s-maxage=60, stale-while-revalidate=600`.

## 6. Reglas de validación

- `slug`: 3–40, `[a-z0-9-]`, único, reservados bloqueados (`api`, `admin`, `r`, `qr`, `deals`, `mapa`).
- Teléfonos normalizados a E.164 con prefijo `+51` por defecto; se rechaza el número si no valida.
- Precios: enteros en céntimos internamente; nunca coma flotante.
- Imágenes: máx 10 MB en la subida, se recomprimen a los límites de `05 §7`; se rechaza si tras el procesado supera el presupuesto.
- Texto libre: se sanea, se prohíben teléfonos y URLs externas en descripciones de productos en plan free (regla anti-fuga ya definida para el marketplace).
- Un negocio no puede tener más de 3 promociones activas ni más de 8 highlights.

## 7. Migración desde datos existentes

Los negocios ya presentes en Buscadis como avisos clasificados deben poder convertirse en perfil con un clic: nombre, categoría, teléfono, ubicación y fotos del aviso pasan directo. **Esta es la palanca de adopción más importante del lanzamiento**: un negocio que ya publicó un aviso obtiene su perfil pre-llenado en cinco segundos y solo tiene que confirmarlo. Diséñalo antes que el editor completo.

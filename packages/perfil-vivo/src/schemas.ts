import { z } from 'zod';
import type { Negocio } from './types';

export const ArquetipoSchema = z.enum([
  'retail',
  'cita',
  'comida',
  'profesional',
  'alto_ticket',
  'local',
]);

export const PlanSchema = z.enum(['free', 'pro', 'max']);

export const TipoModuloSchema = z.enum([
  'hero',
  'metricas',
  'estado',
  'acciones',
  'novedades',
  'categorias',
  'catalogo',
  'servicios',
  'promocion',
  'resenas',
  'galeria',
  'publicaciones',
  'ubicacion',
  'horario',
  'pago',
  'canales',
  'nosotros',
  'faq',
  'equipo',
  'certificaciones',
  'documentos',
  'ia',
]);

export const ConfigModuloSchema = z.object({
  tipo: TipoModuloSchema,
  visible: z.boolean(),
  orden: z.number().int().nonnegative(),
  titulo: z.string().max(80).optional(),
});

export const NegocioSchema = z.object({
  id: z.string().min(1),
  slug: z
    .string()
    .min(3)
    .max(40)
    .regex(/^[a-z0-9-]+$/),
  nombre: z.string().min(1).max(60),
  eslogan: z.string().max(90).optional(),
  categoria: z.object({
    id: z.string(),
    nombre: z.string(),
  }),
  arquetipo: ArquetipoSchema,
  plan: PlanSchema,
  estado: z.enum(['activo', 'pausado', 'suspendido', 'vencido']),
  identidad: z.object({
    logoUrl: z.string().optional(),
    portadaUrl: z.string().optional(),
    colorSemilla: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    tema: z.enum(['claro', 'oscuro', 'auto']),
    formaCards: z.enum(['suave', 'marcado']),
  }),
  contacto: z.object({
    whatsapp: z.string().optional(),
    telefono: z.string().optional(),
    email: z.string().optional(),
    web: z.string().optional(),
    redes: z.array(
      z.object({
        tipo: z.string(),
        url: z.string(),
        activa: z.boolean(),
      })
    ),
  }),
  ubicacion: z
    .object({
      direccion: z.string(),
      distrito: z.string(),
      provincia: z.string(),
      departamento: z.string(),
      lat: z.number(),
      lng: z.number(),
      mostrarDireccionExacta: z.boolean(),
      referencia: z.string().optional(),
    })
    .optional(),
  horario: z
    .object({
      zona: z.literal('America/Lima'),
      semana: z.record(
        z.array(z.object({ desde: z.string(), hasta: z.string() }))
      ),
      excepciones: z
        .array(
          z.object({
            fecha: z.string(),
            franjas: z.array(z.object({ desde: z.string(), hasta: z.string() })),
            motivo: z.string().optional(),
          })
        )
        .optional(),
    })
    .optional(),
  metodosPago: z
    .array(
      z.enum([
        'efectivo',
        'yape',
        'plin',
        'visa',
        'mastercard',
        'amex',
        'transferencia',
        'credito',
        'cripto',
      ])
    )
    .optional(),
  verificacion: z.object({
    nivel: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
    fecha: z.string().optional(),
  }),
  metricasDeclaradas: z
    .array(
      z.object({
        icono: z.string(),
        valor: z.string(),
        etiqueta: z.string(),
      })
    )
    .max(2),
  modulos: z.array(ConfigModuloSchema),
  conteos: z
    .object({
      productos: z.number().int().nonnegative().optional(),
      resenas: z.number().int().nonnegative().optional(),
      fotosGaleria: z.number().int().nonnegative().optional(),
      faqs: z.number().int().nonnegative().optional(),
      promociones: z.number().int().nonnegative().optional(),
      tieneNosotros: z.number().int().nonnegative().optional(),
    })
    .optional(),
  creadoEn: z.string(),
  actualizadoEn: z.string(),
});

export function parseNegocio(input: unknown): Negocio {
  return NegocioSchema.parse(input) as Negocio;
}

export function safeParseNegocio(input: unknown) {
  return NegocioSchema.safeParse(input);
}

export function parseConfigModulo(input: unknown) {
  return ConfigModuloSchema.parse(input);
}

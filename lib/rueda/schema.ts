import { z } from 'zod';

export const RUEDA_AVISO_SCHEMA_VERSION = 1;

export const ruedaExtractedAdSchema = z.object({
  batch_id: z.string().min(1),
  edicion: z.string().regex(/^R\d+$/i),
  pagina: z.number().int().positive(),
  import_key: z.string().min(1),
  titulo: z.string().min(1).max(200),
  categoria: z.string().min(1),
  subcategoria: z.string().optional(),
  ubicacion: z.string(),
  vacantes: z.array(z.string()).optional(),
  descripcion: z.string(),
  telefonos: z.array(z.string()).min(1),
  whatsapp: z.string().nullable(),
  email: z.string().nullable(),
  es_empresa: z.boolean(),
  confianza: z.number().min(0).max(1),
  requiere_revision: z.boolean(),
  recurrente: z.boolean(),
  score: z.number().min(0).max(100),
  issues: z.array(z.string()),
  texto_raw: z.string(),
  flyer_template: z.string(),
  hide_generic_location: z.boolean(),
});

export const ruedaAvisosPayloadSchema = z.object({
  schema_version: z.number().int().optional(),
  edicion: z.string(),
  batch_id: z.string(),
  fecha_publicacion_original: z.string(),
  pdf: z.string(),
  extracted_at: z.string(),
  total_paginas: z.number().int().nonnegative(),
  total_avisos: z.number().int().nonnegative(),
  por_pagina: z.array(z.object({ pagina: z.number(), count: z.number() })),
  avisos: z.array(ruedaExtractedAdSchema).min(1),
});

export type RuedaAvisosPayloadValidated = z.infer<typeof ruedaAvisosPayloadSchema>;

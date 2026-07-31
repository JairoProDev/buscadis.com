import { z } from 'zod';

// Schema de validación para adisos
export const adisoSchema = z.object({
  id: z.string().min(1, 'ID es requerido'),
  categoria: z.enum([
    'empleos',
    'inmuebles',
    'vehiculos',
    'servicios',
    'productos',
    'eventos',
    'negocios',
    'comunidad'
  ]),
  titulo: z.string()
    .min(1, 'El título es requerido')
    .max(100, 'El título no puede exceder 100 caracteres')
    .trim(),
  descripcion: z.string()
    .max(2000, 'La descripción no puede exceder 2000 caracteres')
    .optional()
    .nullable(),
  contacto: z.string()
    .transform((val) => {
      // Normalizar número: eliminar espacios, guiones, paréntesis, etc., pero mantener el + al inicio
      return val.replace(/\s+/g, '').replace(/[()-]/g, '').trim();
    })
    .refine((val) => {
      // Validar formato después de normalizar: debe tener entre 7 y 15 dígitos (puede incluir + al inicio)
      // Permitimos que empiece con 0 (fijos) o cualquier dígito
      return /^\+?\d{7,15}$/.test(val);
    }, {
      message: 'Número de contacto inválido. Debe tener entre 7 y 15 dígitos.'
    }),
  ubicacion: z.union([
    z.string()
      .min(1, 'La ubicación es requerida')
      .max(100, 'La ubicación no puede exceder 100 caracteres')
      .trim(),
    z.object({
      pais: z.string().optional(),
      departamento: z.string(),
      provincia: z.string(),
      distrito: z.string(),
      direccion: z.string().optional(),
      latitud: z.number().optional(),
      longitud: z.number().optional()
    })
  ]),
  tamaño: z.enum(['miniatura', 'pequeño', 'mediano', 'grande', 'gigante']).optional(),
  // Permitir blob: URLs para previews locales antes de subir a Supabase
  imagenUrl: z.string().refine(
    (val) => !val || val.startsWith('http') || val.startsWith('blob:') || val.startsWith('data:'),
    { message: 'URL de imagen inválida' }
  ).optional().nullable(),
  imagenesUrls: z.array(
    z.string().refine(
      (val) => val.startsWith('http') || val.startsWith('blob:') || val.startsWith('data:'),
      { message: 'URL de imagen inválida' }
    )
  ).optional().nullable(),
  fechaPublicacion: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido'),
  horaPublicacion: z.string().regex(/^\d{2}:\d{2}$/, 'Formato de hora inválido'),
  // User ID fields (optional but vital for backend)
  user_id: z.string().optional(),
  usuario_id: z.string().optional(),
});

// Schema para adisos gratuitos (más restrictivo)
export const adisoGratuitoSchema = z.object({
  titulo: z.string()
    .min(1, 'El título es requerido')
    .max(30, 'El título no puede exceder 30 caracteres')
    .trim(),
  categoria: z.enum([
    'empleos',
    'inmuebles',
    'vehiculos',
    'servicios',
    'productos',
    'eventos',
    'negocios',
    'comunidad'
  ]),
  contacto: z.string()
    .transform((val) => {
      // Normalizar número: eliminar espacios, guiones, paréntesis, etc., pero mantener el + al inicio
      return val.replace(/\s+/g, '').replace(/[()-]/g, '').trim();
    })
    .refine((val) => {
      // Validar formato después de normalizar: debe tener entre 9 y 15 dígitos (puede incluir + al inicio)
      return /^\+?[1-9]\d{8,14}$/.test(val);
    }, {
      message: 'Número de contacto inválido. Debe tener entre 9 y 15 dígitos (puede incluir + al inicio)'
    }),
});

const ubicacionSchema = z.union([
  z.string()
    .min(1, 'La ubicación es requerida')
    .max(100, 'La ubicación no puede exceder 100 caracteres')
    .trim(),
  z.object({
    pais: z.string().optional(),
    departamento: z.string(),
    provincia: z.string(),
    distrito: z.string(),
    direccion: z.string().optional(),
    latitud: z.number().optional(),
    longitud: z.number().optional(),
  }),
]);

// Schema para crear adiso (acepta adisos completos o parciales)
export const createAdisoSchema = adisoSchema
  .omit({
    fechaPublicacion: true,
    horaPublicacion: true,
    ubicacion: true,
  })
  .extend({
    id: z.string().min(1).optional(),
    fechaPublicacion: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (debe ser YYYY-MM-DD)').optional(),
    horaPublicacion: z.string().regex(/^\d{2}:\d{2}$/, 'Formato de hora inválido (debe ser HH:MM)').optional(),
    // Opcional en el formulario; el servidor aplica Cusco por defecto
    ubicacion: ubicacionSchema.optional(),
  });

// Schema for Publish Studio — all fields optional except minimum content rule enforced server-side
export const publishStudioSchema = z.object({
  categoria: z.enum([
    'empleos', 'inmuebles', 'vehiculos', 'servicios', 'productos', 'eventos', 'negocios', 'comunidad',
  ]).optional(),
  subcategoria: z.string().optional(),
  subsubcategoria: z.string().optional(),
  titulo: z.string().max(120).optional(),
  descripcion: z.string().max(2000).optional(),
  contacto: z.string().max(30).optional(),
  ubicacion: ubicacionSchema.optional(),
  imagenes: z.array(z.string().url()).optional(),
  precio: z.number().optional(),
  moneda: z.enum(['PEN', 'USD']).optional(),
  tipoPrecio: z.enum(['fijo', 'a_convenir', 'gratis', 'consultar']).optional(),
  atributos: z.record(z.union([z.string(), z.number(), z.boolean(), z.array(z.string())])).optional(),
  plan: z.enum(['free', 'paid']).default('paid'),
  paidDays: z.number().int().min(1).max(90).optional(),
  dailyRate: z.number().min(5).max(50).optional(),
  flyerTemplateId: z.string().optional(),
  flyerConfig: z
    .object({
      primary: z.string().optional(),
      secondary: z.string().optional(),
      align: z.enum(['left', 'center']).optional(),
      badge: z.string().max(40).optional(),
      showPrice: z.boolean().optional(),
      showLocation: z.boolean().optional(),
      showCategory: z.boolean().optional(),
      titleScale: z.enum(['s', 'm', 'l']).optional(),
    })
    .optional(),
});

// Schema para crear adiso gratuito
export const createAdisoGratuitoSchema = adisoGratuitoSchema;

// Funciones de sanitización
export function sanitizeText(text: string): string {
  return text
    .trim()
    .replace(/\s+/g, ' ') // Múltiples espacios a uno
    .replace(/[<>]/g, ''); // Remover < y >
}

// Función para sanitizar HTML (prevenir XSS)
export function sanitizeHtml(html: string): string {
  if (typeof window === 'undefined') {
    // En el servidor, usar una sanitización básica
    return html
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  // En el cliente, usar DOMPurify si está disponible
  // Por ahora, usar sanitización básica
  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
}

// Validar tamaño de imagen
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const MAX_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'Tipo de archivo no permitido. Use JPEG, PNG o WebP' };
  }

  if (file.size > MAX_SIZE) {
    return { valid: false, error: 'El archivo es demasiado grande. Máximo 5MB' };
  }

  return { valid: true };
}

// Validar URL
export function validateUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

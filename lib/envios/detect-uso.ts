import type { MotoCategory, UsoDetectado } from './types';

/**
 * Clasificación de producto para analytics admin:
 * - envio: pedido típico de mercancía
 * - asistencia: ayuda con carga / casos especiales descritos
 * - desconocido: sin señal clara
 *
 * No se muestra en UI al usuario.
 */
const ASISTENCIA_PATTERNS: RegExp[] = [
  /\bcaja\s+pesad/i,
  /\bcarga\s+grande/i,
  /\bayuda(r)?\s+(a\s+)?(subir|bajar|cargar|mover)/i,
  /\bfr[aá]gil\b/i,
  /\bvolumino/i,
  /\bnecesito\s+ayuda\b/i,
  /\basistencia\b/i,
];

export function detectUso(
  category: MotoCategory,
  description: string
): UsoDetectado {
  if (category === 'acompanamiento') return 'asistencia';

  const text = (description || '').trim();

  if (category === 'paquete' || category === 'documentos' || category === 'mandado') {
    if (ASISTENCIA_PATTERNS.some((re) => re.test(text))) return 'asistencia';
    return 'envio';
  }

  if (category === 'olvidado') {
    if (ASISTENCIA_PATTERNS.some((re) => re.test(text))) return 'asistencia';
    return 'envio';
  }

  // otro
  if (!text) return 'desconocido';
  if (ASISTENCIA_PATTERNS.some((re) => re.test(text))) return 'asistencia';

  return 'envio';
}

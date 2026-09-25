import { Adiso, UbicacionDetallada } from '@/types';

export const UBICACION_DEFAULT_CUSCO: UbicacionDetallada = {
  pais: 'Perú',
  departamento: 'Cusco',
  provincia: 'Cusco',
  distrito: 'Cusco',
};

/** Normaliza teléfono para API (sin espacios ni guiones). */
export function normalizeContactoForApi(contacto: string): string {
  return contacto.replace(/\s+/g, '').replace(/[()-]/g, '').trim();
}

/** Ubicación del formulario → valor válido para guardar (default Cusco si omiten). */
export function resolveUbicacionForPublish(
  ubicacion: Adiso['ubicacion'] | undefined
): Adiso['ubicacion'] {
  if (typeof ubicacion === 'object' && ubicacion !== null && 'distrito' in ubicacion) {
    const u = ubicacion as UbicacionDetallada;
    if (u.distrito?.trim() && u.departamento?.trim()) {
      return u;
    }
  }
  if (typeof ubicacion === 'string' && ubicacion.trim()) {
    return ubicacion.trim();
  }
  return UBICACION_DEFAULT_CUSCO;
}

export function parseAdisoApiError(payload: unknown): string {
  if (!payload || typeof payload !== 'object') {
    return 'No se pudo publicar el adiso. Intenta de nuevo.';
  }

  const data = payload as {
    error?: string;
    message?: string;
    details?: Array<{ message?: string; path?: string }>;
  };

  if (Array.isArray(data.details) && data.details.length > 0) {
    const msgs = data.details
      .map((d) => {
        const field = d.path ? `${d.path}: ` : '';
        return `${field}${d.message || 'dato inválido'}`;
      })
      .filter(Boolean);
    if (msgs.length > 0) return msgs.join(' · ');
  }

  if (data.message && data.message !== 'Invalid input') {
    return data.message;
  }

  if (data.error) {
    return data.error;
  }

  return 'No se pudo publicar el adiso. Intenta de nuevo.';
}

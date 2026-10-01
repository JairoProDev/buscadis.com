import type { UbicacionDetallada } from '@/types';

const CUSCO_DISTRITOS = [
  'Ccorca',
  'Poroy',
  'San Jerónimo',
  'San Jeronimo',
  'San Sebastián',
  'San Sebastian',
  'Santiago',
  'Saylla',
  'Wanchaq',
  'Cusco',
] as const;

const BARRIOS_Y_ZONAS = [
  'Saphy',
  'Magisterio',
  'Marcavalle',
  'Ticapata',
  'Huasao',
  'San Blas',
  'San Cristóbal',
  'San Cristobal',
  'Centro Histórico',
  'Centro Historico',
  'Santiago',
  'Wanchaq',
  'San Sebastián',
  'San Sebastian',
  'San Jerónimo',
  'San Jeronimo',
  'Urb',
  'Urb.',
  'Urb ',
] as const;

function norm(s: string): string {
  return s
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase();
}

/** Extrae ubicación útil desde el texto del aviso (Cusco y alrededores). */
export function parseUbicacionFromText(text: string): UbicacionDetallada {
  const t = text.replace(/\s+/g, ' ');
  const lower = norm(t);

  let distrito = '';
  for (const d of CUSCO_DISTRITOS) {
    if (lower.includes(norm(d))) {
      distrito = d === 'San Jeronimo' ? 'San Jerónimo' : d === 'San Sebastian' ? 'San Sebastián' : d;
      break;
    }
  }

  for (const zona of BARRIOS_Y_ZONAS) {
    const zn = norm(zona);
    if (zn.length < 4) continue;
    if (lower.includes(zn)) {
      if (!distrito || distrito === 'Cusco') {
        if (/wanchaq/i.test(zona)) distrito = 'Wanchaq';
        else if (/san sebast/i.test(zona)) distrito = 'San Sebastián';
        else if (/san jer/i.test(zona)) distrito = 'San Jerónimo';
        else if (/saphy|magisterio|centro hist/i.test(zona)) distrito = distrito || 'Cusco';
      }
      break;
    }
  }

  const urbMatch = t.match(/\b(?:Urb\.?|Urbanización)\s+([A-Za-zÁÉÍÓÚáéíóúñÑ\s]{3,40})/i);
  const direccion = urbMatch ? `Urb. ${urbMatch[1].trim()}` : undefined;

  if (!distrito) {
    return {
      pais: 'Perú',
      departamento: 'Cusco',
      provincia: 'Cusco',
      distrito: '',
    };
  }

  return {
    pais: 'Perú',
    departamento: 'Cusco',
    provincia: 'Cusco',
    distrito,
    direccion,
  };
}

export function isGenericCuscoUbicacion(ubicacion: UbicacionDetallada | undefined): boolean {
  if (!ubicacion) return true;
  const d = (ubicacion.distrito || '').trim().toLowerCase();
  const dep = (ubicacion.departamento || '').trim().toLowerCase();
  return (!d || d === 'cusco') && dep === 'cusco' && !ubicacion.direccion?.trim();
}

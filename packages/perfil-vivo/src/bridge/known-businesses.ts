import type { Arquetipo } from '../types';

export type KnownBusinessOverride = {
  arquetipo: Arquetipo;
  categoria: { id: string; nombre: string };
  ubicacion?: {
    direccion: string;
    distrito: string;
    provincia: string;
    departamento: string;
    lat: number;
    lng: number;
    mostrarDireccionExacta: boolean;
    referencia?: string;
  };
  eslogan?: string;
  /** Si true, plan Max en demos internos no aplica; solo flag de módulos ricos */
  preferMetricas?: boolean;
};

/**
 * Flagship reales — enriquecimiento de bridge (ubicación/arquetipo) sin migración de columnas.
 */
export const KNOWN_BUSINESSES: Record<string, KnownBusinessOverride> = {
  quival: {
    arquetipo: 'retail',
    categoria: { id: 'ferreteria', nombre: 'Ferretería / distribución' },
    eslogan: 'Distribuidora de ferretería por mayor',
    ubicacion: {
      direccion: 'Vía Auxiliar de Evitamiento',
      distrito: 'Wanchaq',
      provincia: 'Cusco',
      departamento: 'Cusco',
      lat: -13.522,
      lng: -71.967,
      mostrarDireccionExacta: true,
      referencia: 'Cusco',
    },
  },
  villachaco: {
    arquetipo: 'comida',
    categoria: { id: 'alimentos', nombre: 'Chocolate y café' },
    eslogan: 'Sabores que nacen de la tierra',
    ubicacion: {
      direccion: 'Echarate, La Convención',
      distrito: 'Echarate',
      provincia: 'La Convención',
      departamento: 'Cusco',
      lat: -12.767,
      lng: -72.708,
      mostrarDireccionExacta: true,
      referencia: 'Quillabamba / La Convención',
    },
  },
  agrilsur: {
    arquetipo: 'retail',
    categoria: { id: 'bebidas', nombre: 'Destilería' },
    eslogan: 'Tradición y sabor en cada gota',
    ubicacion: {
      direccion: 'Sector Collana s/n',
      distrito: 'San Jerónimo',
      provincia: 'Cusco',
      departamento: 'Cusco',
      lat: -13.545,
      lng: -71.884,
      mostrarDireccionExacta: true,
      referencia: 'San Jerónimo, Cusco',
    },
  },
  cristalimag: {
    arquetipo: 'alto_ticket',
    categoria: { id: 'arquitectura', nombre: 'Vidrio y aluminio' },
    eslogan: 'Soluciones arquitectónicas en vidrio, aluminio y drywall',
    ubicacion: {
      direccion: '27 de Noviembre 500, cuadra 5 (esquina)',
      distrito: 'Cerro Colorado',
      provincia: 'Arequipa',
      departamento: 'Arequipa',
      lat: -16.379,
      lng: -71.567,
      mostrarDireccionExacta: true,
      referencia: 'Cerro Colorado, Arequipa',
    },
  },
  buscadis: {
    arquetipo: 'retail',
    categoria: { id: 'plataforma', nombre: 'Marketplace' },
    eslogan: 'Marketplace de ofertas y oportunidades',
    ubicacion: {
      direccion: 'Av. Javier Prado Este 4200',
      distrito: 'Santiago de Surco',
      provincia: 'Lima',
      departamento: 'Lima',
      lat: -12.1,
      lng: -76.97,
      mostrarDireccionExacta: true,
      referencia: 'Lima',
    },
  },
};

export function knownBusinessOverride(slug: string): KnownBusinessOverride | null {
  return KNOWN_BUSINESSES[slug.toLowerCase()] ?? null;
}

/** Normaliza WhatsApp PE a dígitos con 51. */
export function normalizeWhatsappPe(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  let digits = raw.replace(/\D/g, '');
  if (!digits) return undefined;
  if (digits.length === 9 && digits.startsWith('9')) digits = `51${digits}`;
  if (digits.length === 8) digits = `519${digits}`;
  return digits;
}

/** Parseo ligero de dirección libre → distrito/provincia (fallback Cusco). */
export function ubicacionFromAddress(address: string): {
  direccion: string;
  distrito: string;
  provincia: string;
  departamento: string;
  lat: number;
  lng: number;
  mostrarDireccionExacta: boolean;
} {
  const parts = address
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);
  const last = (parts[parts.length - 1] || '').replace(/\s*Perú\s*/i, '').trim();
  const prev = parts[parts.length - 2] || '';

  let departamento = 'Cusco';
  let provincia = 'Cusco';
  let distrito = 'Cusco';
  let lat = -13.52;
  let lng = -71.96;

  const blob = address.toLowerCase();
  if (blob.includes('arequipa')) {
    departamento = 'Arequipa';
    provincia = 'Arequipa';
    distrito = prev.includes('Cerro') ? 'Cerro Colorado' : prev || 'Arequipa';
    lat = -16.4;
    lng = -71.54;
  } else if (blob.includes('lima')) {
    departamento = 'Lima';
    provincia = 'Lima';
    distrito = prev || 'Lima';
    lat = -12.05;
    lng = -77.04;
  } else if (blob.includes('convención') || blob.includes('echarate') || blob.includes('quillabamba')) {
    departamento = 'Cusco';
    provincia = 'La Convención';
    distrito = blob.includes('echarate') ? 'Echarate' : 'Quillabamba';
    lat = -12.86;
    lng = -72.69;
  } else if (blob.includes('san jerónimo') || blob.includes('san jeronimo')) {
    distrito = 'San Jerónimo';
  } else if (blob.includes('wanchaq')) {
    distrito = 'Wanchaq';
  } else if (last && !/per[uú]/i.test(last)) {
    if (/cusco|arequipa|lima|puno|arequipa/i.test(last)) {
      departamento = last;
      provincia = last;
    } else {
      distrito = last;
    }
    if (prev && !/per[uú]/i.test(prev)) provincia = prev;
  }

  return {
    direccion: address,
    distrito,
    provincia,
    departamento,
    lat,
    lng,
    mostrarDireccionExacta: true,
  };
}

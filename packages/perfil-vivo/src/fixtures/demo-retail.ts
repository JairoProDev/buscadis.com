import type { Negocio } from '../types';
import { parseNegocio } from '../schemas';

const raw = {
  id: 'demo-retail-001',
  slug: 'demo',
  nombre: 'Ferretería Demo Quival',
  categoria: { id: 'ferreteria', nombre: 'Ferretería' },
  arquetipo: 'retail' as const,
  plan: 'free' as const,
  estado: 'activo' as const,
  identidad: {
    colorSemilla: '#1F4FD8',
    tema: 'claro' as const,
    formaCards: 'suave' as const,
  },
  contacto: {
    whatsapp: '+51999999001',
    telefono: '+51999999002',
    redes: [],
  },
  ubicacion: {
    direccion: 'Av. De la Cultura 123',
    distrito: 'Wanchaq',
    provincia: 'Cusco',
    departamento: 'Cusco',
    lat: -13.522,
    lng: -71.967,
    mostrarDireccionExacta: true,
  },
  verificacion: { nivel: 1 as const },
  metricasDeclaradas: [],
  modulos: [
    { tipo: 'hero' as const, visible: true, orden: 0 },
    { tipo: 'metricas' as const, visible: true, orden: 1 },
    { tipo: 'estado' as const, visible: true, orden: 2 },
    { tipo: 'acciones' as const, visible: true, orden: 3 },
    { tipo: 'catalogo' as const, visible: true, orden: 4 },
  ],
  conteos: { productos: 0, resenas: 0, fotosGaleria: 0 },
  creadoEn: '2026-07-01T12:00:00.000Z',
  actualizadoEn: '2026-08-08T12:00:00.000Z',
};

/** Fixture Retail vacío — catálogo se omite por minDatos. */
export const DEMO_RETAIL_NEGOCIO: Negocio = parseNegocio(raw);

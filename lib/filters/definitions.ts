import { Categoria } from '@/types';
import { FilterDefinition } from './types';

export const UNIVERSAL_FILTERS: FilterDefinition[] = [
  {
    id: 'precio',
    label: 'Precio (S/)',
    type: 'price-range',
    group: 'General',
  },
  {
    id: 'soloConPrecio',
    label: 'Solo con precio publicado',
    type: 'toggle',
    group: 'General',
  },
  {
    id: 'conFotos',
    label: 'Solo con fotos',
    type: 'toggle',
    group: 'General',
  },
  {
    id: 'publicadoEn',
    label: 'Publicado',
    type: 'select',
    group: 'General',
    options: [
      { value: '24h', label: 'Últimas 24 horas' },
      { value: '7d', label: 'Última semana' },
      { value: '30d', label: 'Último mes' },
    ],
  },
  {
    id: 'verificado',
    label: 'Anunciante verificado',
    type: 'toggle',
    group: 'Confianza',
  },
  {
    id: 'destacado',
    label: 'Solo destacados',
    type: 'toggle',
    group: 'Confianza',
  },
  {
    id: 'ubicacion',
    label: 'Ubicación',
    type: 'ubicacion',
    group: 'Ubicación',
  },
  {
    id: 'incluirMasAnuncios',
    label: 'Incluir más anuncios del catálogo',
    type: 'toggle',
    group: 'General',
  },
];

const CATEGORY_FILTERS: Record<Categoria, FilterDefinition[]> = {
  empleos: [
    {
      id: 'empleos_modalidad',
      label: 'Modalidad',
      type: 'chips',
      categories: ['empleos'],
      group: 'Empleo',
      options: [
        { value: 'presencial', label: 'Presencial' },
        { value: 'remoto', label: 'Remoto' },
        { value: 'hibrido', label: 'Híbrido' },
      ],
      requiresCategory: true,
    },
    {
      id: 'empleos_jornada',
      label: 'Jornada',
      type: 'chips',
      categories: ['empleos'],
      group: 'Empleo',
      options: [
        { value: 'completo', label: 'Tiempo completo' },
        { value: 'medio', label: 'Medio tiempo' },
        { value: 'practicas', label: 'Prácticas' },
      ],
      requiresCategory: true,
    },
    {
      id: 'empleos_con_sueldo',
      label: 'Con sueldo indicado',
      type: 'toggle',
      categories: ['empleos'],
      group: 'Empleo',
      requiresCategory: true,
    },
  ],
  inmuebles: [
    {
      id: 'inmuebles_operacion',
      label: 'Operación',
      type: 'chips',
      categories: ['inmuebles'],
      group: 'Inmueble',
      options: [
        { value: 'venta', label: 'Venta' },
        { value: 'alquiler', label: 'Alquiler' },
      ],
      requiresCategory: true,
    },
    {
      id: 'inmuebles_tipo',
      label: 'Tipo',
      type: 'chips',
      categories: ['inmuebles'],
      group: 'Inmueble',
      options: [
        { value: 'casa', label: 'Casa' },
        { value: 'departamento', label: 'Departamento' },
        { value: 'local', label: 'Local' },
        { value: 'terreno', label: 'Terreno' },
      ],
      requiresCategory: true,
    },
  ],
  vehiculos: [
    {
      id: 'vehiculos_tipo',
      label: 'Tipo de vehículo',
      type: 'chips',
      categories: ['vehiculos'],
      group: 'Vehículo',
      options: [
        { value: 'auto', label: 'Auto' },
        { value: 'moto', label: 'Moto' },
        { value: 'camioneta', label: 'Camioneta' },
      ],
      requiresCategory: true,
    },
  ],
  servicios: [
    {
      id: 'servicios_modalidad',
      label: 'Atención',
      type: 'chips',
      categories: ['servicios'],
      group: 'Servicio',
      options: [
        { value: 'domicilio', label: 'A domicilio' },
        { value: 'local', label: 'En local' },
      ],
      requiresCategory: true,
    },
  ],
  productos: [
    {
      id: 'productos_condicion',
      label: 'Condición',
      type: 'chips',
      categories: ['productos'],
      group: 'Producto',
      options: [
        { value: 'nuevo', label: 'Nuevo' },
        { value: 'usado', label: 'Usado' },
      ],
      requiresCategory: true,
    },
    {
      id: 'productos_entrega',
      label: 'Con entrega',
      type: 'toggle',
      categories: ['productos'],
      group: 'Producto',
      requiresCategory: true,
    },
  ],
  eventos: [
    {
      id: 'eventos_tipo',
      label: 'Entrada',
      type: 'chips',
      categories: ['eventos'],
      group: 'Evento',
      options: [
        { value: 'gratis', label: 'Gratis' },
        { value: 'pago', label: 'Con costo' },
      ],
      requiresCategory: true,
    },
  ],
  negocios: [
    {
      id: 'negocios_rubro',
      label: 'Rubro',
      type: 'chips',
      categories: ['negocios'],
      group: 'Negocio',
      options: [
        { value: 'gastronomia', label: 'Gastronomía' },
        { value: 'salud', label: 'Salud' },
        { value: 'retail', label: 'Comercio' },
        { value: 'servicios', label: 'Servicios' },
      ],
      requiresCategory: true,
    },
  ],
  comunidad: [
    {
      id: 'comunidad_tipo',
      label: 'Tipo',
      type: 'chips',
      categories: ['comunidad'],
      group: 'Comunidad',
      options: [
        { value: 'trueque', label: 'Trueque' },
        { value: 'donacion', label: 'Donación' },
        { value: 'grupo', label: 'Grupo' },
      ],
      requiresCategory: true,
    },
  ],
};

export function getFiltersForCategory(categoria: Categoria | 'todos'): FilterDefinition[] {
  const universal = UNIVERSAL_FILTERS.filter((f) => f.id !== 'incluirMasAnuncios' || categoria !== 'todos');
  if (categoria === 'todos') {
    return universal.filter((f) => !f.requiresCategory);
  }
  return [...universal, ...(CATEGORY_FILTERS[categoria] ?? [])];
}

export function getFilterDefinition(id: string, categoria: Categoria | 'todos'): FilterDefinition | undefined {
  return getFiltersForCategory(categoria).find((f) => f.id === id);
}

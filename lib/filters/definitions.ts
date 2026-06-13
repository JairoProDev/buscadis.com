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
    label: 'Precio publicado',
    type: 'tri-toggle',
    group: 'General',
    options: [
      { value: 'con', label: 'Con precio' },
      { value: 'sin', label: 'Sin precio' },
    ],
  },
  {
    id: 'conFotos',
    label: 'Fotos',
    type: 'tri-toggle',
    group: 'General',
    options: [
      { value: 'con', label: 'Con fotos' },
      { value: 'sin', label: 'Sin fotos' },
    ],
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
      id: 'empleos_experiencia',
      label: 'Experiencia',
      type: 'chips',
      categories: ['empleos'],
      group: 'Empleo',
      options: [
        { value: 'sin_experiencia', label: 'Sin experiencia' },
        { value: 'junior', label: 'Junior (1-2 años)' },
        { value: 'pleno', label: 'Semi-Senior (3-5 años)' },
        { value: 'senior', label: 'Senior (5+ años)' },
      ],
      requiresCategory: true,
    },
    {
      id: 'empleos_educacion',
      label: 'Educación',
      type: 'chips',
      categories: ['empleos'],
      group: 'Empleo',
      options: [
        { value: 'secundaria', label: 'Secundaria completa' },
        { value: 'tecnico', label: 'Estudios Técnicos' },
        { value: 'universitario', label: 'Estudios Universitarios' },
        { value: 'postgrado', label: 'Postgrado / MBA' },
      ],
      requiresCategory: true,
    },
    {
      id: 'empleos_contrato',
      label: 'Contrato',
      type: 'chips',
      categories: ['empleos'],
      group: 'Empleo',
      options: [
        { value: 'planilla', label: 'Planilla / Indefinido' },
        { value: 'temporal', label: 'Temporal / Contrato' },
        { value: 'freelance', label: 'Freelance / Proyectos' },
        { value: 'practicas', label: 'Prácticas / Pasantía' },
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
    {
      id: 'inmuebles_habitaciones',
      label: 'Habitaciones',
      type: 'chips',
      categories: ['inmuebles'],
      group: 'Inmueble',
      options: [
        { value: '1', label: '1 Habitación' },
        { value: '2', label: '2 Habitaciones' },
        { value: '3plus', label: '3+ Habitaciones' },
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
    {
      id: 'vehiculos_condicion',
      label: 'Condición',
      type: 'chips',
      categories: ['vehiculos'],
      group: 'Vehículo',
      options: [
        { value: 'nuevo', label: 'Nuevo' },
        { value: 'usado', label: 'Usado' },
      ],
      requiresCategory: true,
    },
    {
      id: 'vehiculos_combustible',
      label: 'Combustible',
      type: 'chips',
      categories: ['vehiculos'],
      group: 'Vehículo',
      options: [
        { value: 'gasolina', label: 'Gasolina' },
        { value: 'diesel', label: 'Diésel' },
        { value: 'gnv_glp', label: 'GNV / GLP' },
        { value: 'electrico_hibrido', label: 'Eléctrico / Híbrido' },
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
    {
      id: 'servicios_tipo',
      label: 'Tipo de Servicio',
      type: 'chips',
      categories: ['servicios'],
      group: 'Servicio',
      options: [
        { value: 'hogar', label: 'Hogar (Limpieza/Gasfitería)' },
        { value: 'tecnico', label: 'Técnico / Soporte' },
        { value: 'salud_estetica', label: 'Salud / Estética' },
        { value: 'clases', label: 'Clases / Tutorías' },
        { value: 'transporte', label: 'Transporte / Mudanzas' },
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
      id: 'productos_categoria',
      label: 'Categoría de Producto',
      type: 'chips',
      categories: ['productos'],
      group: 'Producto',
      options: [
        { value: 'tecnologia', label: 'Tecnología' },
        { value: 'ropa', label: 'Ropa y Calzado' },
        { value: 'hogar', label: 'Hogar y Muebles' },
        { value: 'entretenimiento', label: 'Libros y Juegos' },
        { value: 'deportes', label: 'Deportes' },
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
    {
      id: 'eventos_categoria',
      label: 'Tipo de Evento',
      type: 'chips',
      categories: ['eventos'],
      group: 'Evento',
      options: [
        { value: 'concierto', label: 'Concierto / Música' },
        { value: 'conferencia', label: 'Charla / Taller' },
        { value: 'deportivo', label: 'Deportivo' },
        { value: 'cultural', label: 'Teatro / Arte' },
        { value: 'fiesta', label: 'Fiesta / Social' },
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
        { value: 'tecnologia', label: 'Tecnología' },
        { value: 'construccion', label: 'Construcción' },
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
        { value: 'grupo', label: 'Grupo / Club' },
        { value: 'ayuda', label: 'Ayuda Social' },
        { value: 'mascotas', label: 'Mascotas' },
      ],
      requiresCategory: true,
    },
  ],
};

export function getFiltersForCategory(categoria: Categoria | 'todos'): FilterDefinition[] {
  if (categoria === 'todos') {
    return UNIVERSAL_FILTERS.filter((f) => !f.requiresCategory);
  }
  return [...UNIVERSAL_FILTERS, ...(CATEGORY_FILTERS[categoria] ?? [])];
}

export function getFilterDefinition(id: string, categoria: Categoria | 'todos'): FilterDefinition | undefined {
  return getFiltersForCategory(categoria).find((f) => f.id === id);
}

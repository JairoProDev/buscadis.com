import { Categoria } from '@/types';

export type PublishFieldType =
  | 'text'
  | 'number'
  | 'select'
  | 'chips'
  | 'toggle'
  | 'price'
  | 'ubicacion';

export interface PublishFieldOption {
  value: string;
  label: string;
}

export interface PublishFieldDefinition {
  id: string;
  label: string;
  type: PublishFieldType;
  options?: PublishFieldOption[];
  placeholder?: string;
  group?: string;
}

export interface CategoryNode {
  id: string;
  label: string;
  children?: CategoryNode[];
  publishFields?: PublishFieldDefinition[];
}

export const CATEGORY_TREE: Record<Categoria, CategoryNode> = {
  inmuebles: {
    id: 'inmuebles',
    label: 'Inmuebles',
    children: [
      { id: 'habitaciones', label: 'Habitaciones' },
      { id: 'apartamentos', label: 'Apartamentos' },
      { id: 'casas', label: 'Casas' },
      { id: 'terrenos', label: 'Terrenos' },
      { id: 'locales', label: 'Locales' },
      { id: 'oficinas', label: 'Oficinas' },
      { id: 'almacenes', label: 'Almacenes' },
      { id: 'edificios', label: 'Edificios' },
    ],
    publishFields: [
      {
        id: 'inmuebles_operacion',
        label: 'Operación',
        type: 'chips',
        group: 'Inmueble',
        options: [
          { value: 'venta', label: 'Venta' },
          { value: 'alquiler', label: 'Alquiler' },
        ],
      },
      {
        id: 'inmuebles_habitaciones',
        label: 'Habitaciones',
        type: 'chips',
        group: 'Inmueble',
        options: [
          { value: '1', label: '1' },
          { value: '2', label: '2' },
          { value: '3plus', label: '3+' },
        ],
      },
      {
        id: 'inmuebles_area',
        label: 'Área (m²)',
        type: 'number',
        group: 'Inmueble',
        placeholder: 'Ej. 80',
      },
    ],
  },
  vehiculos: {
    id: 'vehiculos',
    label: 'Vehículos',
    children: [
      { id: 'bicicletas', label: 'Bicicletas' },
      { id: 'motos', label: 'Motos' },
      { id: 'autos', label: 'Autos' },
      { id: 'camionetas', label: 'Camionetas' },
      { id: 'buses', label: 'Buses' },
      { id: 'camiones', label: 'Camiones' },
      { id: 'maquinaria', label: 'Maquinaria' },
    ],
    publishFields: [
      {
        id: 'vehiculos_condicion',
        label: 'Condición',
        type: 'chips',
        group: 'Vehículo',
        options: [
          { value: 'nuevo', label: 'Nuevo' },
          { value: 'usado', label: 'Usado' },
        ],
      },
      {
        id: 'vehiculos_combustible',
        label: 'Combustible',
        type: 'chips',
        group: 'Vehículo',
        options: [
          { value: 'gasolina', label: 'Gasolina' },
          { value: 'diesel', label: 'Diésel' },
          { value: 'gnv_glp', label: 'GNV / GLP' },
          { value: 'electrico_hibrido', label: 'Eléctrico / Híbrido' },
        ],
      },
      {
        id: 'vehiculos_anio',
        label: 'Año',
        type: 'number',
        group: 'Vehículo',
        placeholder: 'Ej. 2020',
      },
      {
        id: 'vehiculos_km',
        label: 'Kilometraje',
        type: 'number',
        group: 'Vehículo',
        placeholder: 'Ej. 45000',
      },
    ],
  },
  empleos: {
    id: 'empleos',
    label: 'Empleos',
    children: [
      { id: 'tiempo_completo', label: 'Tiempo completo' },
      { id: 'medio_tiempo', label: 'Medio tiempo' },
      { id: 'practicas', label: 'Prácticas' },
      { id: 'freelance', label: 'Freelance' },
      { id: 'temporal', label: 'Temporal' },
    ],
    publishFields: [
      {
        id: 'empleos_modalidad',
        label: 'Modalidad',
        type: 'chips',
        group: 'Empleo',
        options: [
          { value: 'presencial', label: 'Presencial' },
          { value: 'remoto', label: 'Remoto' },
          { value: 'hibrido', label: 'Híbrido' },
        ],
      },
      {
        id: 'empleos_jornada',
        label: 'Jornada',
        type: 'chips',
        group: 'Empleo',
        options: [
          { value: 'completo', label: 'Tiempo completo' },
          { value: 'medio', label: 'Medio tiempo' },
          { value: 'practicas', label: 'Prácticas' },
        ],
      },
      {
        id: 'empleos_sueldo',
        label: 'Sueldo (S/)',
        type: 'number',
        group: 'Empleo',
        placeholder: 'Ej. 1500',
      },
    ],
  },
  servicios: {
    id: 'servicios',
    label: 'Servicios',
    children: [
      { id: 'hogar', label: 'Hogar' },
      { id: 'tecnico', label: 'Técnico / Soporte' },
      { id: 'salud_estetica', label: 'Salud / Estética' },
      { id: 'clases', label: 'Clases / Tutorías' },
      { id: 'transporte', label: 'Transporte / Mudanzas' },
      { id: 'profesional', label: 'Profesional' },
    ],
    publishFields: [
      {
        id: 'servicios_modalidad',
        label: 'Atención',
        type: 'chips',
        group: 'Servicio',
        options: [
          { value: 'domicilio', label: 'A domicilio' },
          { value: 'local', label: 'En local' },
        ],
      },
    ],
  },
  productos: {
    id: 'productos',
    label: 'Productos',
    children: [
      { id: 'tecnologia', label: 'Tecnología' },
      { id: 'ropa', label: 'Ropa y calzado' },
      { id: 'hogar', label: 'Hogar y muebles' },
      { id: 'entretenimiento', label: 'Libros y juegos' },
      { id: 'deportes', label: 'Deportes' },
      { id: 'alimentos', label: 'Alimentos y bebidas' },
    ],
    publishFields: [
      {
        id: 'productos_condicion',
        label: 'Condición',
        type: 'chips',
        group: 'Producto',
        options: [
          { value: 'nuevo', label: 'Nuevo' },
          { value: 'usado', label: 'Usado' },
        ],
      },
      {
        id: 'productos_entrega',
        label: 'Con entrega',
        type: 'toggle',
        group: 'Producto',
      },
    ],
  },
  eventos: {
    id: 'eventos',
    label: 'Eventos',
    children: [
      { id: 'concierto', label: 'Concierto / Música' },
      { id: 'conferencia', label: 'Charla / Taller' },
      { id: 'deportivo', label: 'Deportivo' },
      { id: 'cultural', label: 'Teatro / Arte' },
      { id: 'fiesta', label: 'Fiesta / Social' },
    ],
    publishFields: [
      {
        id: 'eventos_tipo',
        label: 'Entrada',
        type: 'chips',
        group: 'Evento',
        options: [
          { value: 'gratis', label: 'Gratis' },
          { value: 'pago', label: 'Con costo' },
        ],
      },
      {
        id: 'eventos_fecha',
        label: 'Fecha del evento',
        type: 'text',
        group: 'Evento',
        placeholder: 'Ej. 15 de julio',
      },
    ],
  },
  negocios: {
    id: 'negocios',
    label: 'Negocios',
    children: [
      { id: 'gastronomia', label: 'Gastronomía' },
      { id: 'salud', label: 'Salud' },
      { id: 'retail', label: 'Comercio' },
      { id: 'servicios', label: 'Servicios' },
      { id: 'tecnologia', label: 'Tecnología' },
      { id: 'construccion', label: 'Construcción' },
    ],
    publishFields: [
      {
        id: 'negocios_rubro',
        label: 'Rubro',
        type: 'chips',
        group: 'Negocio',
        options: [
          { value: 'gastronomia', label: 'Gastronomía' },
          { value: 'salud', label: 'Salud' },
          { value: 'retail', label: 'Comercio' },
          { value: 'servicios', label: 'Servicios' },
        ],
      },
    ],
  },
  comunidad: {
    id: 'comunidad',
    label: 'Comunidad',
    children: [
      { id: 'trueque', label: 'Trueque' },
      { id: 'donacion', label: 'Donación' },
      { id: 'grupo', label: 'Grupo / Club' },
      { id: 'ayuda', label: 'Ayuda social' },
      { id: 'mascotas', label: 'Mascotas' },
    ],
    publishFields: [
      {
        id: 'comunidad_tipo',
        label: 'Tipo',
        type: 'chips',
        group: 'Comunidad',
        options: [
          { value: 'trueque', label: 'Trueque' },
          { value: 'donacion', label: 'Donación' },
          { value: 'grupo', label: 'Grupo / Club' },
          { value: 'ayuda', label: 'Ayuda Social' },
        ],
      },
    ],
  },
};

export const PUBLISH_CATEGORIAS = Object.values(CATEGORY_TREE).map((c) => ({
  value: c.id as Categoria,
  label: c.label,
}));

export function getCategoryNode(categoria: Categoria): CategoryNode {
  return CATEGORY_TREE[categoria];
}

export function getSubcategories(categoria: Categoria): CategoryNode[] {
  return CATEGORY_TREE[categoria]?.children ?? [];
}

export function getSubsubcategories(categoria: Categoria, subcategoria: string): CategoryNode[] {
  const sub = getSubcategories(categoria).find((s) => s.id === subcategoria);
  return sub?.children ?? [];
}

export function getPublishFieldsForCategory(
  categoria?: Categoria,
  subcategoria?: string
): PublishFieldDefinition[] {
  if (!categoria) return [];
  const node = CATEGORY_TREE[categoria];
  const base = node?.publishFields ?? [];
  const sub = node?.children?.find((s) => s.id === subcategoria);
  const subFields = sub?.publishFields ?? [];
  return [...base, ...subFields];
}

export function inferSubcategoryFromText(categoria: Categoria, text: string): string | undefined {
  const t = text.toLowerCase();
  const subs = getSubcategories(categoria);
  for (const sub of subs) {
    if (t.includes(sub.label.toLowerCase()) || t.includes(sub.id.replace(/_/g, ' '))) {
      return sub.id;
    }
  }
  const keywordMap: Partial<Record<Categoria, Record<string, string>>> = {
    inmuebles: {
      habitacion: 'habitaciones',
      departamento: 'apartamentos',
      casa: 'casas',
      terreno: 'terrenos',
      local: 'locales',
      oficina: 'oficinas',
    },
    vehiculos: {
      moto: 'motos',
      auto: 'autos',
      carro: 'autos',
      camioneta: 'camionetas',
      bus: 'buses',
      camion: 'camiones',
      bicicleta: 'bicicletas',
    },
    empleos: {
      'tiempo completo': 'tiempo_completo',
      'medio tiempo': 'medio_tiempo',
      practica: 'practicas',
      freelance: 'freelance',
    },
  };
  const map = keywordMap[categoria];
  if (!map) return undefined;
  for (const [kw, id] of Object.entries(map)) {
    if (t.includes(kw)) return id;
  }
  return undefined;
}

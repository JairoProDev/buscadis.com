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
  const extra = subcategoria ? SUBCATEGORY_FIELDS[`${categoria}:${subcategoria}`] ?? [] : [];
  return [...base, ...subFields, ...extra];
}

const chip = (id: string, label: string, group: string, options: PublishFieldOption[]): PublishFieldDefinition => ({
  id, label, type: 'chips', group, options,
});
const num = (id: string, label: string, group: string, placeholder: string): PublishFieldDefinition => ({
  id, label, type: 'number', group, placeholder,
});
const toggle = (id: string, label: string, group: string): PublishFieldDefinition => ({
  id, label, type: 'toggle', group,
});

/** Campos que cambian dentro de la misma categoría. */
export const SUBCATEGORY_FIELDS: Record<string, PublishFieldDefinition[]> = {
  'inmuebles:habitaciones': [
    toggle('hab_amoblado', 'Amoblado', 'Habitación'),
    toggle('hab_bano_privado', 'Baño privado', 'Habitación'),
    chip('hab_servicios', 'Servicios', 'Habitación', [
      { value: 'wifi', label: 'Wifi' },
      { value: 'agua_luz', label: 'Agua y luz' },
      { value: 'cocina', label: 'Cocina' },
    ]),
  ],
  'inmuebles:apartamentos': [
    num('apto_dormitorios', 'Dormitorios', 'Apartamento', 'Ej. 2'),
    num('apto_banos', 'Baños', 'Apartamento', 'Ej. 1'),
    num('apto_area', 'Área (m²)', 'Apartamento', 'Ej. 70'),
    num('apto_piso', 'Piso', 'Apartamento', 'Ej. 4'),
    toggle('apto_estacionamiento', 'Estacionamiento', 'Apartamento'),
  ],
  'inmuebles:casas': [
    num('casa_dormitorios', 'Dormitorios', 'Casa', 'Ej. 3'),
    num('casa_banos', 'Baños', 'Casa', 'Ej. 2'),
    num('casa_area', 'Área (m²)', 'Casa', 'Ej. 140'),
    num('casa_pisos', 'Pisos', 'Casa', 'Ej. 2'),
    toggle('casa_patio', 'Patio o jardín', 'Casa'),
  ],
  'inmuebles:terrenos': [
    num('terreno_area', 'Área (m²)', 'Terreno', 'Ej. 200'),
    num('terreno_frente', 'Frente (m)', 'Terreno', 'Ej. 8'),
    chip('terreno_zona', 'Zonificación', 'Terreno', [
      { value: 'urbano', label: 'Urbano' },
      { value: 'rustico', label: 'Rústico' },
      { value: 'comercial', label: 'Comercial' },
    ]),
    chip('terreno_servicios', 'Servicios', 'Terreno', [
      { value: 'luz', label: 'Luz' },
      { value: 'agua', label: 'Agua' },
      { value: 'desague', label: 'Desagüe' },
    ]),
  ],
  'inmuebles:locales': [
    num('local_area', 'Área (m²)', 'Local', 'Ej. 40'),
    num('local_frente', 'Frente (m)', 'Local', 'Ej. 5'),
    num('local_banos', 'Baños', 'Local', 'Ej. 1'),
    chip('local_uso', 'Uso', 'Local', [
      { value: 'comercial', label: 'Comercial' },
      { value: 'deposito', label: 'Depósito' },
      { value: 'restaurante', label: 'Restaurante' },
    ]),
  ],
  'inmuebles:oficinas': [
    num('oficina_area', 'Área (m²)', 'Oficina', 'Ej. 35'),
    num('oficina_ambientes', 'Ambientes', 'Oficina', 'Ej. 2'),
    num('oficina_piso', 'Piso', 'Oficina', 'Ej. 6'),
    toggle('oficina_amoblada', 'Amoblada', 'Oficina'),
  ],
  'inmuebles:almacenes': [
    num('almacen_area', 'Área (m²)', 'Almacén', 'Ej. 300'),
    num('almacen_altura', 'Altura (m)', 'Almacén', 'Ej. 6'),
    toggle('almacen_camion', 'Acceso para camión', 'Almacén'),
  ],
  'inmuebles:edificios': [
    num('edificio_area', 'Área de terreno (m²)', 'Edificio', 'Ej. 250'),
    num('edificio_pisos', 'Pisos', 'Edificio', 'Ej. 5'),
    num('edificio_unidades', 'Unidades', 'Edificio', 'Ej. 8'),
  ],
  'vehiculos:bicicletas': [
    chip('bici_tipo', 'Tipo', 'Bicicleta', [
      { value: 'urbana', label: 'Urbana' },
      { value: 'montana', label: 'Montaña' },
      { value: 'ruta', label: 'Ruta' },
    ]),
    num('bici_aro', 'Aro', 'Bicicleta', 'Ej. 29'),
  ],
  'vehiculos:motos': [
    num('moto_anio', 'Año', 'Moto', 'Ej. 2021'),
    num('moto_km', 'Kilometraje', 'Moto', 'Ej. 12000'),
    num('moto_cc', 'Cilindrada (cc)', 'Moto', 'Ej. 150'),
  ],
  'vehiculos:autos': [
    num('auto_anio', 'Año', 'Auto', 'Ej. 2019'),
    num('auto_km', 'Kilometraje', 'Auto', 'Ej. 45000'),
    chip('auto_combustible', 'Combustible', 'Auto', [
      { value: 'gasolina', label: 'Gasolina' },
      { value: 'diesel', label: 'Diésel' },
      { value: 'gnv', label: 'GNV / GLP' },
      { value: 'hibrido', label: 'Híbrido / Eléctrico' },
    ]),
    chip('auto_transmision', 'Transmisión', 'Auto', [
      { value: 'mecanica', label: 'Mecánica' },
      { value: 'automatica', label: 'Automática' },
    ]),
  ],
  'vehiculos:camionetas': [
    num('camioneta_anio', 'Año', 'Camioneta', 'Ej. 2018'),
    num('camioneta_km', 'Kilometraje', 'Camioneta', 'Ej. 80000'),
    chip('camioneta_traccion', 'Tracción', 'Camioneta', [
      { value: '4x2', label: '4x2' },
      { value: '4x4', label: '4x4' },
    ]),
  ],
  'vehiculos:buses': [
    num('bus_anio', 'Año', 'Bus', 'Ej. 2015'),
    num('bus_asientos', 'Asientos', 'Bus', 'Ej. 30'),
  ],
  'vehiculos:camiones': [
    num('camion_anio', 'Año', 'Camión', 'Ej. 2016'),
    num('camion_carga', 'Carga (t)', 'Camión', 'Ej. 5'),
  ],
  'vehiculos:maquinaria': [
    num('maq_anio', 'Año', 'Maquinaria', 'Ej. 2014'),
    num('maq_horas', 'Horas de uso', 'Maquinaria', 'Ej. 2000'),
  ],
  'empleos:tiempo_completo': [num('empleo_sueldo', 'Sueldo (S/)', 'Empleo', 'Ej. 1800')],
  'empleos:medio_tiempo': [num('empleo_sueldo_mt', 'Sueldo (S/)', 'Empleo', 'Ej. 900')],
  'empleos:practicas': [
    toggle('practica_convenio', 'Con convenio', 'Práctica'),
    num('practica_propina', 'Propina o subvención (S/)', 'Práctica', 'Ej. 500'),
  ],
  'empleos:freelance': [num('free_tarifa', 'Tarifa (S/)', 'Freelance', 'Ej. 80')],
  'empleos:temporal': [
    num('temp_sueldo', 'Pago (S/)', 'Temporal', 'Ej. 1200'),
    num('temp_dias', 'Duración (días)', 'Temporal', 'Ej. 30'),
  ],
  'servicios:hogar': [chip('hogar_tipo', 'Trabajo', 'Hogar', [
    { value: 'limpieza', label: 'Limpieza' },
    { value: 'cocina', label: 'Cocina' },
    { value: 'cuidado', label: 'Cuidado' },
  ])],
  'servicios:tecnico': [chip('tec_esp', 'Especialidad', 'Técnico', [
    { value: 'electricidad', label: 'Electricidad' },
    { value: 'gasfiteria', label: 'Gasfitería' },
    { value: 'computadoras', label: 'Computadoras' },
  ])],
  'servicios:salud_estetica': [chip('salud_tipo', 'Atención', 'Salud', [
    { value: 'consulta', label: 'Consulta' },
    { value: 'estetica', label: 'Estética' },
  ])],
  'servicios:clases': [
    chip('clase_materia', 'Materia', 'Clases', [
      { value: 'escolares', label: 'Escolares' },
      { value: 'idiomas', label: 'Idiomas' },
      { value: 'musica', label: 'Música' },
    ]),
  ],
  'servicios:transporte': [chip('trans_tipo', 'Servicio', 'Transporte', [
    { value: 'taxi', label: 'Taxi' },
    { value: 'mudanza', label: 'Mudanza' },
    { value: 'carga', label: 'Carga' },
  ])],
  'servicios:profesional': [chip('prof_area', 'Área', 'Profesional', [
    { value: 'legal', label: 'Legal' },
    { value: 'contable', label: 'Contable' },
    { value: 'diseno', label: 'Diseño' },
  ])],
  'productos:tecnologia': [
    num('tec_garantia', 'Garantía (meses)', 'Tecnología', 'Ej. 6'),
  ],
  'productos:ropa': [chip('ropa_talla', 'Talla', 'Ropa', [
    { value: 's', label: 'S' },
    { value: 'm', label: 'M' },
    { value: 'l', label: 'L' },
    { value: 'xl', label: 'XL' },
  ])],
  'productos:alimentos': [toggle('alimento_perecible', 'Perecible', 'Alimentos')],
  'eventos:concierto': [num('evento_cupo', 'Cupo', 'Evento', 'Ej. 100')],
  'eventos:conferencia': [num('charla_horas', 'Duración (horas)', 'Evento', 'Ej. 2')],
  'eventos:fiesta': [num('fiesta_edad', 'Edad mínima', 'Evento', 'Ej. 18')],
  'comunidad:mascotas': [
    chip('mascota_especie', 'Especie', 'Mascota', [
      { value: 'perro', label: 'Perro' },
      { value: 'gato', label: 'Gato' },
      { value: 'otro', label: 'Otro' },
    ]),
  ],
  'comunidad:trueque': [
    chip('trueque_ofrece', 'Ofrece', 'Trueque', [
      { value: 'objeto', label: 'Un objeto' },
      { value: 'servicio', label: 'Un servicio' },
    ]),
  ],
};

export function categoryAsksLocation(categoria?: Categoria, subcategoria?: string, entrega?: boolean): boolean {
  if (!categoria) return false;
  if (categoria === 'productos') return Boolean(entrega);
  if (categoria === 'comunidad') return subcategoria === 'grupo' || subcategoria === 'ayuda' || subcategoria === 'mascotas';
  return true;
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

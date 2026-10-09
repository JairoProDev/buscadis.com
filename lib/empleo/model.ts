/** Aviso de empleo que se imprime, se comparte y se postula. Un puesto por aviso. */

export interface AvisoEmpleo {
  negocio: string;
  puesto: string;
  zona: string;
  pago: string;
  horario: string;
  requisitos: string[];
  beneficios: string[];
  whatsapp: string;
}

export const AVISO_VACIO: AvisoEmpleo = {
  negocio: '',
  puesto: '',
  zona: 'Cusco',
  pago: '',
  horario: '',
  requisitos: [],
  beneficios: [],
  whatsapp: '',
};

export const PRESETS: { id: string; nombre: string; aviso: AvisoEmpleo }[] = [
  {
    id: 'pucara',
    nombre: 'Pucará',
    aviso: {
      negocio: 'Restaurante Pucará',
      puesto: 'Ayudante de cocina',
      zona: 'Centro, Cusco',
      pago: 'S/ 1,725 + S/ 200 de movilidad y propina',
      horario: 'Día completo, 10:00 a cierre. Miércoles libre.',
      requisitos: ['Experiencia en cocina', 'DNI y ropa oscura'],
      beneficios: ['Alimentación', 'Extras pagados'],
      whatsapp: '940897397',
    },
  },
  {
    id: 'llama',
    nombre: 'Black Llama',
    aviso: {
      negocio: 'Black Llama Hostel',
      puesto: 'Cocinero',
      zona: 'Mesón de la Estrella, Cusco',
      pago: 'Planilla. El sueldo se acuerda en la entrevista.',
      horario: 'Full time',
      requisitos: ['Experiencia en el puesto', 'DNI'],
      beneficios: ['Planilla'],
      whatsapp: '912403101',
    },
  },
  {
    id: 'tambo',
    nombre: 'Tambobamba',
    aviso: {
      negocio: 'Chifa Tambobamba',
      puesto: 'Ayudante de cocina',
      zona: 'Tambobamba',
      pago: 'El sueldo se acuerda. Incluye pasajes.',
      horario: 'Cocina de chifa',
      requisitos: ['Experiencia en el puesto'],
      beneficios: ['Pasajes', 'Alimentación', 'Alojamiento'],
      whatsapp: '984271525',
    },
  },
];

export function lineas(texto: string): string[] {
  return texto
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 6);
}

export function telefonoValido(valor: string): string | null {
  const digits = valor.replace(/\D/g, '');
  const local = digits.startsWith('51') && digits.length === 11 ? digits.slice(2) : digits;
  return /^9\d{8}$/.test(local) ? local : null;
}

export function descripcionDe(aviso: AvisoEmpleo): string {
  const partes = [
    aviso.negocio,
    aviso.pago,
    aviso.horario,
    aviso.requisitos.length ? `Piden: ${aviso.requisitos.join(', ')}` : '',
    aviso.beneficios.length ? `Incluye: ${aviso.beneficios.join(', ')}` : '',
    'Postula con tu nombre y tu disponibilidad. No pedimos CV ni edad.',
  ].filter(Boolean);
  return partes.join('. ').slice(0, 1800);
}

export function textoGrupo(aviso: AvisoEmpleo, url: string): string {
  return [
    `${aviso.puesto} — ${aviso.negocio}`,
    aviso.zona,
    aviso.pago,
    aviso.horario,
    '',
    'Postula aquí (no llames al grupo):',
    url,
  ]
    .filter((l) => l !== undefined)
    .join('\n');
}

export function empleoDeAtributos(atributos: unknown): AvisoEmpleo | null {
  if (!atributos || typeof atributos !== 'object') return null;
  const raw = (atributos as { empleo?: Partial<AvisoEmpleo> }).empleo;
  if (!raw?.puesto || !raw.negocio) return null;
  return {
    negocio: String(raw.negocio),
    puesto: String(raw.puesto),
    zona: String(raw.zona || 'Cusco'),
    pago: String(raw.pago || ''),
    horario: String(raw.horario || ''),
    requisitos: Array.isArray(raw.requisitos) ? raw.requisitos.map(String).slice(0, 6) : [],
    beneficios: Array.isArray(raw.beneficios) ? raw.beneficios.map(String).slice(0, 6) : [],
    whatsapp: telefonoValido(String(raw.whatsapp || '')) || '',
  };
}

export type TurnoAviso = {
  id: string;
  nombre: string;
  pago: string;
  complemento: string;
  horario: string;
  detalle: string;
};

export type AvisoEmpleo = {
  negocio: string;
  rubro: string;
  zona: string;
  puesto: string;
  turnos: TurnoAviso[];
  condiciones: string[];
  presentarse: string;
  whatsapp: string;
  cubierta: boolean;
};

export const AVISO_STORAGE_KEY = 'buscadis-aviso-empleo-probar';

export const AVISO_PUCARA: AvisoEmpleo = {
  negocio: 'Restaurante Pucará',
  rubro: 'Cocina de local',
  zona: 'Amargura con Saphy, Cusco',
  puesto: 'Ayudante de cocina',
  turnos: [
    {
      id: 'dia',
      nombre: 'Día completo',
      pago: '1,725',
      complemento: 'S/ 200 de movilidad y propina',
      horario: '10:00 a.m. al cierre',
      detalle: 'El cierre ronda las 9:45 p.m.',
    },
    {
      id: 'tarde',
      nombre: 'Desde la tarde',
      pago: '600',
      complemento: 'S/ 100 de movilidad y propina',
      horario: '5:30 p.m. al cierre',
      detalle: 'La hora de entrada se conversa.',
    },
  ],
  condiciones: [
    'Horas extras pagadas al minuto',
    'Descanso los miércoles',
    'Alimentación en el local',
  ],
  presentarse: 'De 4:00 a 7:00 p.m., con DNI físico, en la esquina de Amargura con Saphy.',
  whatsapp: '940897397',
  cubierta: false,
};

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, '').slice(0, 9);
}

export function formatPhone(digits: string): string {
  const d = digitsOnly(digits);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`;
  return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
}

export function whatsappNumber(digits: string): string | null {
  const d = digitsOnly(digits);
  if (d.length !== 9 || !d.startsWith('9')) return null;
  return `51${d}`;
}

export function loadAviso(): AvisoEmpleo {
  if (typeof window === 'undefined') return AVISO_PUCARA;
  try {
    const raw = sessionStorage.getItem(AVISO_STORAGE_KEY);
    if (!raw) return AVISO_PUCARA;
    const parsed = JSON.parse(raw) as AvisoEmpleo;
    if (!parsed?.puesto || !Array.isArray(parsed.turnos)) return AVISO_PUCARA;
    return {
      ...AVISO_PUCARA,
      ...parsed,
      turnos: parsed.turnos.filter((t) => t.nombre.trim() || t.pago.trim()).slice(0, 2),
      condiciones: (parsed.condiciones || []).map((c) => c.trim()).filter(Boolean).slice(0, 4),
    };
  } catch {
    return AVISO_PUCARA;
  }
}

export function saveAviso(aviso: AvisoEmpleo) {
  sessionStorage.setItem(AVISO_STORAGE_KEY, JSON.stringify(aviso));
}

export type Hecho = 'si' | 'poco' | 'no';

export const HECHO_LABEL: Record<Hecho, string> = {
  si: 'Ya lo he hecho',
  poco: 'Lo he hecho un poco',
  no: 'Todavía no, y quiero aprender',
};

export type AvisoCerca = {
  id: string;
  puesto: string;
  negocio: string;
  zona: string;
  pago: string;
  horario: string;
};

export const AVISOS_CERCA: AvisoCerca[] = [
  {
    id: 'san-blas',
    puesto: 'Ayudante de barra',
    negocio: 'Cafetería en San Blas',
    zona: 'A una cuadra de la plazuela',
    pago: '1,350 + propina',
    horario: '8:00 a.m. a 4:30 p.m.',
  },
  {
    id: 'molino',
    puesto: 'Cajero',
    negocio: 'Bodega en El Molino',
    zona: 'Av. de la Cultura',
    pago: 'A conversar',
    horario: 'Turno tarde, lunes a sábado',
  },
];

export function fichaTexto(
  aviso: AvisoEmpleo,
  turno: TurnoAviso,
  ficha: { nombre: string; zona: string; hecho: Hecho },
) {
  return [
    `Hola, postulo desde Buscadis a ${aviso.puesto} en ${aviso.negocio}.`,
    `Horario: ${turno.nombre} (${turno.horario}).`,
    `Me llamo ${ficha.nombre.trim()}. Vengo de ${ficha.zona.trim()}.`,
    HECHO_LABEL[ficha.hecho] + '.',
  ].join('\n');
}

export function textoGrupo(aviso: AvisoEmpleo, url: string) {
  const pagos = aviso.turnos
    .map((t) => `${t.nombre}: S/ ${t.pago}`)
    .join(' · ');
  return [
    `Se busca ${aviso.puesto}`,
    `${aviso.negocio} · ${aviso.zona}`,
    pagos,
    'Postula por este enlace. No escribas solo “info”:',
    url,
  ].join('\n');
}

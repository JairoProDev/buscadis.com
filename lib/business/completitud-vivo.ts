/**
 * Completitud alineada a lo que el visitante ve en Perfil Vivo (/v).
 * §17: una sola siguiente tarea, formulada como beneficio.
 */
import type { BusinessProfile } from '@/types/business';

export type CompletitudCampoId =
  | 'nombre'
  | 'whatsapp'
  | 'logo'
  | 'ubicacion'
  | 'horario'
  | 'productos'
  | 'descripcion';

export interface CompletitudCampo {
  id: CompletitudCampoId;
  peso: number;
  listo: boolean;
  /** Copy corto del campo (interno) */
  etiqueta: string;
}

export interface SiguienteTarea {
  campoId: CompletitudCampoId;
  /** Beneficio visible al dueño — nunca jerga */
  beneficio: string;
  /** Hub / ruta sugerida */
  destino: 'identity' | 'trust' | 'content' | 'appearance' | 'catalogo';
}

export interface CompletitudVivo {
  score: number;
  campos: CompletitudCampo[];
  siguiente: SiguienteTarea | null;
}

const BENEFICIOS: Record<CompletitudCampoId, string> = {
  nombre: 'Ponle nombre a tu negocio → tus clientes te buscan más fácil',
  whatsapp:
    'Agrega tu WhatsApp → los perfiles con número reciben el doble de consultas',
  logo: 'Sube tu logo (o una foto del letrero) → te reconocen al instante',
  ubicacion: 'Indica dónde estás → te encuentran en el mapa y en Google',
  horario: 'Agrega tu horario → evitas mensajes de “¿están abiertos?”',
  productos:
    'Agrega 3 productos más → los perfiles con 10+ productos reciben el doble de consultas',
  descripcion:
    'Cuenta en dos líneas qué vendes → la gente confía más antes de escribirte',
};

const DESTINO: Record<CompletitudCampoId, SiguienteTarea['destino']> = {
  nombre: 'identity',
  descripcion: 'identity',
  ubicacion: 'identity',
  logo: 'appearance',
  productos: 'catalogo',
  whatsapp: 'trust',
  horario: 'trust',
};

/** Orden de prioridad de la siguiente tarea (impacto en conversión /v). */
const ORDEN: CompletitudCampoId[] = [
  'nombre',
  'whatsapp',
  'productos',
  'horario',
  'logo',
  'ubicacion',
  'descripcion',
];

export function evaluarCompletitudVivo(
  profile: Partial<BusinessProfile>,
  productCount = 0
): CompletitudVivo {
  const hours = profile.business_hours;
  const hasHours = Boolean(hours && Object.keys(hours).length > 0);
  const openDays =
    hours &&
    Object.values(hours).some((d) => d && !d.closed && d.open && d.close);

  const campos: CompletitudCampo[] = [
    {
      id: 'nombre',
      etiqueta: 'Nombre',
      peso: 10,
      listo: Boolean(profile.name?.trim() && profile.name !== 'Mi negocio'),
    },
    {
      id: 'whatsapp',
      etiqueta: 'WhatsApp',
      peso: 20,
      listo: Boolean(profile.contact_whatsapp?.trim()),
    },
    {
      id: 'productos',
      etiqueta: 'Productos',
      peso: 25,
      listo: productCount >= 3,
    },
    {
      id: 'horario',
      etiqueta: 'Horario',
      peso: 15,
      listo: Boolean(hasHours && openDays),
    },
    {
      id: 'logo',
      etiqueta: 'Logo',
      peso: 12,
      listo: Boolean(profile.logo_url),
    },
    {
      id: 'ubicacion',
      etiqueta: 'Ubicación',
      peso: 10,
      listo: Boolean(profile.contact_address?.trim()),
    },
    {
      id: 'descripcion',
      etiqueta: 'Descripción',
      peso: 8,
      listo: (profile.description?.trim().length ?? 0) >= 20,
    },
  ];

  const total = campos.reduce((s, c) => s + c.peso, 0);
  const done = campos.reduce((s, c) => s + (c.listo ? c.peso : 0), 0);
  const score = Math.round((done / total) * 100);

  const porId = Object.fromEntries(campos.map((c) => [c.id, c])) as Record<
    CompletitudCampoId,
    CompletitudCampo
  >;

  let siguiente: SiguienteTarea | null = null;

  // Productos: si hay algunos pero &lt;10, priorizar “3 más” cuando ya hay WA
  if (productCount >= 1 && productCount < 10 && porId.whatsapp.listo) {
    siguiente = {
      campoId: 'productos',
      beneficio: BENEFICIOS.productos,
      destino: 'catalogo',
    };
  } else {
    for (const id of ORDEN) {
      if (!porId[id].listo) {
        siguiente = {
          campoId: id,
          beneficio: BENEFICIOS[id],
          destino: DESTINO[id],
        };
        break;
      }
    }
  }

  // Si ya hay 3+ pero &lt;10, empujar catálogo
  if (
    siguiente &&
    siguiente.campoId !== 'productos' &&
    productCount >= 3 &&
    productCount < 10 &&
    porId.whatsapp.listo &&
    porId.horario.listo
  ) {
    siguiente = {
      campoId: 'productos',
      beneficio: BENEFICIOS.productos,
      destino: 'catalogo',
    };
  }

  if (score >= 100) siguiente = null;

  return { score, campos, siguiente };
}

export function presetHorario(
  kind: 'lun_sab_8_18' | 'todos_8_18' | 'lun_vie_9_18'
): NonNullable<BusinessProfile['business_hours']> {
  const days =
    kind === 'todos_8_18'
      ? ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      : kind === 'lun_vie_9_18'
        ? ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
        : ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

  const open = kind === 'lun_vie_9_18' ? '09:00' : '08:00';
  const close = '18:00';
  const all = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
  ];
  const hours: NonNullable<BusinessProfile['business_hours']> = {};
  for (const d of all) {
    const on = days.includes(d);
    hours[d] = { open, close, closed: !on };
  }
  return hours;
}

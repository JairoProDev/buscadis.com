import { Categoria } from '@/types';

export type PublishChatStepId =
  | 'categoria'
  | 'titulo'
  | 'descripcion'
  | 'precio'
  | 'ubicacion'
  | 'contacto'
  | 'foto';

export interface PublishChatDraft {
  categoria: Categoria;
  titulo: string;
  descripcion: string;
  precio: string;
  ubicacion: string;
  contacto: string;
  imageUrl?: string;
}

export const CATEGORIA_OPTIONS: { value: Categoria; label: string }[] = [
  { value: 'empleos', label: 'Empleos' },
  { value: 'inmuebles', label: 'Inmuebles' },
  { value: 'vehiculos', label: 'Vehículos' },
  { value: 'servicios', label: 'Servicios' },
  { value: 'productos', label: 'Productos' },
  { value: 'eventos', label: 'Eventos' },
  { value: 'negocios', label: 'Negocios' },
  { value: 'comunidad', label: 'Comunidad' },
];

export const PRECIO_OPTIONS = [
  { value: 'consultar', label: 'A consultar' },
  { value: 'negociable', label: 'Negociable' },
  { value: 'gratis', label: 'Gratis' },
  { value: 'skip', label: 'Omitir precio' },
];

export const STEP_ORDER: PublishChatStepId[] = [
  'categoria',
  'titulo',
  'descripcion',
  'precio',
  'ubicacion',
  'contacto',
  'foto',
];

export function botQuestion(step: PublishChatStepId): string {
  switch (step) {
    case 'categoria':
      return '¿En qué categoría encaja tu aviso?';
    case 'titulo':
      return '¿Cómo lo titularías en una frase corta?';
    case 'descripcion':
      return 'Cuéntame los detalles importantes: estado, características, horarios…';
    case 'precio':
      return '¿Cuál es el precio? Puedes omitirlo si prefieres.';
    case 'ubicacion':
      return '¿Dónde está o desde dónde lo ofreces?';
    case 'contacto':
      return '¿Qué WhatsApp usamos para que te contacten?';
    case 'foto':
      return '¿Quieres adjuntar una foto? (opcional)';
    default:
      return '';
  }
}

export function inferCategory(text: string): Categoria {
  const t = text.toLowerCase();
  if (/\b(alquil|depart|casa|terreno|inmueble|habitaci)/.test(t)) return 'inmuebles';
  if (/\b(auto|moto|carro|vehiculo|camioneta)/.test(t)) return 'vehiculos';
  if (/\b(empleo|trabajo|vacante|sueldo)/.test(t)) return 'empleos';
  if (/\b(servicio|repar|instal)/.test(t)) return 'servicios';
  if (/\b(evento|fiesta|entrada)/.test(t)) return 'eventos';
  if (/\b(negocio|local|empresa)/.test(t)) return 'negocios';
  if (/\b(comunidad|grupo|volunt)/.test(t)) return 'comunidad';
  return 'productos';
}

export function draftToPublishText(draft: PublishChatDraft): string {
  const parts = [draft.titulo, draft.descripcion];
  if (draft.precio && draft.precio !== 'skip') {
    const label =
      draft.precio === 'consultar'
        ? 'Precio a consultar'
        : draft.precio === 'negociable'
          ? 'Precio negociable'
          : draft.precio === 'gratis'
            ? 'Gratis'
            : `Precio: S/ ${draft.precio}`;
    parts.push(label);
  }
  if (draft.ubicacion) parts.push(`Ubicación: ${draft.ubicacion}`);
  return parts.filter(Boolean).join('. ');
}

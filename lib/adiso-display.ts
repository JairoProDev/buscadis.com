import { Adiso, Categoria, UbicacionDetallada } from '@/types';
import { pickCardSignal } from '@/lib/social-proof';

const CATEGORIA_LABELS: Record<Categoria, string> = {
  empleos: 'Empleos',
  inmuebles: 'Inmuebles',
  vehiculos: 'Vehículos',
  servicios: 'Servicios',
  productos: 'Productos',
  eventos: 'Eventos',
  negocios: 'Negocios',
  comunidad: 'Comunidad',
};

const CTA_LABELS: Record<Categoria, string> = {
  empleos: 'Consultar empleo',
  inmuebles: 'Agendar visita',
  vehiculos: 'Consultar vehículo',
  servicios: 'Solicitar servicio',
  productos: 'Consultar disponibilidad',
  eventos: 'Consultar evento',
  negocios: 'Contactar negocio',
  comunidad: 'Contactar por WhatsApp',
};

/** Etiqueta corta para CTA en overlay de la imagen del card (sin precio). */
const CARD_CTA_SHORT: Record<Categoria, string> = {
  empleos: 'Postular',
  inmuebles: 'Visitar',
  vehiculos: 'Consultar',
  servicios: 'Pedir info',
  productos: 'Consultar',
  eventos: 'Info',
  negocios: 'Contactar',
  comunidad: 'WhatsApp',
};

/*
 * Roadmap — señales y CTAs en card (no exponer al usuario aún):
 * - Precio en esquina inferior derecha de la imagen cuando exista.
 * - Sin precio: CTA de contacto directo (1 tap → WhatsApp) con color de categoría.
 * - CTAs distintos por categoría (CARD_CTA_SHORT / CTA_LABELS).
 * - Futuro: favorito entre buscadores, precio bajo promedio, últimas plazas,
 *   top en distrito, respuesta rápida medida, etc.
 */

/** Limpia descripciones rotas de importación (WhatsApp: ., ..) */
export function sanitizeAdisoDescripcion(descripcion: string | undefined | null): string {
  if (!descripcion) return '';
  let text = descripcion.trim();
  text = text.replace(/WhatsApp:\s*\.+/gi, '');
  text = text.replace(/\.\.{2,}/g, '.');
  text = text.replace(/\s+\./g, '.');
  text = text.replace(/\.\s*$/g, '');
  return text.trim();
}

/** Títulos en MAYÚSCULAS → formato legible */
export function toDisplayTitle(titulo: string): string {
  const t = titulo.trim();
  if (!t) return '';
  const letters = t.replace(/[^a-zA-ZáéíóúñÁÉÍÓÚÑ]/g, '');
  if (letters.length === 0) return t;
  const upperCount = (letters.match(/[A-ZÁÉÍÓÚÑ]/g) ?? []).length;
  if (upperCount / letters.length > 0.7) {
    return t
      .toLowerCase()
      .replace(/(^|\s|[(])\S/g, (c) => c.toUpperCase());
  }
  return t;
}

export function formatUbicacionCorta(ubicacion: Adiso['ubicacion']): string {
  if (!ubicacion) return '';
  if (typeof ubicacion === 'string') {
    const parts = ubicacion.split(',').map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 2) return `${parts[0]}, ${parts[1]}`;
    return ubicacion;
  }
  const u = ubicacion as UbicacionDetallada;
  const distrito = u.distrito?.trim();
  const depto = u.departamento?.trim();
  if (distrito && depto) return `${distrito}, ${depto}`;
  if (distrito) return distrito;
  if (depto) return depto;
  return u.provincia?.trim() || '';
}

export function getCategoriaLabel(categoria: Categoria): string {
  return CATEGORIA_LABELS[categoria] ?? categoria;
}

export function getCtaLabelPorCategoria(categoria: Categoria): string {
  return CTA_LABELS[categoria] ?? 'Contactar por WhatsApp';
}

export function getCardCtaShortLabel(categoria: Categoria): string {
  return CARD_CTA_SHORT[categoria] ?? 'Contactar';
}

export function adisoTieneImagen(adiso: Adiso): boolean {
  if (adiso.imagenUrl?.trim()) return true;
  return (adiso.imagenesUrls?.filter((u) => u?.trim()).length ?? 0) > 0;
}

export type SocialBadgeType = string;

export interface SocialBadge {
  type: SocialBadgeType;
  label: string;
}

/** Una sola señal social por card — delega a pickCardSignal */
export function pickSocialBadge(adiso: Adiso): SocialBadge | null {
  const signal = pickCardSignal(adiso);
  if (!signal) return null;
  return { type: signal.type, label: signal.label };
}

export function formatPrecioDisplay(adiso: Adiso): string | null {
  if (adiso.precio && typeof adiso.precio === 'number' && adiso.precio > 0) {
    return `S/ ${adiso.precio.toLocaleString('es-PE')}`;
  }
  if (adiso.tipoPrecio === 'a_convenir') return 'A convenir';
  return null;
}

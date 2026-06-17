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

const IN_APP_CTA_LABELS: Record<Categoria, string> = {
  empleos: 'Postular por chat',
  inmuebles: 'Agendar visita',
  vehiculos: 'Consultar vehículo',
  servicios: 'Solicitar cotización',
  productos: 'Preguntar disponibilidad',
  eventos: 'Consultar entradas',
  negocios: 'Escribir al negocio',
  comunidad: 'Enviar mensaje',
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

export function getInAppCtaLabelPorCategoria(categoria: Categoria): string {
  return IN_APP_CTA_LABELS[categoria] ?? 'Enviar mensaje';
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
    const suffix = adiso.categoria === 'empleos' ? '/mes' : '';
    return `S/ ${adiso.precio.toLocaleString('es-PE')}${suffix}`;
  }
  if (adiso.tipoPrecio === 'a_convenir') return 'A convenir';
  return null;
}

function getPublishedDate(adiso: Pick<Adiso, 'fechaPublicacion' | 'horaPublicacion'>): Date | null {
  if (!adiso.fechaPublicacion) return null;
  const iso = adiso.horaPublicacion
    ? `${adiso.fechaPublicacion}T${adiso.horaPublicacion}`
    : adiso.fechaPublicacion;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Tiempo relativo legible para cards (ej. "Hace 2 h", "Ayer") */
export function formatRelativePublishedAt(
  adiso: Pick<Adiso, 'fechaPublicacion' | 'horaPublicacion'>,
): string | null {
  const date = getPublishedDate(adiso);
  if (!date) return null;

  const diffMs = Date.now() - date.getTime();
  if (diffMs < 0) return null;

  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return 'Ahora';
  if (minutes < 60) return `Hace ${minutes} min`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hace ${hours} h`;

  const days = Math.floor(hours / 24);
  if (days === 1) return 'Ayer';
  if (days < 7) return `Hace ${days} días`;

  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `Hace ${weeks} sem`;

  return date.toLocaleDateString('es-PE', { day: 'numeric', month: 'short' });
}

/** Parsea sueldo desde descripción de avisos importados/seed */
export function parseJobSalaryFromText(text: string): number | null {
  const patterns = [
    /sueldo\s+base:?\s*S\/\s*([\d,.]+)/i,
    /desde\s+S\/\s*([\d,.]+)/i,
    /S\/\s*([\d,.]+)\s*(?:\+|mensual|\/mes|mes)/i,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m?.[1]) {
      const n = parseInt(m[1].replace(/[,.]/g, ''), 10);
      if (!Number.isNaN(n) && n > 0) return n;
    }
  }
  return null;
}

export function getJobSalaryLabel(adiso: Adiso): string | null {
  if (adiso.categoria !== 'empleos') return null;
  if (adiso.precio && adiso.precio > 0) {
    return `Desde S/ ${adiso.precio.toLocaleString('es-PE')}/mes`;
  }
  const parsed = parseJobSalaryFromText(adiso.descripcion || '');
  if (parsed) return `Desde S/ ${parsed.toLocaleString('es-PE')}/mes`;
  return null;
}

export interface AdisoCardMetaRow {
  location?: string;
  salary?: string;
  relativeTime?: string;
  price?: string;
}

/** Metadatos compactos bajo el título del card según categoría */
export function getAdisoCardMetaRow(adiso: Adiso): AdisoCardMetaRow {
  const relativeTime = formatRelativePublishedAt(adiso) ?? undefined;
  const location =
    shouldShowLocationOnCard(adiso) ? formatUbicacionCorta(adiso.ubicacion) : undefined;

  if (adiso.categoria === 'empleos') {
    return {
      location: location || undefined,
      salary: getJobSalaryLabel(adiso) ?? undefined,
      relativeTime,
    };
  }

  if (adiso.categoria === 'inmuebles' || adiso.categoria === 'vehiculos') {
    const price = formatPrecioDisplay(adiso);
    return {
      location: location || undefined,
      price: price ?? undefined,
      relativeTime,
    };
  }

  return { relativeTime };
}

/** Precio en overlay de imagen para inmuebles/vehículos/productos con precio */
export function shouldShowPriceOnCard(adiso?: Adiso): boolean {
  if (!adiso) return false;
  if (adiso.categoria === 'empleos') return false;
  return Boolean(adiso.precio && adiso.precio > 0);
}

export function shouldShowLocationOnCard(adiso?: Adiso): boolean {
  if (!adiso) return false;
  if (adiso.categoria === 'empleos' || adiso.categoria === 'inmuebles') {
    return Boolean(formatUbicacionCorta(adiso.ubicacion));
  }
  return false;
}

export function getCardDescriptionSnippet(descripcion: string, maxLen = 100): string {
  const clean = sanitizeAdisoDescripcion(descripcion);
  if (clean.length <= maxLen) return clean;
  return `${clean.slice(0, maxLen).trim()}…`;
}

export function getPublicCardFields(adiso: Adiso) {
  return {
    title: toDisplayTitle(adiso.titulo),
    snippet: getCardDescriptionSnippet(adiso.descripcion),
    showPrice: shouldShowPriceOnCard(adiso),
    showLocation: shouldShowLocationOnCard(adiso),
    ctaShort: getCardCtaShortLabel(adiso.categoria),
  };
}

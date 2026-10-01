import { removePhonesFromText, maskPhonesInText } from '@/lib/phone';
import { sanitizeAdisoDescripcion } from '@/lib/adiso-display';
import type { FlyerTemplateId } from '@/lib/flyer/types';
import { parseUbicacionFromText, isGenericCuscoUbicacion } from './parse-ubicacion';
import type { UbicacionDetallada } from '@/types';

const RUEDA_FLYER_POOL: FlyerTemplateId[] = [
  'minimal-cream',
  'soft-wash',
  'editorial',
  'negocio',
  'ribbon',
  'stamp',
  'marketplace-tag',
  'duo-tone',
  'split',
  'corner-mark',
  'diagonal-band',
  'ticket',
];

const STARTER_RE =
  /(?:^|[\s.])(Vendo|VENDO|Alquilo|ALQUILO|Se alquila|SE ALQUILA|Se vende|SE VENDE|Busco|BUSCO|Se requiere|SE REQUIERE|Se solicita|SE SOLICITA|Necesito|NECESITO|Oportunidad|OPORTUNIDAD|Restaurante|RESTAURANTE|Hotel|HOTEL|Distribuidora|Importante empresa|¡?ÚNETE|Traspaso|Anticresis|ECONOMICOS|ECONÓMICOS|Remato|REMATO)/;

export function flyerTemplateForRuedaImport(adisoId: string, categoria?: string): FlyerTemplateId {
  let pool = RUEDA_FLYER_POOL;
  if (categoria === 'empleos' || categoria === 'servicios') {
    pool = ['minimal-cream', 'editorial', 'negocio', 'soft-wash', 'ribbon', 'stamp', 'marketplace-tag'];
  }
  let hash = 0;
  for (let i = 0; i < adisoId.length; i++) {
    hash = (hash * 31 + adisoId.charCodeAt(i)) >>> 0;
  }
  return pool[hash % pool.length] || 'minimal-cream';
}

function pickBetterTitleStart(textoRaw: string, fallback: string): string {
  const flat = textoRaw.replace(/\s+/g, ' ').trim();
  const m = flat.match(STARTER_RE);
  if (m && m.index !== undefined) {
    const start = m.index + (m[0].startsWith(' ') || m[0].startsWith('.') ? 1 : 0);
    const slice = flat.slice(start).trim();
    if (slice.length >= 20) return slice;
  }
  return fallback;
}

const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;

export function repairListingTitle(titulo: string, textoRaw: string, descripcion: string): string {
  let t = titulo.trim().replace(EMAIL_RE, ' ').replace(/\bCorreo:?\s*/gi, '');
  const badStart =
    /^[).,;\s]/.test(t) ||
    /^[a-z]/.test(t) ||
    /^(al|el|la|de|en|por|con)\s/i.test(t) ||
    /^(razón|razon)\s/i.test(t) ||
    /^CONOMICOS/i.test(t);

  if (badStart || t.length < 18) {
    t = pickBetterTitleStart(textoRaw, descripcion || textoRaw);
  }

  t = t.replace(/^\d+\.\s*/, '');
  t = removePhonesFromText(t);
  t = t.replace(/\b(?:Cel|Cels|Tel|Telf|WhatsApp|WA)\s*\.?\s*:?\s*/gi, '');
  t = t.replace(/\s+/g, ' ').trim();

  if (t.length > 88) {
    const cut = t.lastIndexOf(' ', 88);
    t = `${t.slice(0, cut > 40 ? cut : 88).trimEnd()}…`;
  }

  if (t && t[0] === t[0].toLowerCase() && /[a-záéíóúñ]/.test(t[0])) {
    t = t[0].toUpperCase() + t.slice(1);
  }

  return t || 'Aviso en Buscadis';
}

export function repairListingDescripcion(descripcion: string, textoRaw: string): string {
  let d = (descripcion || textoRaw).replace(EMAIL_RE, ' ');
  d = removePhonesFromText(d);
  d = sanitizeAdisoDescripcion(d);
  d = d.replace(/\b(?:Cel|Cels|Tel|Telf|WhatsApp|WA|Correo|Email)\s*\.?\s*:?\s*/gi, '');
  d = d.replace(/\s+/g, ' ').trim();
  return d.slice(0, 2000);
}

export function publicListingTitle(titulo: string): string {
  return maskPhonesInText(removePhonesFromText(titulo.trim()));
}

export function polishRuedaListing(input: {
  id: string;
  titulo: string;
  descripcion: string;
  textoRaw: string;
  categoria: string;
}): {
  titulo: string;
  descripcion: string;
  ubicacion: UbicacionDetallada;
  flyerTemplateId: FlyerTemplateId;
  hideGenericLocation: boolean;
} {
  const texto = input.textoRaw || `${input.titulo} ${input.descripcion}`;
  const titulo = repairListingTitle(input.titulo, texto, input.descripcion);
  const descripcion = repairListingDescripcion(input.descripcion, texto);
  const ubicacion = parseUbicacionFromText(texto);
  return {
    titulo,
    descripcion,
    ubicacion,
    flyerTemplateId: flyerTemplateForRuedaImport(input.id, input.categoria),
    hideGenericLocation: isGenericCuscoUbicacion(ubicacion),
  };
}

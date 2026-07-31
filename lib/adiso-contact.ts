import type { Adiso } from '@/types';
import { SOPORTE_WHATSAPP_NUMERO } from '@/lib/soporte';
import { getAdisoUrl } from '@/lib/url';

export type ExternalContactKind = 'whatsapp' | 'email' | 'telefono' | 'link';

export interface ExternalContactChannel {
  kind: ExternalContactKind;
  valor: string;
  ariaLabel: string;
}

export function resolveExternalContact(adiso: Adiso): ExternalContactChannel | null {
  if (adiso.contactLocked || adiso.paymentStatus === 'pending' || adiso.paymentStatus === 'underpaid') {
    return null;
  }
  const contactos = adiso.contactosMultiples?.filter((c) => c.valor?.trim());
  if (contactos?.length) {
    const principal = contactos.find((c) => c.principal) ?? contactos[0];
    if (principal.tipo === 'email') {
      return { kind: 'email', valor: principal.valor, ariaLabel: 'Contactar por email' };
    }
    if (principal.tipo === 'telefono') {
      return { kind: 'telefono', valor: principal.valor, ariaLabel: 'Llamar al anunciante' };
    }
    return { kind: 'whatsapp', valor: principal.valor, ariaLabel: 'Contactar por WhatsApp' };
  }

  const contacto = adiso.contacto?.trim();
  if (!contacto) return null;

  if (contacto.includes('@')) {
    return { kind: 'email', valor: contacto, ariaLabel: 'Contactar por email' };
  }
  if (/^https?:\/\//i.test(contacto)) {
    return { kind: 'link', valor: contacto, ariaLabel: 'Abrir enlace de contacto' };
  }
  return { kind: 'whatsapp', valor: contacto, ariaLabel: 'Contactar por WhatsApp' };
}

/** Anuncios caducados / inactivos / Rueda fuera de ventana: lead via chat + WhatsApp ops. */
export function isLeadCaptureAd(adiso: {
  estaActivo?: boolean;
  fechaExpiracion?: string | null;
  esHistorico?: boolean;
  fechaPublicacion?: string | null;
  fechaPublicacionOriginal?: string | null;
}): boolean {
  if (adiso.estaActivo === false) return true;
  if (adiso.fechaExpiracion) {
    const exp = new Date(adiso.fechaExpiracion);
    if (!Number.isNaN(exp.getTime()) && exp.getTime() < Date.now()) return true;
  }
  // Rueda: después de 14 días desde la fecha de edición → mediado por ops
  if (adiso.esHistorico) {
    const raw = adiso.fechaPublicacionOriginal || adiso.fechaPublicacion;
    if (raw) {
      const pub = new Date(raw.includes('T') ? raw : `${raw}T12:00:00`);
      if (!Number.isNaN(pub.getTime())) {
        const fourteenDays = 14 * 24 * 60 * 60 * 1000;
        if (Date.now() - pub.getTime() > fourteenDays) return true;
      }
    }
  }
  return false;
}

export function buildOpsLeadWhatsAppMessage(
  adiso: Pick<Adiso, 'titulo' | 'categoria' | 'edicionNumero' | 'id' | 'contacto'>,
  opts?: { baseUrl?: string; advertiserPhone?: string | null }
): string {
  const baseUrl = opts?.baseUrl || 'https://www.buscadis.com';
  const adisoUrl = `${baseUrl}${getAdisoUrl(adiso as Adiso)}`;
  const interest =
    adiso.categoria === 'inmuebles'
      ? '¿Sigue disponible?'
      : adiso.categoria === 'empleos'
        ? '¿Aún están contratando?'
        : adiso.categoria === 'vehiculos'
          ? '¿Aún está en venta?'
          : '¿Sigue disponible?';

  const phoneLine = opts?.advertiserPhone
    ? `\nTel. anunciante: ${opts.advertiserPhone}`
    : adiso.contacto
      ? `\nTel. anunciante: ${adiso.contacto}`
      : '';

  return `Hola! Interés en anuncio caducado: ${interest}

${adisoUrl}
${phoneLine}

Ref: ${adiso.edicionNumero || adiso.id}`.trim();
}

export function getOpsLeadWhatsAppUrl(
  adiso: Pick<Adiso, 'titulo' | 'categoria' | 'edicionNumero' | 'id' | 'contacto'>,
  opts?: { baseUrl?: string; advertiserPhone?: string | null }
): string {
  const text = buildOpsLeadWhatsAppMessage(adiso, opts);
  return `https://wa.me/${SOPORTE_WHATSAPP_NUMERO}?text=${encodeURIComponent(text)}`;
}

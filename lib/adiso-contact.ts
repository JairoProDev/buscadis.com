import type { Adiso } from '@/types';
import { SOPORTE_WHATSAPP_NUMERO } from '@/lib/soporte';
import { getAdisoUrl } from '@/lib/url';

export type ExternalContactKind = 'whatsapp' | 'email' | 'telefono' | 'link';

export interface ExternalContactChannel {
  kind: ExternalContactKind;
  valor: string;
  ariaLabel: string;
  /** Texto corto en botón (p. ej. etiqueta o últimos dígitos). */
  buttonLabel?: string;
}

function normalizeContactDigits(valor: string): string {
  return valor.replace(/\D/g, '');
}

export function formatWhatsAppCtaShortLabel(valor: string, etiqueta?: string): string {
  const tag = etiqueta?.trim();
  if (tag && tag.toLowerCase() !== 'whatsapp') return tag;
  const d = normalizeContactDigits(valor);
  if (d.length >= 9) return `WhatsApp ···${d.slice(-3)}`;
  return 'WhatsApp';
}

/** Contacto directo al anunciante (WA/tel). Pendiente de pago self-serve = bloqueado; muestra ops = visible. */
export function isAdvertiserContactVisible(
  adiso: Pick<Adiso, 'contactLocked' | 'paymentStatus' | 'privateData'>,
): boolean {
  if (adiso.contactLocked) return false;
  if (adiso.paymentStatus === 'underpaid') return false;
  if (adiso.paymentStatus === 'pending') {
    const priv = adiso.privateData as Record<string, unknown> | undefined;
    return priv?.muestra_plan_s50 === true || priv?.muestra_comercial === true;
  }
  return true;
}

export function resolveExternalContact(adiso: Adiso): ExternalContactChannel | null {
  if (!isAdvertiserContactVisible(adiso)) {
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

/** Hasta 3 líneas WhatsApp distintas (principal primero). */
export function resolveExternalWhatsAppContacts(adiso: Adiso): ExternalContactChannel[] {
  if (!isAdvertiserContactVisible(adiso)) return [];

  const contactos = adiso.contactosMultiples?.filter((c) => c.valor?.trim()) ?? [];
  const waEntries = contactos.filter((c) => c.tipo === 'whatsapp');

  if (waEntries.length === 0) {
    const contacto = adiso.contacto?.trim();
    if (contacto && !contacto.includes('@') && !/^https?:\/\//i.test(contacto)) {
      return [
        {
          kind: 'whatsapp',
          valor: contacto,
          ariaLabel: 'Contactar por WhatsApp',
          buttonLabel: 'WhatsApp',
        },
      ];
    }
    return [];
  }

  const seen = new Set<string>();
  const sorted = [...waEntries].sort((a, b) => Number(b.principal) - Number(a.principal));
  const out: ExternalContactChannel[] = [];

  for (const c of sorted) {
    const key = normalizeContactDigits(c.valor);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    const buttonLabel = formatWhatsAppCtaShortLabel(c.valor, c.etiqueta);
    out.push({
      kind: 'whatsapp',
      valor: c.valor,
      ariaLabel: `Contactar por ${buttonLabel}`,
      buttonLabel,
    });
    if (out.length >= 3) break;
  }

  return out;
}

/** Adisos caducados / inactivos / Rueda fuera de ventana: lead via chat + WhatsApp ops. */
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

  return `Hola! Interés en adiso caducado: ${interest}

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

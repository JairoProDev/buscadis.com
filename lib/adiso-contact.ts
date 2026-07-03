import { Adiso } from '@/types';

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

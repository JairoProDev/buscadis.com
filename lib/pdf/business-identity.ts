/**
 * Identidad del negocio normalizada para la portada del catálogo: contactos,
 * redes con su usuario visible y QR del perfil. Funciona con cualquier perfil,
 * llenando solo lo que el negocio tenga configurado.
 */

import type { BusinessProfile, SocialLink } from '@/types/business';
import {
  getSocialBrandKey,
  getWireframeSocialLinks,
  socialLinkLabel,
  SOCIAL_BRAND_COLORS,
  type SocialBrandKey,
} from '@/lib/business/social-display';
import { getBuscadisProfileUrl } from '@/lib/business/publicadis';
import { blobToDataUrl, hexToRgb, INK, type Rgb } from '@/lib/pdf/canvas-assets';
import type { PdfIconKey } from '@/lib/pdf/icon-paths';

export type PdfContactRow = {
  icon: PdfIconKey;
  label: string;
  value: string;
};

export type PdfSocialPill = {
  icon: PdfIconKey;
  color: Rgb;
  label: string;
  handle: string;
};

const BRAND_ICONS: Record<SocialBrandKey, PdfIconKey> = {
  website: 'website',
  whatsapp: 'whatsapp',
  telegram: 'telegram',
  messenger: 'messenger',
  instagram: 'instagram',
  facebook: 'facebook',
  tiktok: 'tiktok',
  twitter: 'twitter',
  linkedin: 'linkedin',
  youtube: 'youtube',
  pinterest: 'pinterest',
  threads: 'threads',
  spotify: 'spotify',
  custom: 'link',
};

const DAY_ORDER = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
const DAY_LABELS: Record<string, string> = {
  mon: 'Lun',
  tue: 'Mar',
  wed: 'Mié',
  thu: 'Jue',
  fri: 'Vie',
  sat: 'Sáb',
  sun: 'Dom',
};

/**
 * Formato internacional legible. El catálogo se comparte fuera del país, así que
 * a los móviles peruanos (9 dígitos que empiezan con 9) se les añade el +51.
 */
export function formatPhone(raw: string | undefined | null): string {
  const digits = (raw || '').replace(/\D/g, '');
  if (!digits) return '';

  const national = digits.startsWith('51') && digits.length === 11 ? digits.slice(2) : digits;
  const isPeruMobile = national.length === 9 && national.startsWith('9');
  const prefix = digits.length > national.length || isPeruMobile ? '+51 ' : '';
  const grouped =
    national.length === 9 ? national.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3') : national;
  return `${prefix}${grouped}`.trim();
}

function sameNumber(a: string | undefined, b: string | undefined): boolean {
  const digits = (value: string | undefined) => (value || '').replace(/\D/g, '').slice(-9);
  return Boolean(digits(a)) && digits(a) === digits(b);
}

/** Resumen compacto tipo "Lun–Sáb 08:00–18:00" para una sola línea. */
export function summarizeBusinessHours(
  hours: BusinessProfile['business_hours'] | undefined
): string {
  if (!hours || typeof hours !== 'object') return '';

  const open = DAY_ORDER.filter((day) => hours[day] && !hours[day].closed && hours[day].open);
  if (open.length === 0) return '';

  const groups: { from: string; to: string; range: string }[] = [];
  for (const day of open) {
    const range = `${hours[day].open}–${hours[day].close}`;
    const last = groups[groups.length - 1];
    const isConsecutive =
      last && DAY_ORDER.indexOf(day) === DAY_ORDER.indexOf(last.to as (typeof DAY_ORDER)[number]) + 1;
    if (last && last.range === range && isConsecutive) {
      last.to = day;
    } else {
      groups.push({ from: day, to: day, range });
    }
  }

  return groups
    .slice(0, 2)
    .map(({ from, to, range }) => {
      const days = from === to ? DAY_LABELS[from] : `${DAY_LABELS[from]}–${DAY_LABELS[to]}`;
      return `${days} ${range}`;
    })
    .join(' · ');
}

export function buildContactRows(profile: Partial<BusinessProfile>): PdfContactRow[] {
  const rows: PdfContactRow[] = [];

  const whatsapp = formatPhone(profile.contact_whatsapp);
  if (whatsapp) rows.push({ icon: 'whatsapp', label: 'WhatsApp / Pedidos', value: whatsapp });

  const phone = formatPhone(profile.contact_phone);
  if (phone && !sameNumber(profile.contact_phone, profile.contact_whatsapp)) {
    rows.push({ icon: 'phone', label: 'Teléfono', value: phone });
  }

  if (profile.contact_email?.trim()) {
    rows.push({ icon: 'mail', label: 'Correo', value: profile.contact_email.trim() });
  }

  if (profile.contact_address?.trim()) {
    rows.push({ icon: 'pin', label: 'Dirección', value: profile.contact_address.trim() });
  }

  const schedule = summarizeBusinessHours(profile.business_hours);
  if (schedule) rows.push({ icon: 'clock', label: 'Horario', value: schedule });

  return rows;
}

/** Usuario visible de la red (@handle) o el dominio en el caso de la web. */
export function socialHandle(link: SocialLink, brand: SocialBrandKey): string {
  let url: URL;
  try {
    url = new URL(link.url.trim());
  } catch {
    return '';
  }

  const host = url.hostname.replace(/^www\./i, '');
  if (brand === 'website' || brand === 'custom') {
    const path = url.pathname.replace(/\/$/, '');
    return `${host}${path.length > 1 && path.length <= 16 ? path : ''}`;
  }
  if (brand === 'whatsapp') return formatPhone(url.pathname.replace(/\D/g, ''));

  const segments = url.pathname.split('/').filter(Boolean);
  if (segments.length === 0) return host;

  if (brand === 'linkedin') {
    const handle = segments[segments.length - 1];
    return handle ? `@${handle}` : host;
  }
  if (brand === 'facebook' && segments[0].startsWith('profile.php')) return '';

  const handle = decodeURIComponent(segments[0]).replace(/^@/, '');
  if (!handle || handle.length > 30) return '';
  return `@${handle}`;
}

/**
 * Redes para la portada: se omite WhatsApp (ya está en contactos) y se cierra
 * siempre con el perfil de Buscadis para que el catálogo sea rastreable.
 */
export function buildSocialPills(
  profile: Partial<BusinessProfile>,
  maxPills = 4
): PdfSocialPill[] {
  const pills: PdfSocialPill[] = [];

  for (const link of getWireframeSocialLinks(profile)) {
    const brand = getSocialBrandKey(link);
    if (brand === 'whatsapp') continue;

    const handle = socialHandle(link, brand);
    const label = socialLinkLabel(link);
    pills.push({
      icon: BRAND_ICONS[brand] ?? 'link',
      color: hexToRgb(SOCIAL_BRAND_COLORS[brand]?.text, INK),
      label,
      handle: handle || label,
    });
    if (pills.length >= maxPills) break;
  }

  return pills;
}

/**
 * QR del perfil: primero el QR de marca del negocio (trackeable por short code)
 * y si el servicio no responde, uno generado en el navegador.
 */
export async function resolveProfileQr(
  profile: Partial<BusinessProfile>
): Promise<string | null> {
  if (profile.slug) {
    try {
      const res = await fetch(
        `/api/business/${encodeURIComponent(profile.slug)}/qr?format=png&width=640`
      );
      if (res.ok && (res.headers.get('content-type') || '').includes('image')) {
        const dataUrl = await blobToDataUrl(await res.blob());
        if (dataUrl) return dataUrl;
      }
    } catch {
      // se usa el respaldo local
    }
  }

  const target = getBuscadisProfileUrl(profile);
  if (!target) return null;

  try {
    const QRCode = await import('qrcode');
    return await QRCode.toDataURL(target, {
      width: 640,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: { dark: '#0f172aff', light: '#ffffffff' },
    });
  } catch {
    return null;
  }
}

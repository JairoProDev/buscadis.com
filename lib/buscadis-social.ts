import type { SocialBrandKey } from '@/lib/business/social-display';
import { SOPORTE_WHATSAPP_NUMERO } from '@/lib/soporte';

export type BuscadisSocialLink = {
  network: SocialBrandKey;
  label: string;
  href: string;
};

const BRAND_WHATSAPP_MESSAGE =
  'Hola, estoy en buscadis.com y me gustaría conocer más sobre Buscadis.';

export function getBuscadisSocialWhatsAppUrl(): string {
  return `https://wa.me/${SOPORTE_WHATSAPP_NUMERO}?text=${encodeURIComponent(BRAND_WHATSAPP_MESSAGE)}`;
}

/** Redes oficiales de la marca Buscadis (no confundir con WhatsApp de soporte / Ayuda). */
/** Sin WhatsApp: en ficha/móvil se confunde con el contacto del anunciante (soporte va en Ayuda). */
export const BUSCADIS_SOCIAL_LINKS: BuscadisSocialLink[] = [
  {
    network: 'instagram',
    label: 'Instagram de Buscadis',
    href: 'https://instagram.com/buscadis',
  },
  {
    network: 'facebook',
    label: 'Facebook de Buscadis',
    href: 'https://facebook.com/buscadis',
  },
  {
    network: 'tiktok',
    label: 'TikTok de Buscadis',
    href: 'https://tiktok.com/@buscadis',
  },
  {
    network: 'linkedin',
    label: 'LinkedIn de Buscadis',
    href: 'https://linkedin.com/company/buscadis',
  },
];

/** Ocultar chrome de marca en vitrinas de negocio / preview perfil vivo. */
export function shouldShowBuscadisSocialChrome(pathname: string): boolean {
  if (!pathname) return true;
  if (pathname.startsWith('/v/')) return false;
  if (pathname.startsWith('/negocio/')) return false;
  /** En ficha de adiso el float tapa el CTA de contacto del anunciante. */
  if (pathname.startsWith('/a/')) return false;
  return true;
}

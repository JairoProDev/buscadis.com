import type { CSSProperties } from 'react';
import type { BusinessProfile } from '@/types/business';
import type { Adiso } from '@/types';

export function getBusinessCanonicalUrl(slug: string): string {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://buscadis.com').replace(/\/$/, '');
  return `${siteUrl}/${slug}`;
}

export function getWhatsappUrl(
  phone: string,
  businessName: string,
  message?: string
): string {
  const text =
    message ||
    `Hola, vi su perfil de ${businessName} en Buscadis y me gustaría más información.`;
  const digits = phone.replace(/\D/g, '');
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export function getProductWhatsappUrl(
  phone: string,
  businessName: string,
  product: Adiso
): string {
  const price = product.precio ? ` — S/ ${product.precio}` : '';
  const text = `Hola ${businessName}, me interesa: *${product.titulo}*${price}. Lo vi en su catálogo Buscadis.`;
  return getWhatsappUrl(phone, businessName, text);
}

export function getCartWhatsappUrl(
  phone: string,
  businessName: string,
  items: { title: string; qty: number; price?: number }[]
): string {
  const lines = items.map(
    (i) => `• ${i.qty}x ${i.title}${i.price ? ` (S/ ${i.price})` : ''}`
  );
  const text = `Hola ${businessName}, quiero consultar por estos productos de su catálogo:\n\n${lines.join('\n')}\n\n¿Están disponibles?`;
  return getWhatsappUrl(phone, businessName, text);
}

export function businessThemeStyle(profile: Partial<BusinessProfile>): CSSProperties {
  return {
    '--brand-color': profile.theme_color || '#3c6997',
    '--bg-primary': '#ffffff',
    '--bg-secondary': '#f8fafc',
    '--bg-tertiary': '#e2e8f0',
    '--text-primary': '#0f172a',
    '--text-secondary': '#475569',
    '--text-tertiary': '#94a3b8',
    '--border-color': '#e2e8f0',
    '--border-subtle': '#f1f5f9',
  } as CSSProperties;
}

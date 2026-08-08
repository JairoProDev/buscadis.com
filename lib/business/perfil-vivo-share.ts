import { getSiteUrl } from '@/lib/seo/og-image';
import { getBusinessProfilePath } from '@/lib/seo/business-metadata';
import { perfilVivoOgImageUrl } from '@/lib/seo/perfil-vivo-metadata';

/** Enlace canónico del perfil (cutover /@). */
export function perfilVivoPublicUrl(slug: string): string {
  return `${getSiteUrl()}${getBusinessProfilePath(slug)}`;
}

/** Preview paralelo hasta cutover. */
export function perfilVivoPreviewUrl(slug: string): string {
  return `${getSiteUrl()}/v/${encodeURIComponent(slug)}`;
}

/** Enlace para pegar en sticker / bio con origen QR (analytics). */
export function perfilVivoQrMarkedUrl(slug: string): string {
  const u = new URL(perfilVivoPublicUrl(slug));
  u.searchParams.set('src', 'qr');
  u.searchParams.set('utm_source', 'qr');
  u.searchParams.set('utm_medium', 'offline');
  return u.toString();
}

/** Mensaje para que el dueño se envíe su perfil por WhatsApp (bucle 1). */
export function mensajeCompartirPerfilPropio(
  nombreNegocio: string,
  url: string
): string {
  return `Este es el perfil de ${nombreNegocio} en Buscadis:\n${url}\n\nHorario, precios y WhatsApp en un solo enlace.`;
}

export function waMeCompartirPerfil(phoneE164: string, nombre: string, url: string): string {
  const digits = phoneE164.replace(/\D/g, '');
  const text = mensajeCompartirPerfilPropio(nombre, url);
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export function perfilVivoOgPreviewUrl(slug: string): string {
  return perfilVivoOgImageUrl(slug);
}

import type { Metadata } from 'next';
import { Adiso } from '@/types';
import { getAdisoUrl } from '@/lib/url';
import { getSiteUrl, resolveAdisoOgImage } from '@/lib/seo/og-image';

function formatUbicacionLabel(adiso: Adiso): string {
  if (typeof adiso.ubicacion === 'string' && adiso.ubicacion.trim()) {
    return adiso.ubicacion;
  }
  if (adiso.ubicacion && typeof adiso.ubicacion === 'object') {
    return (
      adiso.ubicacion.distrito ||
      adiso.ubicacion.provincia ||
      adiso.ubicacion.departamento ||
      'Perú'
    );
  }
  return 'Perú';
}

function formatDescription(adiso: Adiso): string {
  if (adiso.descripcion?.trim()) {
    const text = adiso.descripcion.trim();
    return text.length > 160 ? `${text.substring(0, 160)}...` : text;
  }
  return `Anuncio de ${adiso.categoria}: ${adiso.titulo}`;
}

/** Metadata OG/Twitter para compartir un adiso (WhatsApp, Facebook, iMessage, etc.) */
export function buildAdisoMetadata(adiso: Adiso): Metadata {
  const siteUrl = getSiteUrl();
  const path = getAdisoUrl(adiso);
  const url = `${siteUrl}${path}`;
  const ubicacion = formatUbicacionLabel(adiso);
  const title = `${adiso.titulo} en ${ubicacion} | Buscadis`;
  const description = formatDescription(adiso);
  const imageUrl = resolveAdisoOgImage(adiso);

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url,
      siteName: 'Buscadis',
      images: [{ url: imageUrl, width: 1200, height: 630, alt: adiso.titulo }],
      locale: 'es_PE',
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  };
}

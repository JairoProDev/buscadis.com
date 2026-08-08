import type { Metadata } from 'next';
import type { PerfilPayload } from '@buscadis/perfil-vivo';
import {
  DEFAULT_OG_IMAGE_HEIGHT,
  DEFAULT_OG_IMAGE_WIDTH,
  getSiteUrl,
} from '@/lib/seo/og-image';

export function perfilVivoOgImagePath(slug: string): string {
  return `/og/perfil/${encodeURIComponent(slug)}`;
}

export function perfilVivoOgImageUrl(slug: string): string {
  return `${getSiteUrl()}${perfilVivoOgImagePath(slug)}`;
}

/** Metadatos de share para /v y cutover /@ (imagen OG dinámica). */
export function buildPerfilVivoShareMetadata(opts: {
  payload: PerfilPayload;
  canonicalPath: string;
  indexable: boolean;
  titleSuffix?: string;
}): Metadata {
  const { payload, canonicalPath, indexable } = opts;
  const n = payload.negocio;
  const d = n.ubicacion?.distrito ?? 'Cusco';
  const title =
    opts.titleSuffix != null
      ? `${n.nombre} — ${n.categoria.nombre} en ${d} | ${opts.titleSuffix}`
      : `${n.nombre} — ${n.categoria.nombre} en ${d} | Buscadis`;
  const description =
    n.eslogan ||
    payload.nosotros?.texto?.slice(0, 160) ||
    `${n.categoria.nombre} en ${d}. Precios, horario y WhatsApp en Buscadis.`;
  const keywords = [
    ...(n.etiquetas ?? []),
    n.categoria.nombre,
    d,
    n.ubicacion?.provincia,
    'Perú',
  ]
    .filter((x): x is string => typeof x === 'string' && x.length > 0)
    .filter((x, i, arr) => arr.findIndex((y) => y.toLowerCase() === x.toLowerCase()) === i)
    .slice(0, 12);
  const url = `${getSiteUrl()}${canonicalPath}`;
  const imageUrl = perfilVivoOgImageUrl(n.slug);

  return {
    title,
    description,
    keywords: keywords.join(', '),
    alternates: { canonical: url },
    robots: { index: indexable, follow: true },
    openGraph: {
      title,
      description,
      url,
      siteName: 'Buscadis',
      locale: 'es_PE',
      type: 'website',
      images: [
        {
          url: imageUrl,
          width: DEFAULT_OG_IMAGE_WIDTH,
          height: DEFAULT_OG_IMAGE_HEIGHT,
          alt: n.nombre,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  };
}

import type { Adiso } from '@/types';
import { getAdisoUrl } from '@/lib/url';
import { getSiteUrl, resolveAdisoOgImage } from '@/lib/seo/og-image';
import { sanitizeAdisoDescripcion, toDisplayTitle } from '@/lib/adiso-display';

function locationLabel(adiso: Adiso): string {
  if (typeof adiso.ubicacion === 'string' && adiso.ubicacion.trim()) {
    return adiso.ubicacion.trim();
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

/** Product + Offer JSON-LD for an adiso detail page. */
export function buildAdisoProductJsonLd(adiso: Adiso): Record<string, unknown> {
  const siteUrl = getSiteUrl();
  const path = getAdisoUrl(adiso);
  const url = `${siteUrl}${path}`;
  const title = toDisplayTitle(adiso.titulo) || adiso.titulo;
  const description =
    sanitizeAdisoDescripcion(adiso.descripcion)?.slice(0, 300) ||
    `Anuncio de ${adiso.categoria}: ${title}`;
  const image = resolveAdisoOgImage(adiso);
  const hasPrice = typeof adiso.precio === 'number' && adiso.precio > 0;

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: title,
    description,
    image: image ? [image] : undefined,
    url,
    category: adiso.categoria,
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: adiso.moneda || 'PEN',
      ...(hasPrice
        ? { price: adiso.precio }
        : { priceSpecification: { '@type': 'PriceSpecification', priceCurrency: 'PEN' } }),
      availability: adiso.estaActivo === false
        ? 'https://schema.org/SoldOut'
        : 'https://schema.org/InStock',
      areaServed: locationLabel(adiso),
    },
  };
}

/** ItemList JSON-LD for category / home crawlable listings. */
export function buildAdisoItemListJsonLd(
  adisos: Adiso[],
  opts: { name: string; urlPath: string }
): Record<string, unknown> {
  const siteUrl = getSiteUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: opts.name,
    url: `${siteUrl}${opts.urlPath}`,
    numberOfItems: adisos.length,
    itemListElement: adisos.slice(0, 48).map((adiso, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `${siteUrl}${getAdisoUrl(adiso)}`,
      name: toDisplayTitle(adiso.titulo) || adiso.titulo,
    })),
  };
}

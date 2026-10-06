import type { Adiso } from '@/types';
import { getAdisoUrl } from '@/lib/url';
import { getSiteUrl, resolveAdisoOgImage } from '@/lib/seo/og-image';
import { sanitizeAdisoDescripcion, toDisplayTitle } from '@/lib/adiso-display';
import { BUSCADIS_LEGAL_NAME } from '@/lib/legal/operator';

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

function jobLocationPlace(adiso: Adiso): Record<string, unknown> {
  const label = locationLabel(adiso);
  if (adiso.ubicacion && typeof adiso.ubicacion === 'object') {
    return {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: adiso.ubicacion.distrito || label,
        addressRegion: adiso.ubicacion.provincia || adiso.ubicacion.departamento,
        addressCountry: 'PE',
      },
    };
  }
  return {
    '@type': 'Place',
    address: {
      '@type': 'PostalAddress',
      addressLocality: label,
      addressCountry: 'PE',
    },
  };
}

function datePostedIso(adiso: Adiso): string {
  const date = adiso.fechaPublicacion || new Date().toISOString().slice(0, 10);
  const time = adiso.horaPublicacion || '09:00';
  return `${date}T${time}:00-05:00`;
}

function hiringOrganizationName(adiso: Adiso): string {
  const vendor = adiso.vendedor?.nombre?.trim();
  if (vendor) return vendor;
  const fromPrivate =
    typeof adiso.privateData?.empresa === 'string'
      ? adiso.privateData.empresa.trim()
      : '';
  if (fromPrivate) return fromPrivate;
  return 'Empleador publicado en Buscadis';
}

export function buildAdisoBreadcrumbJsonLd(adiso: Adiso): Record<string, unknown> {
  const siteUrl = getSiteUrl();
  const path = getAdisoUrl(adiso);
  const title = toDisplayTitle(adiso.titulo) || adiso.titulo;
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Buscadis', item: siteUrl },
      {
        '@type': 'ListItem',
        position: 2,
        name: adiso.categoria,
        item: `${siteUrl}/categoria/${adiso.categoria}`,
      },
      { '@type': 'ListItem', position: 3, name: title, item: `${siteUrl}${path}` },
    ],
  };
}

export function buildAdisoJobPostingJsonLd(adiso: Adiso): Record<string, unknown> {
  const siteUrl = getSiteUrl();
  const path = getAdisoUrl(adiso);
  const url = `${siteUrl}${path}`;
  const title = toDisplayTitle(adiso.titulo) || adiso.titulo;
  const description =
    sanitizeAdisoDescripcion(adiso.descripcion)?.slice(0, 5000) ||
    `Vacante: ${title}. Publicada en Buscadis, Perú.`;
  const hasSalary = typeof adiso.precio === 'number' && adiso.precio > 0;

  return {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title,
    description,
    identifier: {
      '@type': 'PropertyValue',
      name: 'Buscadis',
      value: adiso.id,
    },
    url,
    datePosted: datePostedIso(adiso),
    validThrough: adiso.expiresAt || undefined,
    employmentType: 'FULL_TIME',
    hiringOrganization: {
      '@type': 'Organization',
      name: hiringOrganizationName(adiso),
      sameAs: siteUrl,
    },
    jobLocation: jobLocationPlace(adiso),
    ...(hasSalary
      ? {
          baseSalary: {
            '@type': 'MonetaryAmount',
            currency: adiso.moneda || 'PEN',
            value: {
              '@type': 'QuantitativeValue',
              unitText: 'MONTH',
              value: adiso.precio,
            },
          },
        }
      : {}),
    applicantLocationRequirements: {
      '@type': 'Country',
      name: 'Perú',
    },
    directApply: true,
  };
}

/** RealEstateListing for inmuebles (Google rich results where applicable). */
export function buildAdisoRealEstateJsonLd(adiso: Adiso): Record<string, unknown> {
  const siteUrl = getSiteUrl();
  const path = getAdisoUrl(adiso);
  const url = `${siteUrl}${path}`;
  const title = toDisplayTitle(adiso.titulo) || adiso.titulo;
  const description =
    sanitizeAdisoDescripcion(adiso.descripcion)?.slice(0, 500) ||
    `Inmueble: ${title}. Anuncio en Buscadis, Perú.`;
  const image = resolveAdisoOgImage(adiso);
  const hasPrice = typeof adiso.precio === 'number' && adiso.precio > 0;
  const attrs = adiso.atributos as Record<string, unknown> | undefined;
  const floorSize =
    typeof attrs?.area_m2 === 'number'
      ? attrs.area_m2
      : typeof attrs?.metros === 'number'
        ? attrs.metros
        : undefined;

  return {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: title,
    description,
    url,
    image: image ? [image] : undefined,
    datePosted: datePostedIso(adiso),
    address: jobLocationPlace(adiso).address,
    ...(floorSize
      ? {
          floorSize: {
            '@type': 'QuantitativeValue',
            value: floorSize,
            unitCode: 'MTK',
          },
        }
      : {}),
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: adiso.moneda || 'PEN',
      ...(hasPrice ? { price: adiso.precio } : {}),
      availability: adiso.estaActivo === false
        ? 'https://schema.org/SoldOut'
        : 'https://schema.org/InStock',
    },
  };
}

/** Product + Offer JSON-LD for general classified listings. */
export function buildAdisoProductJsonLd(adiso: Adiso): Record<string, unknown> {
  const siteUrl = getSiteUrl();
  const path = getAdisoUrl(adiso);
  const url = `${siteUrl}${path}`;
  const title = toDisplayTitle(adiso.titulo) || adiso.titulo;
  const description =
    sanitizeAdisoDescripcion(adiso.descripcion)?.slice(0, 300) ||
    `Adiso de ${adiso.categoria}: ${title}. Anuncio publicado en Buscadis.`;
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
    brand: { '@type': 'Brand', name: BUSCADIS_LEGAL_NAME },
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

/** Breadcrumb + primary entity (JobPosting or Product) for adiso detail. */
function buildAdisoPrimaryJsonLd(adiso: Adiso): Record<string, unknown> {
  if (adiso.categoria === 'empleos') return buildAdisoJobPostingJsonLd(adiso);
  if (adiso.categoria === 'inmuebles') return buildAdisoRealEstateJsonLd(adiso);
  return buildAdisoProductJsonLd(adiso);
}

export function buildAdisoPageJsonLd(adiso: Adiso): Record<string, unknown> {
  const primary = buildAdisoPrimaryJsonLd(adiso);
  const breadcrumb = buildAdisoBreadcrumbJsonLd(adiso);
  const { '@context': _c, ...primaryNode } = primary as {
    '@context': string;
    [key: string]: unknown;
  };
  const { '@context': _b, ...breadcrumbNode } = breadcrumb as {
    '@context': string;
    [key: string]: unknown;
  };
  return {
    '@context': 'https://schema.org',
    '@graph': [breadcrumbNode, primaryNode],
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

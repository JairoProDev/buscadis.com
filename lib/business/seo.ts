import type { BusinessProfile } from '@/types/business';
import type { Adiso } from '@/types';
import type { BusinessReviewAggregate } from '@/types/business';
import { getBusinessCanonicalUrl } from './public-utils';
import { getDefaultOgImageUrl } from '@/lib/seo/og-image';

export function buildBusinessMetadata(profile: {
  name: string;
  slug: string;
  description?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  logo_url?: string | null;
  banner_url?: string | null;
  og_image_url?: string | null;
}) {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://buscadis.com').replace(/\/$/, '');
  const title = profile.meta_title || `${profile.name} | Buscadis`;
  const description =
    profile.meta_description ||
    profile.description ||
    `Página oficial de ${profile.name} en Buscadis`;
  const imageUrl =
    profile.og_image_url || profile.logo_url || profile.banner_url || getDefaultOgImageUrl();
  const url = `${siteUrl}/${profile.slug}`;

  return { title, description, imageUrl, url };
}

export function buildLocalBusinessJsonLd(
  profile: Partial<BusinessProfile>,
  products: Adiso[] = [],
  aggregate?: BusinessReviewAggregate | null
) {
  const url = getBusinessCanonicalUrl(profile.slug || '');
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: profile.name,
    description: profile.description,
    url,
    image: profile.logo_url || profile.banner_url,
    telephone: profile.contact_phone || profile.contact_whatsapp,
    email: profile.contact_email,
    address: profile.contact_address
      ? { '@type': 'PostalAddress', streetAddress: profile.contact_address, addressCountry: 'PE' }
      : undefined,
    sameAs: profile.social_links?.map((s) => s.url).filter(Boolean),
  };

  if (aggregate && aggregate.review_count > 0) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: aggregate.avg_rating,
      reviewCount: aggregate.review_count,
      bestRating: 5,
      worstRating: 1,
    };
  }

  const topProducts = products.slice(0, 5).map((p) => ({
    '@type': 'Product',
    name: p.titulo,
    description: p.descripcion?.slice(0, 200),
    image: p.imagenUrl || p.imagenesUrls?.[0],
    offers: p.precio
      ? {
          '@type': 'Offer',
          price: p.precio,
          priceCurrency: 'PEN',
          availability: 'https://schema.org/InStock',
        }
      : undefined,
  }));

  return {
    localBusiness: schema,
    products: topProducts.length
      ? { '@context': 'https://schema.org', '@graph': topProducts }
      : null,
    breadcrumb: {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Buscadis', item: url.split('/').slice(0, 3).join('/') },
        { '@type': 'ListItem', position: 2, name: profile.name, item: url },
      ],
    },
  };
}

export const BUSINESS_CACHE_TAG = (slug: string) => `business:${slug}`;

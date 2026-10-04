import { BUSCADIS_LEGAL_NAME, BUSCADIS_PURPOSE_SUMMARY } from '@/lib/legal/operator';
import { getSiteUrl } from '@/lib/seo/og-image';

/** Organization + WebSite for OAuth branding and rich results. */
export function buildBuscadisOrganizationJsonLd(): Record<string, unknown> {
  const siteUrl = getSiteUrl();
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${siteUrl}/#organization`,
        name: 'Buscadis',
        legalName: BUSCADIS_LEGAL_NAME,
        url: siteUrl,
        logo: `${siteUrl}/logo-mark.png`,
        description: BUSCADIS_PURPOSE_SUMMARY,
        sameAs: [],
      },
      {
        '@type': 'WebSite',
        '@id': `${siteUrl}/#website`,
        name: 'Buscadis',
        url: siteUrl,
        publisher: { '@id': `${siteUrl}/#organization` },
        description: BUSCADIS_PURPOSE_SUMMARY,
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${siteUrl}/?buscar={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
      },
    ],
  };
}

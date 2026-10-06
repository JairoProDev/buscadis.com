import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SearchResultsBody } from '@/lib/seo/search-page-shared';
import { getSiteUrl, withDefaultShareImage } from '@/lib/seo/og-image';
import { getSearchCanonicalPath, searchSlugToQuery } from '@/lib/seo/search-url';

export const revalidate = 60;

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const q = searchSlugToQuery(slug);
  if (!q || q.length < 2) {
    return {
      title: 'Buscar en Buscadis',
      robots: { index: false, follow: true },
    };
  }

  const title = `Resultados para «${q}» | Buscadis`;
  const description = `Anuncios y avisos relacionados con «${q}» en Buscadis, Perú.`;
  const canonical = getSearchCanonicalPath(q);

  return {
    title,
    description,
    alternates: { canonical },
    robots: { index: true, follow: true },
    ...withDefaultShareImage({
      title,
      description,
      url: `${getSiteUrl()}${canonical}`,
    }),
  };
}

export default async function BuscarSlugPage({ params }: PageProps) {
  const { slug } = await params;
  const q = searchSlugToQuery(slug);
  if (!slug?.trim() || (q && q.length < 2)) {
    notFound();
  }

  return <SearchResultsBody query={q} />;
}

import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { SearchResultsBody } from '@/lib/seo/search-page-shared';
import { getSearchPathFromQuery } from '@/lib/seo/search-url';

export const revalidate = 60;

type PageProps = {
  searchParams: Promise<{ q?: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Buscar en Buscadis',
    description: 'Busca empleos, inmuebles, vehículos y más en Perú.',
    robots: { index: false, follow: true },
  };
}

/** /buscar sin término, o redirect 308 desde ?q= hacia /buscar/{slug} */
export default async function BuscarPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const q = typeof sp.q === 'string' ? sp.q.trim() : '';

  if (q.length >= 2) {
    redirect(getSearchPathFromQuery(q));
  }

  return <SearchResultsBody query="" />;
}

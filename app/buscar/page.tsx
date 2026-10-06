import type { Metadata } from 'next';
import Link from 'next/link';
import { executeSearch } from '@/lib/search/execute-search';
import { CrawlableAdisoList } from '@/components/seo/CrawlableAdisoList';
import { getSiteUrl, withDefaultShareImage } from '@/lib/seo/og-image';

export const revalidate = 60;

type PageProps = {
  searchParams: Promise<{ q?: string }>;
};

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const sp = await searchParams;
  const q = typeof sp.q === 'string' ? sp.q.trim() : '';

  if (!q) {
    return {
      title: 'Buscar en Buscadis',
      description: 'Busca empleos, inmuebles, vehículos y más en Perú.',
      robots: { index: false, follow: true },
    };
  }

  const title = `Resultados para «${q}» | Buscadis`;
  const description = `Anuncios y avisos relacionados con «${q}» en Buscadis, Perú.`;
  const canonical = `/buscar?q=${encodeURIComponent(q)}`;

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

export default async function BuscarPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const q = typeof sp.q === 'string' ? sp.q.trim() : '';

  let adisos: Awaited<ReturnType<typeof executeSearch>>['adisos'] = [];
  if (q.length >= 2) {
    try {
      const result = await executeSearch({ query: q, maxResults: 36 });
      adisos = result.adisos;
    } catch (err) {
      console.error('[buscar] search failed:', err);
    }
  }

  return (
    <main className="mx-auto max-w-[1400px] px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold text-[var(--bs-fg-default)]">Buscar en Buscadis</h1>
      {q ? (
        <p className="mb-6 text-[var(--bs-fg-muted)]">
          {adisos.length > 0
            ? `${adisos.length} resultado(s) para «${q}»`
            : `No encontramos avisos para «${q}». Prueba otra palabra o publica el primero.`}
        </p>
      ) : (
        <p className="mb-6 text-[var(--bs-fg-muted)]">
          Escribe en el buscador de la portada o usa{' '}
          <code className="text-sm">/buscar?q=empleo+cusco</code>.
        </p>
      )}
      <CrawlableAdisoList
        adisos={adisos}
        heading={q ? `Resultados: ${q}` : 'Resultados'}
      />
      <p className="mt-8">
        <Link href="/publicar" className="font-medium text-[var(--bs-action)]">
          Publicar un aviso
        </Link>
      </p>
    </main>
  );
}

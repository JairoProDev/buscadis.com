import Link from 'next/link';
import { executeSearch } from '@/lib/search/execute-search';
import { CrawlableAdisoList } from '@/components/seo/CrawlableAdisoList';
import { NativeAppRouteChrome } from '@/components/native/NativeAppRouteChrome';

export async function SearchResultsBody({ query }: { query: string }) {
  const q = query.trim();
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
    <>
      <NativeAppRouteChrome />
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
          Escribe en el buscador de la portada o visita una ruta como{' '}
          <Link href="/buscar/empleo-cusco" className="text-[var(--bs-action)]">
            /buscar/empleo-cusco
          </Link>
          .
        </p>
      )}
      <CrawlableAdisoList adisos={adisos} heading={q ? `Resultados: ${q}` : 'Resultados'} />
      <p className="mt-8">
        <Link href="/publicar" className="font-medium text-[var(--bs-action)]">
          Publicar un aviso
        </Link>
      </p>
      </main>
    </>
  );
}

import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Categoria } from '@/types';
import { getMarketplaceFeed } from '@/lib/business';
import { CrawlableAdisoList, ListingPagination } from '@/components/seo/CrawlableAdisoList';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildAdisoItemListJsonLd } from '@/lib/seo/adiso-jsonld';
import { getSiteUrl } from '@/lib/seo/og-image';
import {
  CUSCO_HUB_MIN_ADISOS_INDEX,
  filterAdisosForCusco,
  getCuscoHubCopy,
  getCuscoHubPath,
  isCuscoHubCategory,
} from '@/lib/seo/cusco-hubs';
import { withDefaultShareImage } from '@/lib/seo/og-image';

const PAGE_SIZE = 24;
const FETCH_POOL = 200;

export const revalidate = 300;

interface PageProps {
  params: Promise<{ categoria: string }>;
  searchParams: Promise<{ page?: string }>;
}

async function loadCuscoHubIndexable(categoria: Categoria): Promise<boolean> {
  try {
    const pool = await getMarketplaceFeed({
      limit: FETCH_POOL,
      offset: 0,
      soloActivos: true,
      categoria,
    });
    return filterAdisosForCusco(pool).length >= CUSCO_HUB_MIN_ADISOS_INDEX;
  } catch {
    return false;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { categoria: raw } = await params;
  if (!isCuscoHubCategory(raw)) {
    return { title: 'No encontrado | Buscadis' };
  }
  const categoria = raw as Categoria;
  const copy = getCuscoHubCopy(categoria);
  const path = getCuscoHubPath(categoria);
  const url = `${getSiteUrl()}${path}`;
  const indexable = await loadCuscoHubIndexable(categoria);

  return {
    title: copy.title,
    description: copy.description,
    alternates: { canonical: path },
    robots: indexable ? { index: true, follow: true } : { index: false, follow: true },
    ...withDefaultShareImage({
      title: copy.title,
      description: copy.description,
      url,
    }),
  };
}

export default async function CuscoHubPage({ params, searchParams }: PageProps) {
  const { categoria: raw } = await params;
  const sp = await searchParams;

  if (!isCuscoHubCategory(raw)) {
    notFound();
  }

  const categoria = raw as Categoria;
  const copy = getCuscoHubCopy(categoria);
  const page = Math.max(1, parseInt(sp.page || '1', 10) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  let pool: Awaited<ReturnType<typeof getMarketplaceFeed>> = [];
  try {
    pool = await getMarketplaceFeed({
      limit: FETCH_POOL,
      offset: 0,
      soloActivos: true,
      categoria,
    });
  } catch (err) {
    console.error('[cusco-hub] feed failed:', err);
  }

  const filtered = filterAdisosForCusco(pool);
  const pageItems = filtered.slice(offset, offset + PAGE_SIZE);
  const hasNext = filtered.length > offset + PAGE_SIZE;
  const listPath = getCuscoHubPath(categoria);
  const listName = `${copy.title} — listado`;

  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: copy.title,
    description: copy.description,
    url: `${getSiteUrl()}${listPath}`,
    isPartOf: { '@type': 'WebSite', name: 'Buscadis', url: getSiteUrl() },
  };

  return (
    <>
      <JsonLd data={collectionJsonLd} />
      <JsonLd
        data={buildAdisoItemListJsonLd(pageItems, { name: listName, urlPath: listPath })}
      />
      <main className="mx-auto max-w-[1400px] px-4 py-8">
        <nav aria-label="Breadcrumb" className="mb-4 text-sm text-[var(--bs-fg-muted)]">
          <Link href="/">Buscadis</Link>
          {' · '}
          <Link href={`/categoria/${categoria}`}>Perú</Link>
          {' · '}
          <span>Cusco</span>
        </nav>
        <h1 className="mb-3 text-2xl font-bold text-[var(--bs-fg-default)]">{copy.title}</h1>
        <p className="mb-6 max-w-2xl text-[var(--bs-fg-muted)]">{copy.intro}</p>
        <p className="mb-8">
          <Link href="/publicar" className="font-medium text-[var(--bs-action)]">
            Publicar aviso en Cusco
          </Link>
        </p>
        <CrawlableAdisoList adisos={pageItems} heading={listName} />
        <ListingPagination basePath={listPath} page={page} hasNext={hasNext} />
        {copy.faq.length > 0 ? (
          <section className="mt-10 max-w-2xl" aria-labelledby="cusco-faq">
            <h2 id="cusco-faq" className="mb-4 text-lg font-semibold">Preguntas frecuentes</h2>
            <dl className="space-y-4">
              {copy.faq.map((item) => (
                <div key={item.q}>
                  <dt className="font-medium">{item.q}</dt>
                  <dd className="text-[var(--bs-fg-muted)]">{item.a}</dd>
                </div>
              ))}
            </dl>
          </section>
        ) : null}
      </main>
    </>
  );
}

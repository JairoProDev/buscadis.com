import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Categoria } from '@/types';
import { CrawlableAdisoList, ListingPagination } from '@/components/seo/CrawlableAdisoList';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildAdisoItemListJsonLd } from '@/lib/seo/adiso-jsonld';
import { getSiteUrl, withDefaultShareImage } from '@/lib/seo/og-image';
import {
  getCuscoHubCopy,
  getCuscoHubPath,
  isCuscoHubCategory,
} from '@/lib/seo/cusco-hubs';
import {
  countCuscoHubAdisos,
  getCuscoHubAdisosPage,
  isCuscoHubIndexable,
} from '@/lib/seo/cusco-feed';

const PAGE_SIZE = 24;

export const revalidate = 300;

interface PageProps {
  params: Promise<{ categoria: string }>;
  searchParams: Promise<{ page?: string }>;
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
  const total = await countCuscoHubAdisos(categoria);
  const indexable = isCuscoHubIndexable(total);

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

function buildFaqJsonLd(
  copy: ReturnType<typeof getCuscoHubCopy>,
  listPath: string
): Record<string, unknown> | null {
  if (copy.faq.length < 2) return null;
  const base = `${getSiteUrl()}${listPath}`;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${base}#faq`,
    mainEntity: copy.faq.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
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

  let pageItems: Awaited<ReturnType<typeof getCuscoHubAdisosPage>>['items'] = [];
  let total = 0;
  try {
    const result = await getCuscoHubAdisosPage({
      categoria,
      limit: PAGE_SIZE,
      offset,
    });
    pageItems = result.items;
    total = result.total;
  } catch (err) {
    console.error('[cusco-hub] feed failed:', err);
  }

  const hasNext = offset + PAGE_SIZE < total;
  const listPath = getCuscoHubPath(categoria);
  const listName = `${copy.title} — listado`;
  const faqLd = buildFaqJsonLd(copy, listPath);

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
      {faqLd ? <JsonLd data={faqLd} /> : null}
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

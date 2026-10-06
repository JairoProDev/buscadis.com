import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import HomePageClient from '@/components/HomePageClient';
import HomeRouteFallback from '@/components/home/HomeRouteFallback';
import { CrawlableAdisoList } from '@/components/seo/CrawlableAdisoList';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildAdisoMetadata } from '@/lib/seo/adiso-metadata';
import { buildAdisoItemListJsonLd } from '@/lib/seo/adiso-jsonld';
import { buildBuscadisOrganizationJsonLd } from '@/lib/seo/organization-jsonld';
import { HomeCrawlerBrief } from '@/components/seo/HomeCrawlerBrief';
import { getBusinessProductAsAdiso, getMarketplaceFeed } from '@/lib/business';
import { getAdisoByIdFromSupabase } from '@/lib/supabase';
import {
  buildCategoryShareMetadata,
  isMarketplaceCategory,
} from '@/lib/seo/category-metadata';
import { getSearchPathFromQuery } from '@/lib/seo/search-url';

/** Cache home feed shell; modal/search still client-driven. Improves TTFB / RES on `/`. */
export const revalidate = 90;

const HOME_SSR_LIMIT = 24;

type PageProps = {
  searchParams: Promise<{
    adiso?: string;
    categoria?: string;
    [key: string]: string | string[] | undefined;
  }>;
};

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const params = await searchParams;

  const categoria =
    typeof params.categoria === 'string' ? params.categoria.trim().toLowerCase() : undefined;
  if (categoria && isMarketplaceCategory(categoria)) {
    const meta = buildCategoryShareMetadata(categoria, {
      urlPath: `/categoria/${categoria}`,
    });
    return {
      ...meta,
      alternates: { canonical: `/categoria/${categoria}` },
    };
  }

  const adisoId = typeof params.adiso === 'string' ? params.adiso : undefined;
  if (!adisoId && !categoria) {
    return {
      title: 'Buscadis — Clasificados y marketplace en Perú',
      description:
        'Buscadis: publica y encuentra adisos (empleos, inmuebles, vehículos, servicios y negocios). Navega sin cuenta; inicia sesión con Google para publicar. Operado por ADIS TECHNOLOGICAL PLATFORMS S.A.C.',
    };
  }
  if (!adisoId) return {};

  try {
    let adiso = await getAdisoByIdFromSupabase(adisoId);
    if (!adiso) {
      adiso = await getBusinessProductAsAdiso(adisoId);
    }
    if (!adiso) {
      return { title: 'Adiso no encontrado | Buscadis' };
    }
    return buildAdisoMetadata(adiso);
  } catch {
    return { title: 'Adiso no encontrado | Buscadis' };
  }
}

export default async function Home({ searchParams }: PageProps) {
  const params = await searchParams;
  const categoria =
    typeof params.categoria === 'string' && isMarketplaceCategory(params.categoria)
      ? params.categoria.trim().toLowerCase()
      : undefined;

  const adisoParam = typeof params.adiso === 'string' ? params.adiso : undefined;
  const buscarParam = typeof params.buscar === 'string' ? params.buscar.trim() : undefined;
  if (buscarParam && buscarParam.length >= 2 && !adisoParam) {
    redirect(getSearchPathFromQuery(buscarParam));
  }
  if (categoria && !adisoParam && !buscarParam) {
    const q = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (key === 'categoria' || value === undefined) continue;
      if (typeof value === 'string') q.set(key, value);
      else if (Array.isArray(value)) value.forEach((v) => q.append(key, v));
    }
    const qs = q.toString();
    redirect(`/categoria/${categoria}${qs ? `?${qs}` : ''}`);
  }

  let ssrAdisos: Awaited<ReturnType<typeof getMarketplaceFeed>> = [];
  try {
    ssrAdisos = await getMarketplaceFeed({
      limit: HOME_SSR_LIMIT,
      offset: 0,
      soloActivos: true,
      categoria,
    });
  } catch (err) {
    console.error('[home] SSR feed failed:', err);
  }

  const listPath = categoria ? `/categoria/${categoria}` : '/';
  const listName = categoria
    ? `Adisos de ${categoria} en Buscadis`
    : 'Adisos recientes en Buscadis';
  const isPlainHome =
    !categoria &&
    typeof params.adiso !== 'string' &&
    typeof params.buscar !== 'string';

  return (
    <>
      {isPlainHome ? <HomeCrawlerBrief /> : null}
      <JsonLd data={buildBuscadisOrganizationJsonLd()} />
      <JsonLd data={buildAdisoItemListJsonLd(ssrAdisos, { name: listName, urlPath: listPath })} />
      <CrawlableAdisoList adisos={ssrAdisos} heading={listName} visuallyHidden />
      <Suspense fallback={<HomeRouteFallback />}>
        <HomePageClient
          showLegalFooter={isPlainHome}
          initialFeedAdisos={ssrAdisos}
          initialSearchParams={{
            adiso: typeof params.adiso === 'string' ? params.adiso : undefined,
            categoria: typeof params.categoria === 'string' ? params.categoria : undefined,
            buscar: typeof params.buscar === 'string' ? params.buscar : undefined,
            seccion: typeof params.seccion === 'string' ? params.seccion : undefined,
          }}
        />
      </Suspense>
    </>
  );
}

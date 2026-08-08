import type { Metadata } from 'next';
import HomePageClient from '@/components/HomePageClient';
import { CrawlableAdisoList } from '@/components/seo/CrawlableAdisoList';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildAdisoMetadata } from '@/lib/seo/adiso-metadata';
import { buildAdisoItemListJsonLd } from '@/lib/seo/adiso-jsonld';
import { getBusinessProductAsAdiso, getMarketplaceFeed } from '@/lib/business';
import { getAdisoByIdFromSupabase } from '@/lib/supabase';
import {
  buildCategoryShareMetadata,
  isMarketplaceCategory,
} from '@/lib/seo/category-metadata';

export const dynamic = 'force-dynamic';

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
    return buildCategoryShareMetadata(categoria, {
      urlPath: `/?categoria=${categoria}`,
    });
  }

  const adisoId = typeof params.adiso === 'string' ? params.adiso : undefined;
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

  const listPath = categoria ? `/?categoria=${categoria}` : '/';
  const listName = categoria
    ? `Avisos de ${categoria} en Buscadis`
    : 'Avisos recientes en Buscadis';

  return (
    <>
      <JsonLd data={buildAdisoItemListJsonLd(ssrAdisos, { name: listName, urlPath: listPath })} />
      <CrawlableAdisoList
        adisos={ssrAdisos}
        heading={listName}
        visuallyHidden
      />
      <HomePageClient />
    </>
  );
}

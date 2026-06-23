import type { Metadata } from 'next';
import HomePageClient from '@/components/HomePageClient';
import { buildAdisoMetadata } from '@/lib/seo/adiso-metadata';
import { getBusinessProductAsAdiso } from '@/lib/business';
import { getAdisoByIdFromSupabase } from '@/lib/supabase';
import {
  buildCategoryShareMetadata,
  isMarketplaceCategory,
} from '@/lib/seo/category-metadata';

export const dynamic = 'force-dynamic';

type PageProps = {
  searchParams: Promise<{ adiso?: string; categoria?: string; [key: string]: string | string[] | undefined }>;
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

export default function Home() {
  return <HomePageClient />;
}

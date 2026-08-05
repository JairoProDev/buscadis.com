import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getBusinessProfileBySlugAdmin } from '@/lib/qr/get-business-admin';
import CoverPreview from './CoverPreview';

export const dynamic = 'force-dynamic';

/** Preview local de la portada del catálogo PDF. No se sirve en producción. */
export default async function CatalogPdfPreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ slug?: string }>;
}) {
  if (process.env.NODE_ENV === 'production') notFound();

  const { slug = 'quival' } = await searchParams;
  const profile = await getBusinessProfileBySlugAdmin(slug);
  if (!profile) notFound();

  const { count } = await supabaseAdmin
    .from('catalog_products')
    .select('id', { count: 'exact', head: true })
    .eq('business_profile_id', profile.id);

  return <CoverPreview profile={profile} productCount={count ?? 0} slug={slug} />;
}

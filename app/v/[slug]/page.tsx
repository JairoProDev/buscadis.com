import { notFound } from 'next/navigation';
import {
  DEMO_RETAIL_NEGOCIO,
  PerfilVivoRoot,
  negocioFromBusinessProfile,
} from '@buscadis/perfil-vivo';
import { getBusinessProfileBySlug } from '@/lib/business';
import { normalizeBusinessSlug } from '@/lib/business/normalize-slug';

export const revalidate = 60;

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function PerfilVivoPreviewPage({ params }: PageProps) {
  const { slug: raw } = await params;
  const slug = normalizeBusinessSlug(raw) || raw.toLowerCase();

  if (slug === 'demo') {
    return <PerfilVivoRoot negocio={DEMO_RETAIL_NEGOCIO} />;
  }

  const profile = await getBusinessProfileBySlug(slug);
  const negocio = profile ? negocioFromBusinessProfile(profile) : null;
  if (!negocio) notFound();

  return <PerfilVivoRoot negocio={negocio} />;
}

import { permanentRedirect } from 'next/navigation';
import type { Metadata } from 'next';
import { normalizeBusinessSlug } from '@/lib/business/normalize-slug';
import { getBusinessProfileBySlug } from '@/lib/business';
import { isPerfilVivoEnabled } from '@/lib/business/perfil-vivo-flag';
import { DEMO_META, isDemoPerfilVivoSlug } from '@buscadis/perfil-vivo/server';
import { PerfilVivoPageView, loadPerfilVivoPayload } from '@/components/business/PerfilVivoPageView';
import { buildPerfilVivoShareMetadata } from '@/lib/seo/perfil-vivo-metadata';

export const revalidate = 60;

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug: raw } = await params;
  const slug = normalizeBusinessSlug(raw) || raw.toLowerCase();

  if (!isDemoPerfilVivoSlug(slug)) {
    const profile = await getBusinessProfileBySlug(slug);
    if (profile && isPerfilVivoEnabled(profile)) {
      return {
        robots: { index: false, follow: true },
        alternates: { canonical: `https://buscadis.com/@${slug}` },
      };
    }
  }

  const payload = await loadPerfilVivoPayload(slug);
  if (!payload) return { robots: { index: false, follow: false } };

  if (isDemoPerfilVivoSlug(slug)) {
    const base = buildPerfilVivoShareMetadata({
      payload,
      canonicalPath: `/v/${slug}`,
      indexable: false,
      titleSuffix: 'Preview',
    });
    return {
      ...base,
      title: DEMO_META[slug].title,
      robots: { index: false, follow: false },
    };
  }

  return buildPerfilVivoShareMetadata({
    payload,
    canonicalPath: `/v/${slug}`,
    indexable: false,
    titleSuffix: 'Preview',
  });
}

export default async function PerfilVivoPreviewPage({ params }: PageProps) {
  const { slug: raw } = await params;
  const slug = normalizeBusinessSlug(raw) || raw.toLowerCase();

  if (!isDemoPerfilVivoSlug(slug)) {
    const profile = await getBusinessProfileBySlug(slug);
    if (profile && isPerfilVivoEnabled(profile)) {
      permanentRedirect(`/@${slug}`);
    }
  }

  return (
    <PerfilVivoPageView slug={slug} canonicalPath={`/v/${slug}`} indexable={false} />
  );
}

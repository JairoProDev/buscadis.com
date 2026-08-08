import type { Metadata } from 'next';
import { normalizeBusinessSlug } from '@/lib/business/normalize-slug';
import { getPublishedBusinessProfileBySlug } from '@/lib/business/get-public-profile';
import { buildLocalBusinessJsonLd } from '@/lib/business/seo';
import { JsonLd } from '@/components/seo/JsonLd';
import { isPerfilVivoEnabled } from '@/lib/business/perfil-vivo-flag';
import { PerfilVivoPageView } from '@/components/business/PerfilVivoPageView';
import PublicBusinessPageClient from './PublicBusinessPageClient';

export const revalidate = 60;

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

function firstParam(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0];
  return v;
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const sp = await searchParams;
  const slug = normalizeBusinessSlug(resolvedParams.slug);
  const isEdit = firstParam(sp.edit) === 'true';
  if (!slug || isEdit) return {};

  const profile = await getPublishedBusinessProfileBySlug(slug);
  if (!profile || !isPerfilVivoEnabled(profile)) return {};

  const distrito = profile.contact_address?.split(',').pop()?.trim() || 'Cusco';
  const title =
    profile.meta_title ||
    `${profile.name} — ${distrito} | Buscadis`;
  const description =
    profile.meta_description ||
    profile.tagline ||
    profile.description?.slice(0, 160) ||
    `${profile.name} en Buscadis. Horario, precios y WhatsApp.`;

  return {
    title,
    description,
    alternates: { canonical: `https://buscadis.com/@${slug}` },
    robots: {
      index: profile.is_published !== false,
      follow: true,
    },
    openGraph: {
      title,
      description,
      url: `https://buscadis.com/@${slug}`,
      images: profile.og_image_url || profile.logo_url
        ? [profile.og_image_url || profile.logo_url!]
        : undefined,
    },
  };
}

export default async function PublicBusinessPage({ params, searchParams }: PageProps) {
  const resolvedParams = await params;
  const sp = await searchParams;
  const slug = normalizeBusinessSlug(resolvedParams.slug);
  const isEdit = firstParam(sp.edit) === 'true';
  const initialProfile = slug ? await getPublishedBusinessProfileBySlug(slug) : null;

  // Hard cutover: público sirve Perfil Vivo; el editor (?edit=true) sigue en legacy
  if (slug && !isEdit && initialProfile && isPerfilVivoEnabled(initialProfile)) {
    return (
      <PerfilVivoPageView
        slug={slug}
        canonicalPath={`/@${slug}`}
        indexable={initialProfile.is_published !== false}
      />
    );
  }

  const jsonLd = initialProfile
    ? buildLocalBusinessJsonLd(initialProfile, [])
    : null;

  return (
    <>
      {jsonLd ? (
        <>
          <JsonLd data={jsonLd.localBusiness} />
          <JsonLd data={jsonLd.breadcrumb} />
        </>
      ) : null}
      <PublicBusinessPageClient
        params={params}
        searchParams={searchParams}
        initialProfile={initialProfile}
      />
    </>
  );
}

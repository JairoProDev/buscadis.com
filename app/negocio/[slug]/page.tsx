import { normalizeBusinessSlug } from '@/lib/business/normalize-slug';
import { getPublishedBusinessProfileBySlug } from '@/lib/business/get-public-profile';
import { buildLocalBusinessJsonLd } from '@/lib/business/seo';
import { JsonLd } from '@/components/seo/JsonLd';
import PublicBusinessPageClient from './PublicBusinessPageClient';

export const revalidate = 300;

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function PublicBusinessPage({ params, searchParams }: PageProps) {
  const resolvedParams = await params;
  const slug = normalizeBusinessSlug(resolvedParams.slug);
  const initialProfile = slug ? await getPublishedBusinessProfileBySlug(slug) : null;
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

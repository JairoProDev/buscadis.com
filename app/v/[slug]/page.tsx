import { permanentRedirect } from 'next/navigation';
import type { Metadata } from 'next';
import { normalizeBusinessSlug } from '@/lib/business/normalize-slug';
import { getBusinessProfileBySlug } from '@/lib/business';
import { isPerfilVivoEnabled } from '@/lib/business/perfil-vivo-flag';
import { PerfilVivoPageView, loadPerfilVivoPayload } from '@/components/business/PerfilVivoPageView';

export const revalidate = 60;

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug: raw } = await params;
  const slug = normalizeBusinessSlug(raw) || raw.toLowerCase();
  if (slug === 'demo') {
    return {
      title: 'Ferretería Demo Quival | Perfil Vivo',
      robots: { index: false, follow: false },
    };
  }
  const profile = await getBusinessProfileBySlug(slug);
  if (profile && isPerfilVivoEnabled(profile)) {
    return {
      robots: { index: false, follow: true },
      alternates: { canonical: `https://buscadis.com/@${slug}` },
    };
  }
  const payload = await loadPerfilVivoPayload(slug);
  if (!payload) return { robots: { index: false, follow: false } };
  const n = payload.negocio;
  const d = n.ubicacion?.distrito ?? 'Cusco';
  return {
    title: `${n.nombre} — ${n.categoria.nombre} en ${d} | Preview`,
    description: n.eslogan || `${n.categoria.nombre} en ${d}. Precios y WhatsApp en Buscadis.`,
    robots: { index: false, follow: false },
  };
}

export default async function PerfilVivoPreviewPage({ params }: PageProps) {
  const { slug: raw } = await params;
  const slug = normalizeBusinessSlug(raw) || raw.toLowerCase();

  if (slug !== 'demo') {
    const profile = await getBusinessProfileBySlug(slug);
    if (profile && isPerfilVivoEnabled(profile)) {
      permanentRedirect(`/@${slug}`);
    }
  }

  return (
    <PerfilVivoPageView slug={slug} canonicalPath={`/v/${slug}`} indexable={false} />
  );
}

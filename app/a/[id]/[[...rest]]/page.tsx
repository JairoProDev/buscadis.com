import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getAdisoByIdFromSupabase } from '@/lib/supabase';
import { getBusinessProductAsAdiso } from '@/lib/business';
import { getIdFromSlug, getAdisoUrl, createAdisoTitleSlug } from '@/lib/url';
import ClientAdisoWrapper from '@/components/ClientAdisoWrapper';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildAdisoMetadata } from '@/lib/seo/adiso-metadata';
import { buildAdisoProductJsonLd } from '@/lib/seo/adiso-jsonld';
import type { Adiso } from '@/types';

export const revalidate = 3600;

interface PageProps {
  params: Promise<{ id: string; rest?: string[] }>;
}

async function loadAdiso(rawId: string): Promise<Adiso | null> {
  const id = getIdFromSlug(rawId) || rawId;
  if (!id) return null;
  let adiso = await getAdisoByIdFromSupabase(id);
  if (!adiso) {
    adiso = await getBusinessProductAsAdiso(id);
  }
  return adiso;
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { id } = await props.params;
  const adiso = await loadAdiso(id);
  if (!adiso) return { title: 'Adiso no encontrado | Buscadis' };
  return buildAdisoMetadata(adiso);
}

/**
 * Página dedicada del aviso.
 * - `/a/{id}` — id corto → redirige a `/a/{id}/{slug}`
 * - `/a/{id}/{titulo-slug}` — canónica SEO
 */
export default async function AdisoShortPage(props: PageProps) {
  const { id: rawId, rest } = await props.params;
  const id = getIdFromSlug(rawId) || rawId;
  const adiso = await loadAdiso(id);

  if (!adiso) {
    notFound();
  }

  const expectedSlug = createAdisoTitleSlug(adiso.titulo);
  const currentSlug = rest?.[0];
  if (!currentSlug || currentSlug !== expectedSlug || (rest && rest.length > 1)) {
    redirect(getAdisoUrl(adiso));
  }

  return (
    <>
      <JsonLd data={buildAdisoProductJsonLd(adiso)} />
      <ClientAdisoWrapper id={adiso.id} initialAdiso={adiso} />
    </>
  );
}

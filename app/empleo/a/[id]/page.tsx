import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Sofia_Sans_Condensed, Source_Sans_3 } from 'next/font/google';
import { getAdisoByIdFromSupabase } from '@/lib/supabase';
import { empleoDeAtributos } from '@/lib/empleo/model';
import { getSiteUrl } from '@/lib/seo/og-image';
import { AvisoPublico } from '@/components/empleo/AvisoPublico';
import { JsonLd } from '@/components/seo/JsonLd';

const display = Sofia_Sans_Condensed({ subsets: ['latin'], weight: ['700', '800'], variable: '--font-aviso' });
const body = Source_Sans_3({ subsets: ['latin'], weight: ['400', '600', '700'], variable: '--font-aviso-body' });

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const adiso = await getAdisoByIdFromSupabase(id);
  const aviso = empleoDeAtributos(adiso?.atributos);
  if (!adiso || !aviso) return { title: 'Aviso no encontrado | Buscadis' };
  return {
    title: `${aviso.puesto} en ${aviso.negocio} | Buscadis`,
    description: adiso.descripcion,
  };
}

export default async function AvisoEmpleoPage({ params }: Props) {
  const { id } = await params;
  const adiso = await getAdisoByIdFromSupabase(id);
  const aviso = empleoDeAtributos(adiso?.atributos);
  if (!adiso || !aviso || adiso.categoria !== 'empleos') notFound();

  const url = `${getSiteUrl()}/empleo/a/${id}`;
  const activa = adiso.estaActivo !== false;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: aviso.puesto,
    description: adiso.descripcion,
    datePosted: adiso.fechaPublicacion,
    validThrough: adiso.expiresAt || adiso.fechaExpiracion,
    hiringOrganization: { '@type': 'Organization', name: aviso.negocio },
    jobLocation: {
      '@type': 'Place',
      address: { '@type': 'PostalAddress', addressLocality: aviso.zona, addressCountry: 'PE' },
    },
    directApply: true,
  };

  return (
    <div className={`${display.variable} ${body.variable}`}>
      {activa ? <JsonLd data={jsonLd} /> : null}
      <AvisoPublico aviso={aviso} url={url} activa={activa} />
    </div>
  );
}

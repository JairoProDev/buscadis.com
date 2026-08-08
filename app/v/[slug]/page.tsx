import { notFound } from 'next/navigation';
import { PerfilVivoRoot } from '@buscadis/perfil-vivo';
import type { PerfilPayload } from '@buscadis/perfil-vivo';
import {
  buildDemoRetailPayload,
  buildHandoffLinks,
  buildPerfilPayloadFromSources,
  formatPrecio,
} from '@buscadis/perfil-vivo/server';
import {
  getBusinessCatalog,
  getBusinessProfileBySlug,
} from '@/lib/business';
import { normalizeBusinessSlug } from '@/lib/business/normalize-slug';

export const revalidate = 60;

type PageProps = {
  params: Promise<{ slug: string }>;
};

function jsonLdForPayload(payload: PerfilPayload) {
  const { negocio, productos } = payload;
  const u = negocio.ubicacion;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'LocalBusiness',
        '@id': `https://buscadis.com/v/${negocio.slug}#negocio`,
        name: negocio.nombre,
        description:
          negocio.eslogan ??
          `${negocio.categoria.nombre} en ${u?.distrito ?? 'Cusco'}`,
        url: `https://buscadis.com/v/${negocio.slug}`,
        telephone: negocio.contacto.telefono,
        address: u
          ? {
              '@type': 'PostalAddress',
              streetAddress: u.direccion,
              addressLocality: u.distrito,
              addressRegion: u.provincia,
              addressCountry: 'PE',
            }
          : undefined,
        geo: u
          ? {
              '@type': 'GeoCoordinates',
              latitude: u.lat,
              longitude: u.lng,
            }
          : undefined,
      },
      ...productos.slice(0, 8).map((p) => ({
        '@type': 'Product',
        name: p.nombre,
        description: p.descripcion,
        image: p.imagenes[0]?.url,
        offers: p.precio
          ? {
              '@type': 'Offer',
              priceCurrency: p.precio.moneda,
              price: p.precio.valor,
              availability:
                p.disponibilidad === 'agotado'
                  ? 'https://schema.org/OutOfStock'
                  : 'https://schema.org/InStock',
            }
          : undefined,
      })),
    ],
  };
}

async function payloadForSlug(slug: string): Promise<PerfilPayload | null> {
  if (slug === 'demo') return buildDemoRetailPayload();

  const profile = await getBusinessProfileBySlug(slug);
  if (!profile) return null;

  const catalog = await getBusinessCatalog(profile.id);
  return buildPerfilPayloadFromSources({
    profileRow: profile,
    catalogRows: catalog,
  });
}

export default async function PerfilVivoPreviewPage({ params }: PageProps) {
  const { slug: raw } = await params;
  const slug = normalizeBusinessSlug(raw) || raw.toLowerCase();

  const payload = await payloadForSlug(slug);
  if (!payload) notFound();

  const handoffs = buildHandoffLinks(payload);
  const ld = jsonLdForPayload(payload);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
      />
      <span
        className="sr-only"
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          overflow: 'hidden',
        }}
      >
        {payload.negocio.nombre}
        {payload.productos[0]?.precio
          ? ` ${formatPrecio(payload.productos[0].precio.valor)}`
          : ''}
      </span>
      <PerfilVivoRoot payload={payload} handoffs={handoffs} />
    </>
  );
}

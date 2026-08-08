import { notFound } from 'next/navigation';
import { PerfilVivoRoot } from '@buscadis/perfil-vivo';
import type { PerfilPayload } from '@buscadis/perfil-vivo';
import {
  buildDemoPerfilVivoPayload,
  isDemoPerfilVivoSlug,
  buildHandoffLinks,
  buildPerfilPayloadFromSources,
  sanitizePerfilPayload,
} from '@buscadis/perfil-vivo/server';
import {
  getBusinessCatalog,
  getBusinessProfileBySlug,
} from '@/lib/business';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { PerfilVivoAnalytics } from '@/components/business/PerfilVivoAnalytics';
import '@buscadis/perfil-vivo/chrome.css';

async function fetchReviewRows(businessProfileId: string) {
  if (!supabaseAdmin) return [];
  const { data, error } = await supabaseAdmin
    .from('business_reviews')
    .select(
      'id, rating, text, comment, verified_purchase, is_verified, created_at, customer_name, response_text, responded_at'
    )
    .eq('business_profile_id', businessProfileId)
    .or('is_visible.is.null,is_visible.eq.true')
    .order('created_at', { ascending: false })
    .limit(40);
  if (error) {
    console.error('[perfil-vivo] reviews', error.message);
    return [];
  }
  return data || [];
}

export function buildPerfilVivoJsonLd(payload: PerfilPayload, canonicalPath: string) {
  const { negocio, productos, resenas, metricas, faqs } = payload;
  const u = negocio.ubicacion;
  const base = `https://buscadis.com${canonicalPath}`;
  const graph: Record<string, unknown>[] = [
    {
      '@type': 'LocalBusiness',
      '@id': `${base}#negocio`,
      name: negocio.nombre,
      description:
        payload.nosotros?.texto?.slice(0, 300) ??
        negocio.eslogan ??
        `${negocio.categoria.nombre} en ${u?.distrito ?? 'Cusco'}`,
      url: base,
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
      ...(metricas?.calificacion && metricas.calificacion.total > 0
        ? {
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: metricas.calificacion.promedio,
              reviewCount: metricas.calificacion.total,
            },
          }
        : {}),
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
    ...resenas.slice(0, 5).map((r) => ({
      '@type': 'Review',
      reviewRating: { '@type': 'Rating', ratingValue: r.estrellas },
      author: { '@type': 'Person', name: r.autor.nombre },
      reviewBody: r.texto,
      datePublished: r.creadaEn,
    })),
  ];

  if (faqs.length >= 2) {
    graph.push({
      '@type': 'FAQPage',
      '@id': `${base}#faq`,
      mainEntity: faqs.map((f) => ({
        '@type': 'Question',
        name: f.pregunta,
        acceptedAnswer: { '@type': 'Answer', text: f.respuesta },
      })),
    });
  }

  return { '@context': 'https://schema.org', '@graph': graph };
}

export async function loadPerfilVivoPayload(
  slug: string
): Promise<PerfilPayload | null> {
  const demo = buildDemoPerfilVivoPayload(slug);
  if (demo) return sanitizePerfilPayload(demo);

  const profile = await getBusinessProfileBySlug(slug);
  if (!profile) return null;

  const [catalog, reviews] = await Promise.all([
    getBusinessCatalog(profile.id),
    fetchReviewRows(profile.id),
  ]);

  const payload = buildPerfilPayloadFromSources({
    profileRow: profile,
    catalogRows: catalog,
    reviewRows: reviews,
  });
  return payload ? sanitizePerfilPayload(payload) : null;
}

/** Payload + producto concreto (aunque no esté en destacados del carrusel). */
export async function loadProductoEnPerfil(slug: string, productoId: string) {
  if (isDemoPerfilVivoSlug(slug)) {
    const payload = sanitizePerfilPayload(buildDemoPerfilVivoPayload(slug)!);
    const producto = payload.productos.find((p) => p.id === productoId) ?? null;
    return { payload, producto };
  }

  const profile = await getBusinessProfileBySlug(slug);
  if (!profile) return { payload: null, producto: null };

  const [catalog, reviews] = await Promise.all([
    getBusinessCatalog(profile.id),
    fetchReviewRows(profile.id),
  ]);

  const payload = buildPerfilPayloadFromSources({
    profileRow: profile,
    catalogRows: catalog,
    reviewRows: reviews,
  });
  if (!payload) return { payload: null, producto: null };
  const sanitized = sanitizePerfilPayload(payload);

  const { productoFromCatalogRow } = await import('@buscadis/perfil-vivo/server');
  const row = (catalog as Record<string, unknown>[]).find(
    (r) => String(r.id) === productoId
  );
  let producto = sanitized.productos.find((p) => p.id === productoId) ?? null;
  if (!producto && row) {
    producto = productoFromCatalogRow(row, sanitized.negocio.id);
  }

  return { payload: sanitized, producto };
}

/** Render compartido /v y cutover /@ */
export async function PerfilVivoPageView({
  slug,
  canonicalPath,
  indexable,
}: {
  slug: string;
  /** Path canónico para JSON-LD (ej. /@slug o /v/slug) */
  canonicalPath: string;
  indexable: boolean;
}) {
  const payload = await loadPerfilVivoPayload(slug);
  if (!payload) notFound();

  const handoffs = buildHandoffLinks(payload);
  const ld = buildPerfilVivoJsonLd(payload, canonicalPath);

  return (
    <>
      {!indexable ? (
        <meta name="robots" content="noindex,nofollow" />
      ) : null}
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
        {`${payload.negocio.nombre} es ${payload.negocio.categoria.nombre} en ${
          payload.negocio.ubicacion?.distrito ?? 'Cusco'
        }. ${
          payload.nosotros?.texto?.slice(0, 120) ||
          payload.negocio.eslogan ||
          'Precios, horario y contacto por WhatsApp en Buscadis.'
        }`}
      </span>
      <PerfilVivoAnalytics
        businessProfileId={payload.negocio.id}
        slug={payload.negocio.slug}
        arquetipo={payload.negocio.arquetipo}
      />
      <PerfilVivoRoot payload={payload} handoffs={handoffs} />
    </>
  );
}

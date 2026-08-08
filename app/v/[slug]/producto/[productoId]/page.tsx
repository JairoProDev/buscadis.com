import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  buildHandoffLinks,
  formatPrecio,
  crearHandoffWhatsApp,
  mensajeWhatsAppProducto,
} from '@buscadis/perfil-vivo/server';
import { normalizeBusinessSlug } from '@/lib/business/normalize-slug';
import { getBusinessProfileBySlug } from '@/lib/business';
import { isPerfilVivoEnabled } from '@/lib/business/perfil-vivo-flag';
import { loadProductoEnPerfil } from '@/components/business/PerfilVivoPageView';
import { PerfilVivoWaLink } from '@/components/business/PerfilVivoWaLink';
import '@buscadis/perfil-vivo/chrome.css';

export const revalidate = 60;

type PageProps = {
  params: Promise<{ slug: string; productoId: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug: raw, productoId } = await params;
  const slug = normalizeBusinessSlug(raw) || raw.toLowerCase();
  const { payload, producto } = await loadProductoEnPerfil(slug, productoId);
  if (!payload || !producto) {
    return { robots: { index: false, follow: false } };
  }

  const profile = slug === 'demo' ? null : await getBusinessProfileBySlug(slug);
  const cutover = profile ? isPerfilVivoEnabled(profile) : false;
  const canonical = cutover
    ? `https://buscadis.com/@${slug}/producto/${productoId}`
    : `https://buscadis.com/v/${slug}/producto/${productoId}`;

  const d = payload.negocio.ubicacion?.distrito ?? 'Cusco';
  const precio =
    producto.precio != null
      ? formatPrecio(producto.precio.valor, producto.precio.moneda)
      : null;
  const title = `${producto.nombre}${precio ? ` — ${precio}` : ''} | ${payload.negocio.nombre}`;
  const description =
    producto.descripcion?.slice(0, 160) ||
    `${producto.nombre} en ${payload.negocio.nombre} (${d}). Consulta por WhatsApp en Buscadis.`;

  return {
    title,
    description,
    alternates: { canonical },
    robots: {
      index: slug !== 'demo',
      follow: true,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      images: producto.imagenes[0]?.url ? [producto.imagenes[0].url] : undefined,
    },
  };
}

export default async function ProductoPerfilVivoPage({ params }: PageProps) {
  const { slug: raw, productoId } = await params;
  const slug = normalizeBusinessSlug(raw) || raw.toLowerCase();
  const { payload, producto } = await loadProductoEnPerfil(slug, productoId);
  if (!payload || !producto) notFound();

  const profile = slug === 'demo' ? null : await getBusinessProfileBySlug(slug);
  const cutover = profile ? isPerfilVivoEnabled(profile) : false;

  const handoffs = buildHandoffLinks({
    ...payload,
    productos: payload.productos.some((p) => p.id === producto.id)
      ? payload.productos
      : [...payload.productos, producto],
  });
  let wa = handoffs.productoWhatsapp[producto.id] ?? null;
  if (!wa && payload.negocio.contacto.whatsapp) {
    const precioLabel =
      producto.precio != null
        ? formatPrecio(producto.precio.valor, producto.precio.moneda)
        : undefined;
    wa = crearHandoffWhatsApp({
      negocioId: payload.negocio.id,
      slug: payload.negocio.slug,
      phone: payload.negocio.contacto.whatsapp,
      nombre: payload.negocio.nombre,
      modulo: 'producto',
      productoId: producto.id,
      mensaje: mensajeWhatsAppProducto(
        payload.negocio.nombre,
        producto.nombre,
        precioLabel
      ),
    });
  }

  const precio = producto.precio
    ? formatPrecio(producto.precio.valor, producto.precio.moneda)
    : null;
  const perfilHref = cutover ? `/@${slug}` : `/v/${slug}`;
  const img = producto.imagenes[0];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: producto.nombre,
    description: producto.descripcion,
    image: img?.url,
    brand: { '@type': 'Brand', name: payload.negocio.nombre },
    offers: producto.precio
      ? {
          '@type': 'Offer',
          priceCurrency: producto.precio.moneda,
          price: producto.precio.valor,
          availability:
            producto.disponibilidad === 'agotado'
              ? 'https://schema.org/OutOfStock'
              : 'https://schema.org/InStock',
          url: cutover
            ? `https://buscadis.com/@${slug}/producto/${productoId}`
            : `https://buscadis.com/v/${slug}/producto/${productoId}`,
          seller: {
            '@type': 'Organization',
            name: payload.negocio.nombre,
          },
        }
      : undefined,
  };

  return (
    <main
      className="pv-root"
      data-theme="light"
      style={{
        maxWidth: 480,
        margin: '0 auto',
        minHeight: '100dvh',
        background: 'var(--sf-base, #f7f6f9)',
        color: 'var(--tx-base, #3a3843)',
        paddingBottom: 96,
      }}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <header style={{ padding: '12px 16px' }}>
        <Link
          href={perfilHref}
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: 'var(--mk-accion, #1f4fd8)',
            textDecoration: 'none',
          }}
        >
          ← {payload.negocio.nombre}
        </Link>
      </header>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={img?.url}
        alt={img?.alt ?? producto.nombre}
        width={480}
        height={480}
        fetchPriority="high"
        style={{
          width: '100%',
          aspectRatio: '1 / 1',
          objectFit: 'cover',
          background: '#eee',
        }}
      />

      <div style={{ padding: '16px 16px 24px' }}>
        <h1
          style={{
            margin: '0 0 8px',
            fontSize: 26,
            lineHeight: 1.2,
            letterSpacing: '-0.02em',
            color: 'var(--tx-strong, #131218)',
          }}
        >
          {producto.nombre}
        </h1>
        {precio ? (
          <p
            style={{
              margin: '0 0 12px',
              fontSize: 22,
              fontWeight: 800,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {precio}
            {producto.precioAnterior ? (
              <span
                style={{
                  marginLeft: 8,
                  fontSize: 14,
                  color: '#8a8794',
                  textDecoration: 'line-through',
                  fontWeight: 500,
                }}
              >
                {formatPrecio(producto.precioAnterior)}
              </span>
            ) : null}
          </p>
        ) : null}

        {producto.disponibilidad === 'agotado' ? (
          <p style={{ margin: '0 0 12px', fontWeight: 700, color: '#b42318' }}>Agotado</p>
        ) : producto.disponibilidad === 'ultimas_unidades' ? (
          <p style={{ margin: '0 0 12px', fontWeight: 600, color: '#b54708' }}>
            Últimas unidades
          </p>
        ) : null}

        {producto.descripcion ? (
          <p style={{ margin: 0, fontSize: 16, lineHeight: 1.45, color: '#3a3843' }}>
            {producto.descripcion}
          </p>
        ) : null}

        <p style={{ margin: '16px 0 0', fontSize: 14, color: '#6e6b78' }}>
          {payload.negocio.categoria.nombre}
          {payload.negocio.ubicacion?.distrito
            ? ` · ${payload.negocio.ubicacion.distrito}`
            : ''}
        </p>
      </div>

      <div
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          maxWidth: 480,
          margin: '0 auto',
          padding: 12,
          background: 'rgba(247,246,249,0.96)',
          borderTop: '1px solid #e6e4ec',
          display: 'grid',
          gap: 8,
        }}
      >
        {wa ? (
          <PerfilVivoWaLink
            href={wa}
            businessProfileId={payload.negocio.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 52,
              borderRadius: 14,
              background: '#1F4FD8',
              color: '#fff',
              fontWeight: 700,
              fontSize: 17,
              textDecoration: 'none',
            }}
          >
            Preguntar por este producto
          </PerfilVivoWaLink>
        ) : null}
        <Link
          href={perfilHref}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 44,
            fontSize: 15,
            fontWeight: 600,
            color: '#3a3843',
            textDecoration: 'none',
          }}
        >
          Ver todo el perfil
        </Link>
      </div>
    </main>
  );
}

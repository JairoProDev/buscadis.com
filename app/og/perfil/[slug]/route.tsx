import { formatPrecio } from '@buscadis/perfil-vivo';
import { ImageResponse } from 'next/og';
import { loadPerfilVivoPayload } from '@/components/business/PerfilVivoPageView';

export const runtime = 'nodejs';
export const revalidate = 60;

type RouteProps = {
  params: Promise<{ slug: string }>;
};

/** OG 1200×630 — logo/nombre/distrito/rating + hasta 3 productos (08 SEO). */
export async function GET(_req: Request, { params }: RouteProps) {
  const { slug: raw } = await params;
  const slug = decodeURIComponent(raw || '').toLowerCase();
  const payload = await loadPerfilVivoPayload(slug);

  if (!payload) {
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#131218',
            color: '#fff',
            fontSize: 48,
            fontFamily: 'sans-serif',
          }}
        >
          Buscadis
        </div>
      ),
      { width: 1200, height: 630 }
    );
  }

  const { negocio, productos, metricas } = payload;
  const seed = negocio.identidad.colorSemilla || '#1F4FD8';
  const distrito = negocio.ubicacion?.distrito || 'Cusco';
  const rating = metricas?.calificacion;
  const top = productos.filter((p) => p.activo).slice(0, 3);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: `linear-gradient(145deg, ${seed} 0%, #131218 72%)`,
          color: '#FFFFFF',
          padding: 56,
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            width: '100%',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              maxWidth: 820,
            }}
          >
            <div
              style={{
                display: 'flex',
                fontSize: 28,
                opacity: 0.85,
                marginBottom: 12,
                letterSpacing: 1,
              }}
            >
              {negocio.categoria.nombre} · {distrito}
            </div>
            <div
              style={{
                display: 'flex',
                fontSize: 64,
                fontWeight: 700,
                lineHeight: 1.1,
                letterSpacing: -1,
              }}
            >
              {negocio.nombre}
            </div>
            {negocio.eslogan ? (
              <div
                style={{
                  display: 'flex',
                  fontSize: 28,
                  marginTop: 16,
                  opacity: 0.9,
                  maxWidth: 780,
                }}
              >
                {negocio.eslogan.slice(0, 90)}
              </div>
            ) : null}
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              fontSize: 22,
              opacity: 0.9,
            }}
          >
            <div style={{ display: 'flex', fontWeight: 700 }}>Buscadis</div>
            {rating && rating.total > 0 ? (
              <div style={{ display: 'flex', marginTop: 8, fontSize: 26 }}>
                {rating.promedio.toFixed(1)} / 5 · {rating.total} resenas
              </div>
            ) : null}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 20,
            marginTop: 'auto',
            width: '100%',
          }}
        >
          {top.length > 0 ? (
            top.map((p) => (
              <div
                key={p.id}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  background: 'rgba(255,255,255,0.12)',
                  borderRadius: 16,
                  padding: '20px 22px',
                  minHeight: 120,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    fontSize: 26,
                    fontWeight: 700,
                    lineHeight: 1.25,
                  }}
                >
                  {p.nombre.slice(0, 42)}
                </div>
                {p.precio ? (
                  <div style={{ display: 'flex', marginTop: 10, fontSize: 24, opacity: 0.95 }}>
                    {p.precio.tipo === 'desde' ? 'Desde ' : ''}
                    {formatPrecio(p.precio.valor, p.precio.moneda)}
                  </div>
                ) : null}
              </div>
            ))
          ) : (
            <div
              style={{
                display: 'flex',
                fontSize: 28,
                opacity: 0.9,
                padding: '20px 0',
              }}
            >
              Horario, ubicacion y WhatsApp en el perfil
            </div>
          )}
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}

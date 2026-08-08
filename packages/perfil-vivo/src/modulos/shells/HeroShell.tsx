import type { Negocio } from '../../types';

function iniciales(nombre: string): string {
  const parts = nombre.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? '').join('') || 'B';
}

const NIVEL_LABEL: Record<number, string> = {
  0: '',
  1: 'Registrado',
  2: 'Verificado',
  3: 'Verificado en local',
};

export function HeroShell({ negocio }: { negocio: Negocio }) {
  const distrito = negocio.ubicacion?.distrito ?? 'Cusco';
  const meta = `${negocio.categoria.nombre} · ${distrito}`;
  const nivel = negocio.verificacion.nivel;
  const portada = negocio.identidad.portadaUrl;

  return (
    <header className="pv-modulo" id="identidad">
      <div
        style={{
          marginLeft: 'calc(-1 * var(--sp-4))',
          marginRight: 'calc(-1 * var(--sp-4))',
        }}
      >
        <div
          style={{
            height: 150,
            background: portada
              ? `center/cover url(${portada})`
              : 'var(--mk-suave)',
            backgroundImage: portada
              ? undefined
              : 'radial-gradient(circle at 20% 30%, rgba(19,18,24,.06), transparent 50%)',
            position: 'relative',
          }}
        >
          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(180deg, transparent 0%, rgba(0,0,0,.55) 85%)',
            }}
          />
        </div>
        <div
          style={{
            padding: '0 var(--sp-4)',
            marginTop: -32,
            display: 'flex',
            gap: 12,
            alignItems: 'flex-end',
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 'var(--rd-lg)',
              border: '2px solid var(--sf-elev)',
              background: negocio.identidad.logoUrl
                ? `center/cover url(${negocio.identidad.logoUrl})`
                : 'var(--mk-accion)',
              color: 'var(--mk-sobre)',
              display: 'grid',
              placeItems: 'center',
              font: '700 22px/1 var(--ff-display)',
              flexShrink: 0,
            }}
            aria-hidden
          >
            {!negocio.identidad.logoUrl ? iniciales(negocio.nombre) : null}
          </div>
          <div style={{ paddingBottom: 8, minWidth: 0 }}>
            <h1
              style={{
                font: 'var(--ts-nombre)',
                color: 'var(--tx-strong)',
                margin: '0 0 4px',
                letterSpacing: '-0.02em',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                flexWrap: 'wrap',
              }}
            >
              <span>{negocio.nombre}</span>
              {nivel >= 1 ? (
                <button
                  type="button"
                  title={NIVEL_LABEL[nivel]}
                  aria-label={`Verificación: ${NIVEL_LABEL[nivel]}`}
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    border: 'none',
                    padding: 0,
                    background: nivel >= 2 ? 'var(--bs-chicha)' : 'var(--tx-muted)',
                    color: '#fff',
                    fontSize: 11,
                    lineHeight: '18px',
                    cursor: 'pointer',
                  }}
                >
                  ✓
                </button>
              ) : null}
            </h1>
            <p
              style={{
                font: 'var(--ts-meta)',
                color: 'var(--tx-muted)',
                margin: 0,
              }}
            >
              {meta}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}

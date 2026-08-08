import type { Negocio } from '../../types';

const styles = {
  wrap: {
    marginLeft: 'calc(-1 * var(--sp-4))',
    marginRight: 'calc(-1 * var(--sp-4))',
  } as const,
  portada: {
    height: 150,
    background: 'var(--mk-suave)',
    backgroundImage:
      'radial-gradient(circle at 20% 30%, rgba(19,18,24,.06), transparent 50%)',
  } as const,
  body: {
    padding: '0 var(--sp-4)',
    marginTop: -32,
    display: 'flex',
    gap: 12,
    alignItems: 'flex-end',
  } as const,
  logo: {
    width: 64,
    height: 64,
    borderRadius: 'var(--rd-lg)',
    border: '2px solid var(--sf-elev)',
    background: 'var(--mk-accion)',
    color: 'var(--mk-sobre)',
    display: 'grid',
    placeItems: 'center',
    font: '700 22px/1 var(--ff-display)',
    flexShrink: 0,
  } as const,
  name: {
    font: 'var(--ts-nombre)',
    color: 'var(--tx-strong)',
    margin: '0 0 4px',
    letterSpacing: '-0.02em',
  } as const,
  meta: {
    font: 'var(--ts-meta)',
    color: 'var(--tx-muted)',
    margin: 0,
  } as const,
};

function iniciales(nombre: string): string {
  const parts = nombre.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? '').join('') || 'B';
}

export function HeroShell({ negocio }: { negocio: Negocio }) {
  const distrito = negocio.ubicacion?.distrito ?? 'Cusco';
  const meta = `${negocio.categoria.nombre} · ${distrito}`;

  return (
    <header className="pv-modulo" id="identidad" style={styles.wrap}>
      <div style={styles.portada} aria-hidden />
      <div style={styles.body}>
        <div style={styles.logo} aria-hidden>
          {iniciales(negocio.nombre)}
        </div>
        <div style={{ paddingBottom: 8, minWidth: 0 }}>
          <h1 style={styles.name}>{negocio.nombre}</h1>
          <p style={styles.meta}>{meta}</p>
        </div>
      </div>
    </header>
  );
}

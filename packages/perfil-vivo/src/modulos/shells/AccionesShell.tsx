import type { Negocio } from '../../types';

export function AccionesShell({ negocio }: { negocio: Negocio }) {
  const hasWa = Boolean(negocio.contacto.whatsapp);

  return (
    <section className="pv-modulo" id="acciones" aria-label="Acciones rápidas">
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        <button
          type="button"
          disabled={!hasWa}
          style={{
            minHeight: 44,
            border: 'none',
            borderRadius: 'var(--rd-md)',
            background: 'var(--mk-accion)',
            color: 'var(--mk-sobre)',
            font: 'var(--ts-card)',
            opacity: hasWa ? 1 : 0.55,
            cursor: hasWa ? 'pointer' : 'not-allowed',
          }}
        >
          Escribir por WhatsApp
        </button>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 8,
          }}
        >
          <button
            type="button"
            disabled={!negocio.contacto.telefono}
            style={{
              minHeight: 44,
              borderRadius: 'var(--rd-md)',
              border: '1px solid var(--bd-soft)',
              background: 'var(--sf-elev)',
              color: 'var(--tx-base)',
              font: 'var(--ts-meta)',
            }}
          >
            Llamar
          </button>
          <button
            type="button"
            disabled={!negocio.ubicacion}
            style={{
              minHeight: 44,
              borderRadius: 'var(--rd-md)',
              border: '1px solid var(--bd-soft)',
              background: 'var(--sf-elev)',
              color: 'var(--tx-base)',
              font: 'var(--ts-meta)',
            }}
          >
            Cómo llegar
          </button>
        </div>
      </div>
    </section>
  );
}

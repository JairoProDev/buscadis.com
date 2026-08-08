/** Solo se monta si minDatos de catálogo se cumple. */
export function CatalogoShell({ titulo }: { titulo: string }) {
  return (
    <section className="pv-modulo" id="catalogo">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          minHeight: 44,
          marginBottom: 12,
        }}
      >
        <h2 style={{ margin: 0, font: 'var(--ts-modulo)', color: 'var(--tx-strong)' }}>
          {titulo}
        </h2>
      </div>
      <p style={{ margin: 0, font: 'var(--ts-meta)', color: 'var(--tx-muted)' }}>
        Catálogo listo para productos destacados.
      </p>
    </section>
  );
}

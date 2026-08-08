export function EstadoShell() {
  return (
    <section
      className="pv-modulo"
      id="estado"
      aria-live="polite"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        minHeight: 32,
        font: 'var(--ts-meta)',
        color: 'var(--tx-muted)',
      }}
    >
      <span
        aria-hidden
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: 'var(--tx-faint)',
          flexShrink: 0,
        }}
      />
      <span>Horario no publicado</span>
    </section>
  );
}

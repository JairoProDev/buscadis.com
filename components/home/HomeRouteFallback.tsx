/** Shown while the home RSC payload streams — avoids a blank “Cargando…” screen in WebView. */
export default function HomeRouteFallback() {
  return (
    <div
      className="brand-mesh-bg"
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          height: 'var(--bs-header-height, 56px)',
          borderBottom: '1px solid var(--border-color)',
          background: 'var(--bg-primary)',
        }}
      />
      <div style={{ flex: 1, padding: '1rem' }}>
        <div
          style={{
            height: 48,
            borderRadius: 12,
            background: 'var(--bg-secondary)',
            marginBottom: 12,
          }}
        />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 10,
          }}
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              style={{
                height: 140,
                borderRadius: 12,
                background: 'var(--bg-secondary)',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

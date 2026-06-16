import Link from 'next/link';

export default function FeedPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: '2rem',
        background: 'var(--bg-secondary)',
        color: 'var(--text-primary)'
      }}
    >
      <section
        style={{
          width: '100%',
          maxWidth: '680px',
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '1.5rem',
          boxShadow: '0 10px 30px rgba(0,0,0,0.06)'
        }}
      >
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          Deals — promos, ofertas y oportunidades
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.6 }}>
          Aquí vivirá tu red social comercial: shorts de promociones, reels de ofertas, lives de
          shopping y contenido UGC de negocios. Entra porque quieres que te ofrezcan cosas — y ver si
          te animas a comprar.
        </p>
        <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
          Estamos construyendo la experiencia. Mientras tanto, explora el marketplace desde Inicio.
        </p>
        <Link
          href="/"
          style={{
            display: 'inline-block',
            background: 'var(--brand-blue)',
            color: 'white',
            fontWeight: 700,
            textDecoration: 'none',
            borderRadius: '10px',
            padding: '0.65rem 1rem'
          }}
        >
          Ir al inicio
        </Link>
      </section>
    </main>
  );
}

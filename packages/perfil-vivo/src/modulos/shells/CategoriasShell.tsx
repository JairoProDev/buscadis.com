'use client';

import { usePerfil } from '../PerfilContext';

/**
 * §6 lite — chips de categoría cuando hay ≥3 grupos en productos.
 * Filtra el catálogo vía hash #catalogo + data attribute (scroll); el filtro
 * visual real lo aplica CatalogoShell leyendo `data-pv-grupo` en session.
 */
export function CategoriasShell({ titulo }: { titulo: string }) {
  const { payload } = usePerfil();
  const grupos = Array.from(
    new Set(
      payload.productos
        .filter((p) => p.activo && p.grupo)
        .map((p) => p.grupo as string)
    )
  ).slice(0, 12);

  if (grupos.length < 3) return null;

  return (
    <section className="pv-modulo" id="categorias" aria-label={titulo || 'Categorías'}>
      <h2 style={{ margin: '0 0 12px', font: 'var(--ts-modulo)', color: 'var(--tx-strong)' }}>
        {titulo || 'Categorías'}
      </h2>
      <div
        style={{
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          marginInline: 'calc(-1 * var(--sp-4))',
          paddingInline: 'var(--sp-4)',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {grupos.map((g) => (
          <a
            key={g}
            href={`#catalogo`}
            onClick={() => {
              try {
                sessionStorage.setItem('pv-grupo', g);
                window.dispatchEvent(new CustomEvent('pv-grupo', { detail: g }));
              } catch {
                /* ignore */
              }
            }}
            style={{
              flex: '0 0 auto',
              minHeight: 44,
              padding: '10px 16px',
              borderRadius: 999,
              border: '1px solid var(--bd-hair)',
              background: 'var(--sf-elev)',
              color: 'var(--tx-strong)',
              font: 'var(--ts-meta)',
              fontWeight: 600,
              textDecoration: 'none',
              whiteSpace: 'nowrap',
              boxShadow: 'var(--el-1)',
            }}
          >
            {g}
          </a>
        ))}
      </div>
    </section>
  );
}

import Link from 'next/link';
import type { Adiso } from '@/types';
import { getAdisoUrl } from '@/lib/url';
import {
  formatPrecioDisplay,
  getJobSalaryLabel,
  toDisplayTitle,
  formatUbicacionCorta,
} from '@/lib/adiso-display';

interface CrawlableAdisoListProps {
  adisos: Adiso[];
  heading?: string;
  /** When true, visually hidden but present in HTML for crawlers */
  visuallyHidden?: boolean;
}

function priceFor(adiso: Adiso): string {
  if (adiso.categoria === 'empleos') {
    return getJobSalaryLabel(adiso) || formatPrecioDisplay(adiso) || 'A convenir';
  }
  return formatPrecioDisplay(adiso) || 'A convenir';
}

/**
 * Crawlable listing: real `<a href="/a/...">` with title + price in HTML.
 * Used beside SPA grids so bots (and noscript users) see content without JS.
 */
export function CrawlableAdisoList({
  adisos,
  heading = 'Avisos',
  visuallyHidden = false,
}: CrawlableAdisoListProps) {
  if (!adisos.length) return null;

  return (
    <section
      aria-label={heading}
      className={
        visuallyHidden
          ? 'sr-only'
          : 'mx-auto max-w-[1400px] px-4 py-6'
      }
    >
      <h2 className={visuallyHidden ? undefined : 'mb-4 text-xl font-semibold text-[var(--bs-fg-default,var(--text-primary))]'}>
        {heading}
      </h2>
      <ul className={visuallyHidden ? undefined : 'grid gap-3 sm:grid-cols-2 lg:grid-cols-3'}>
        {adisos.map((adiso) => {
          const title = toDisplayTitle(adiso.titulo) || adiso.titulo;
          const price = priceFor(adiso);
          const loc =
            typeof adiso.ubicacion === 'string'
              ? adiso.ubicacion
              : formatUbicacionCorta(adiso.ubicacion);
          return (
            <li key={adiso.id}>
              <Link
                href={getAdisoUrl(adiso)}
                className={
                  visuallyHidden
                    ? undefined
                    : 'block rounded-lg border border-[var(--bs-border-default,var(--border-color))] bg-[var(--bs-bg-surface,var(--bg-primary))] p-3 hover:border-[var(--bs-action)]'
                }
              >
                <span className="font-semibold text-[var(--bs-fg-default,var(--text-primary))]">
                  {title}
                </span>
                {' — '}
                <span className="tabular-nums font-bold">{price}</span>
                {loc ? (
                  <>
                    {' · '}
                    <span className="text-[var(--bs-fg-muted,var(--text-secondary))]">{loc}</span>
                  </>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

interface ListingPaginationProps {
  basePath: string;
  page: number;
  hasNext: boolean;
}

/** Crawlable prev/next page links (in addition to infinite scroll elsewhere). */
export function ListingPagination({ basePath, page, hasNext }: ListingPaginationProps) {
  const prev = page > 1 ? page - 1 : null;
  const next = hasNext ? page + 1 : null;
  if (!prev && !next) return null;

  const hrefFor = (p: number) => (p <= 1 ? basePath : `${basePath}${basePath.includes('?') ? '&' : '?'}page=${p}`);

  return (
    <nav aria-label="Paginación" className="mx-auto flex max-w-[1400px] items-center justify-center gap-6 px-4 py-6">
      {prev ? (
        <Link rel="prev" href={hrefFor(prev)} className="font-medium text-[var(--bs-action,var(--brand-blue))]">
          ← Anterior
        </Link>
      ) : (
        <span className="text-[var(--bs-fg-subtle)]">← Anterior</span>
      )}
      <span className="text-sm text-[var(--bs-fg-muted)]">Página {page}</span>
      {next ? (
        <Link rel="next" href={hrefFor(next)} className="font-medium text-[var(--bs-action,var(--brand-blue))]">
          Siguiente →
        </Link>
      ) : (
        <span className="text-[var(--bs-fg-subtle)]">Siguiente →</span>
      )}
    </nav>
  );
}

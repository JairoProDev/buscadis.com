'use client';

import Link from 'next/link';

type SeoRouteErrorProps = {
  title?: string;
  reset: () => void;
};

/**
 * Error UI for public SEO routes: no technical messages (avoid indexable stack traces).
 */
export default function SeoRouteError({
  title = 'No pudimos cargar esta página',
  reset,
}: SeoRouteErrorProps) {
  return (
    <main className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
      <h1 className="mb-3 text-xl font-semibold text-[var(--bs-fg-default,var(--text-primary))]">
        {title}
      </h1>
      <p className="mb-6 text-[var(--bs-fg-muted,var(--text-secondary))]">
        Intenta de nuevo o vuelve al inicio para seguir buscando avisos.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-lg bg-[var(--bs-action,var(--brand-blue))] px-4 py-2 text-sm font-medium text-white"
        >
          Reintentar
        </button>
        <Link
          href="/"
          className="rounded-lg border border-[var(--bs-border-default,var(--border-color))] px-4 py-2 text-sm font-medium"
        >
          Ir al inicio
        </Link>
      </div>
    </main>
  );
}

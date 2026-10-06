'use client';

import * as Sentry from '@sentry/nextjs';
import { sfInline } from '@/lib/storefront/inline-theme';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="es">
      <head>
        <meta name="robots" content="noindex, nofollow" />
      </head>
      <body>
        <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'system-ui, sans-serif' }}>
          <h2>Algo salió mal</h2>
          <p>Ha ocurrido un error inesperado. Nuestro equipo ya fue notificado.</p>
          <button
            type="button"
            onClick={() => {
              void (async () => {
                try {
                  if ('serviceWorker' in navigator) {
                    const regs = await navigator.serviceWorker.getRegistrations();
                    await Promise.all(regs.map((r) => r.unregister()));
                  }
                  if ('caches' in window) {
                    const keys = await caches.keys();
                    await Promise.all(keys.map((k) => caches.delete(k)));
                  }
                } catch {
                  /* ignore */
                }
                reset();
              })();
            }}
            style={{
              marginTop: '1rem',
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              border: 'none',
              background: sfInline.strong,
              color: sfInline.onAction,
              cursor: 'pointer',
            }}
          >
            Intentar de nuevo
          </button>
        </div>
      </body>
    </html>
  );
}

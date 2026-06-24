'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface BuscadisDiscoveryProps {
  businessSlug: string;
  businessName: string;
  engaged?: boolean;
  onDiscoveryClick?: () => void;
}

const DISCOVERY_DISMISSED_KEY = 'buscadis_discovery_dismissed';

function discoveryUrl(slug: string, campaign: string) {
  return `/?utm_source=business_profile&utm_medium=${encodeURIComponent(slug)}&utm_campaign=${campaign}`;
}

export default function BuscadisDiscovery({
  businessSlug,
  businessName,
  engaged = false,
  onDiscoveryClick,
}: BuscadisDiscoveryProps) {
  const { user } = useAuth();
  const [showSticky, setShowSticky] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (typeof sessionStorage === 'undefined') return;
    const wasDismissed = sessionStorage.getItem(DISCOVERY_DISMISSED_KEY) === '1';
    setDismissed(wasDismissed);
    if (!wasDismissed) {
      const t = setTimeout(() => setShowSticky(true), 30000);
      return () => clearTimeout(t);
    }
  }, []);

  const dismissSticky = () => {
    sessionStorage.setItem(DISCOVERY_DISMISSED_KEY, '1');
    setDismissed(true);
    setShowSticky(false);
  };

  return (
    <>
      <footer className="py-10 px-4 text-center print:hidden border-t border-[var(--bp-border)] mt-8">
        <p className="text-xs text-[var(--bp-text-muted)] mb-3">
          Tienda creada con{' '}
          <Link
            href={discoveryUrl(businessSlug, 'footer')}
            onClick={onDiscoveryClick}
            className="font-bold text-[var(--brand-color)] hover:underline"
          >
            Buscadis
          </Link>
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-sm">
          <Link
            href={discoveryUrl(businessSlug, 'explore')}
            onClick={onDiscoveryClick}
            className="px-4 py-2 rounded-[var(--bp-radius)] border border-[var(--bp-border)] text-[var(--bp-text)] font-medium hover:border-[var(--brand-color)] transition-colors"
          >
            Explorar más negocios
          </Link>
          <Link
            href={`/publicar?utm_source=business_profile&utm_medium=${encodeURIComponent(businessSlug)}&utm_campaign=create_profile`}
            onClick={onDiscoveryClick}
            className="px-4 py-2 rounded-[var(--bp-radius)] bg-[var(--brand-color)] text-white font-bold hover:brightness-110 transition-all active:scale-[0.98]"
          >
            {user ? 'Crea tu perfil gratis' : '¿Tienes negocio? Empieza gratis'}
          </Link>
        </div>
      </footer>

      {engaged && (
        <div className="mx-4 mb-24 max-w-lg md:mx-auto print:hidden">
          <div className="rounded-2xl border border-[var(--bp-border)] bg-[var(--bp-surface-elevated)] p-4 shadow-sm">
            <p className="text-sm font-bold text-[var(--bp-text)] mb-1">
              ¿Te gustó {businessName}?
            </p>
            <p className="text-xs text-[var(--bp-text-muted)] mb-3">
              Crea tu perfil gratis en 2 minutos y comparte tu catálogo como ellos.
            </p>
            <Link
              href={`/publicar?utm_source=business_profile&utm_medium=${encodeURIComponent(businessSlug)}&utm_campaign=post_engagement`}
              onClick={onDiscoveryClick}
              className="inline-flex text-sm font-bold text-[var(--brand-color)] hover:underline"
            >
              Crear mi perfil →
            </Link>
          </div>
        </div>
      )}

      {showSticky && !dismissed && (
        <div
          className={cn(
            'fixed left-4 right-4 z-[99] print:hidden hidden md:block md:left-auto md:right-6 md:max-w-sm',
            'bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))]'
          )}
        >
          <div className="rounded-2xl bg-[var(--bp-surface)] border border-[var(--bp-border)] shadow-xl p-4 flex gap-3 items-start">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-[var(--bp-text)]">Descubre Buscadis</p>
              <p className="text-xs text-[var(--bp-text-muted)] mt-0.5">
                Miles de ofertas y negocios cerca de ti.
              </p>
              <Link
                href={discoveryUrl(businessSlug, 'sticky')}
                onClick={() => {
                  onDiscoveryClick?.();
                  dismissSticky();
                }}
                className="inline-block mt-2 text-xs font-bold text-[var(--brand-color)]"
              >
                Explorar marketplace →
              </Link>
            </div>
            <button
              type="button"
              onClick={dismissSticky}
              className="text-[var(--bp-text-muted)] text-lg leading-none p-1"
              aria-label="Cerrar"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </>
  );
}

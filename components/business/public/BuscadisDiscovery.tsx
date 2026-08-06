'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface BuscadisDiscoveryProps {
  businessSlug: string;
  businessName: string;
  engaged?: boolean;
  /** Hide acquisition CTAs for owners/editors of this profile */
  hideForEditor?: boolean;
  onDiscoveryClick?: () => void;
}

const DISCOVERY_DISMISSED_KEY = 'buscadis_discovery_dismissed';

function discoveryUrl(slug: string, campaign: string) {
  return `/?utm_source=business_profile&utm_medium=${encodeURIComponent(slug)}&utm_campaign=${campaign}`;
}

function publishUrl(slug: string, campaign: string) {
  return `/publicar?utm_source=business_profile&utm_medium=${encodeURIComponent(slug)}&utm_campaign=${campaign}`;
}

export default function BuscadisDiscovery({
  businessSlug,
  businessName,
  engaged = false,
  hideForEditor = false,
  onDiscoveryClick,
}: BuscadisDiscoveryProps) {
  const { user } = useAuth();
  const [showSticky, setShowSticky] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (typeof sessionStorage === 'undefined' || hideForEditor) return;
    const wasDismissed = sessionStorage.getItem(DISCOVERY_DISMISSED_KEY) === '1';
    setDismissed(wasDismissed);
  }, [hideForEditor]);

  // Mostrar el sticky cuando la persona ya interactuó (scroll/WhatsApp),
  // no a los 30s a ciegas — es más relevante y menos molesto.
  useEffect(() => {
    if (hideForEditor || dismissed || !engaged) return;
    const t = setTimeout(() => setShowSticky(true), 1200);
    return () => clearTimeout(t);
  }, [engaged, dismissed, hideForEditor]);

  const dismissSticky = () => {
    sessionStorage.setItem(DISCOVERY_DISMISSED_KEY, '1');
    setDismissed(true);
    setShowSticky(false);
  };

  if (hideForEditor) {
    return (
      <footer className="py-8 px-4 text-center print:hidden border-t border-[var(--bp-border)] mt-8">
        <p className="text-xs text-[var(--bp-text-muted)]">
          Tu página en{' '}
          <span className="font-bold text-[var(--brand-color)]">Buscadis</span>
        </p>
      </footer>
    );
  }

  const shortName = businessName?.trim() || 'este negocio';

  return (
    <>
      <footer className="py-10 px-4 print:hidden border-t border-[var(--bp-border)] mt-8">
        <div className="mx-auto max-w-lg rounded-3xl border border-[var(--bp-border)] bg-[var(--bp-surface-elevated)] p-6 text-center shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--brand-color)] mb-2">
            Hecho con Buscadis
          </p>
          <h3 className="text-lg font-black text-[var(--bp-text)] leading-snug m-0">
            ¿Tu negocio también merece una página así?
          </h3>
          <p className="mt-2 text-sm text-[var(--bp-text-muted)] m-0">
            Catálogo, WhatsApp y enlace listo para compartir — gratis, en minutos.
          </p>
          <div className="mt-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2">
            <Link
              href={publishUrl(businessSlug, 'footer_create')}
              onClick={onDiscoveryClick}
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-[var(--brand-color)] text-white text-sm font-bold hover:brightness-110 transition-all active:scale-[0.98]"
            >
              {user ? 'Crear mi página gratis' : 'Empezar gratis'}
            </Link>
            <Link
              href={discoveryUrl(businessSlug, 'footer_explore')}
              onClick={onDiscoveryClick}
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl border border-[var(--bp-border)] text-[var(--bp-text)] text-sm font-semibold hover:border-[var(--brand-color)] transition-colors"
            >
              Ver más negocios
            </Link>
          </div>
        </div>
      </footer>

      {engaged && (
        <div className="mx-4 mb-24 max-w-lg md:mx-auto print:hidden">
          <div className="rounded-2xl border border-[var(--bp-border)] bg-[var(--bp-surface-elevated)] p-4 shadow-sm">
            <p className="text-sm font-bold text-[var(--bp-text)] mb-1">
              ¿Te gustó {shortName}?
            </p>
            <p className="text-xs text-[var(--bp-text-muted)] mb-3">
              Crea tu página en Buscadis y comparte tu catálogo con el mismo formato.
            </p>
            <Link
              href={publishUrl(businessSlug, 'post_engagement')}
              onClick={onDiscoveryClick}
              className="inline-flex text-sm font-bold text-[var(--brand-color)] hover:underline"
            >
              Crear mi página →
            </Link>
          </div>
        </div>
      )}

      {showSticky && !dismissed && (
        <div
          className={cn(
            'fixed left-4 right-4 z-[90] print:hidden md:left-auto md:right-6 md:max-w-sm',
            'bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))]'
          )}
        >
          <div className="rounded-2xl bg-[var(--bp-surface)] border border-[var(--bp-border)] shadow-2xl p-4 overflow-hidden">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 shrink-0 rounded-xl bg-[var(--brand-color)] text-white flex items-center justify-center text-sm font-black">
                B
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-[var(--bp-text)] m-0 leading-snug">
                  Tu negocio, con página propia
                </p>
                <p className="text-xs text-[var(--bp-text-muted)] mt-1 m-0">
                  Como {shortName}: catálogo + WhatsApp en un enlace.
                </p>
              </div>
              <button
                type="button"
                onClick={dismissSticky}
                className="text-[var(--bp-text-muted)] text-lg leading-none p-1 shrink-0"
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>
            <div className="mt-3 flex gap-2">
              <Link
                href={publishUrl(businessSlug, 'sticky_create')}
                onClick={() => {
                  onDiscoveryClick?.();
                  dismissSticky();
                }}
                className="flex-1 inline-flex items-center justify-center rounded-xl bg-[var(--brand-color)] px-3 py-2 text-xs font-bold text-white hover:brightness-110"
              >
                Crear gratis
              </Link>
              <Link
                href={discoveryUrl(businessSlug, 'sticky_explore')}
                onClick={() => {
                  onDiscoveryClick?.();
                  dismissSticky();
                }}
                className="inline-flex items-center justify-center rounded-xl border border-[var(--bp-border)] px-3 py-2 text-xs font-semibold text-[var(--bp-text)]"
              >
                Explorar
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

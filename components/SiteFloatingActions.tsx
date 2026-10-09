'use client';

import { usePathname } from 'next/navigation';
import FeedbackButton from '@/components/FeedbackButton';
import BuscadisSocialFloat from '@/components/BuscadisSocialFloat';

const FLOAT_BOTTOM =
  'calc(var(--bs-nav-visible-offset, calc(var(--bs-nav-height, 56px) + env(safe-area-inset-bottom, 0px))) + 0.75rem)';

/** Ayuda + redes Buscadis (izquierda). Redes encima de Ayuda para no confundirlas con contacto del anuncio. */
export default function SiteFloatingActions() {
  const pathname = usePathname();
  if (pathname?.startsWith('/empleo')) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: FLOAT_BOTTOM,
        left: 'max(1rem, env(safe-area-inset-left))',
        zIndex: 1600,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: '0.65rem',
        transition: 'bottom 0.28s ease-out',
      }}
      aria-label="Acciones de Buscadis"
    >
      <BuscadisSocialFloat layout="stacked" />
      <FeedbackButton layout="stacked" />
    </div>
  );
}

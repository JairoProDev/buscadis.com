'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { FaTimes } from 'react-icons/fa';
import { usePathname } from 'next/navigation';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useUI } from '@/contexts/UIContext';
import { BUSCADIS_SOCIAL_LINKS, shouldShowBuscadisSocialChrome } from '@/lib/buscadis-social';
import {
  markSocialFloatIntroSessionIfNeeded,
  shouldAutoOpenSocialFloatOnMobile,
} from '@/lib/buscadis-social-float-intro';
import { SOCIAL_NETWORK_BRAND_HEX } from '@/lib/business/social-network-brands';
import { getSocialIconByBrand } from '@/components/business/public/social-icons';
import type { SocialBrandKey } from '@/lib/business/social-display';
import { IconShareAlt } from '@/components/Icons';

const WHATSAPP_HEX = '#25D366';
const ICON_SIZE = 20;
const BTN = 44;

function brandColor(network: SocialBrandKey): string {
  if (network === 'whatsapp') return WHATSAPP_HEX;
  const hex = SOCIAL_NETWORK_BRAND_HEX[network as keyof typeof SOCIAL_NETWORK_BRAND_HEX];
  return hex ?? 'var(--brand-blue)';
}

function circleLinkStyle(color: string, delayMs: number): CSSProperties {
  return {
    width: BTN,
    height: BTN,
    borderRadius: '999px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'var(--bg-primary)',
    border: '1px solid color-mix(in srgb, var(--border-color) 85%, transparent)',
    boxShadow: '0 6px 18px rgba(0,0,0,0.12)',
    color,
    transition: `transform 0.15s ease, box-shadow 0.15s ease, opacity 0.22s ease ${delayMs}ms`,
  };
}

function SocialLinkButton({
  link,
  delayMs,
  onNavigate,
}: {
  link: (typeof BUSCADIS_SOCIAL_LINKS)[number];
  delayMs: number;
  onNavigate?: () => void;
}) {
  const color = brandColor(link.network);
  return (
    <a
      href={link.href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={link.label}
      title={link.label.replace(' de Buscadis', '')}
      onClick={onNavigate}
      style={circleLinkStyle(color, delayMs)}
      className="motion-reduce:transition-none hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-blue)]"
    >
      {getSocialIconByBrand(link.network, ICON_SIZE)}
    </a>
  );
}

type Layout = 'fixed' | 'stacked';

export default function BuscadisSocialFloat({ layout = 'fixed' }: { layout?: Layout }) {
  const pathname = usePathname();
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const { isAuthModalOpen } = useUI();
  const [abierto, setAbierto] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const introAppliedRef = useRef(false);

  useEffect(() => {
    if (isDesktop || introAppliedRef.current) return;
    if (!shouldAutoOpenSocialFloatOnMobile()) return;
    introAppliedRef.current = true;
    setAbierto(true);
    markSocialFloatIntroSessionIfNeeded();
  }, [isDesktop]);

  useEffect(() => {
    if (!abierto) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAbierto(false);
    };
    const onClickOutside = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setAbierto(false);
      }
    };

    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClickOutside);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClickOutside);
    };
  }, [abierto]);

  if (!shouldShowBuscadisSocialChrome(pathname ?? '')) return null;
  if (isAuthModalOpen) return null;

  const shellStyle: CSSProperties =
    layout === 'stacked'
      ? {
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: '0.5rem',
        }
      : {
          position: 'fixed',
          bottom:
            'calc(var(--bs-nav-visible-offset, calc(var(--bs-nav-height, 56px) + env(safe-area-inset-bottom, 0px))) + 0.75rem)',
          left: 'max(1rem, env(safe-area-inset-left))',
          zIndex: 1599,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: '0.5rem',
          transition: 'bottom 0.28s ease-out',
        };

  const toggleButton = (
    <button
      type="button"
      onClick={() => setAbierto((v) => !v)}
      aria-expanded={abierto}
      aria-haspopup="true"
      aria-label={abierto ? 'Cerrar redes de Buscadis' : 'Redes oficiales de Buscadis'}
      title="Redes de Buscadis (no es contacto del anuncio)"
      className="motion-reduce:transform-none hover:-translate-y-0.5"
      style={{
        width: BTN,
        height: BTN,
        borderRadius: '999px',
        border: '1px solid color-mix(in srgb, var(--brand-blue) 35%, transparent)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 6px 20px color-mix(in srgb, var(--brand-blue) 22%, transparent)',
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--brand-blue)',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
      }}
    >
      {abierto ? (
        <FaTimes size={16} aria-hidden />
      ) : (
        <IconShareAlt size={18} color="var(--brand-blue)" />
      )}
    </button>
  );

  return (
    <div ref={rootRef} style={shellStyle} aria-label="Redes sociales de Buscadis">
      {abierto &&
        BUSCADIS_SOCIAL_LINKS.map((link, index) => (
          <SocialLinkButton
            key={link.network}
            link={link}
            delayMs={index * 35}
            onNavigate={() => setAbierto(false)}
          />
        ))}

      {toggleButton}
    </div>
  );
}

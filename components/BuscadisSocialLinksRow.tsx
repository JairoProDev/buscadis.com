'use client';

import { BUSCADIS_SOCIAL_LINKS } from '@/lib/buscadis-social';
import { SOCIAL_NETWORK_BRAND_HEX } from '@/lib/business/social-network-brands';
import { getSocialIconByBrand } from '@/components/business/public/social-icons';
import type { SocialBrandKey } from '@/lib/business/social-display';

const WHATSAPP_HEX = '#25D366';

function brandColor(network: SocialBrandKey): string {
  if (network === 'whatsapp') return WHATSAPP_HEX;
  const hex = SOCIAL_NETWORK_BRAND_HEX[network as keyof typeof SOCIAL_NETWORK_BRAND_HEX];
  return hex ?? 'var(--brand-blue)';
}

type BuscadisSocialLinksRowProps = {
  /** Tamaño del icono dentro del botón circular */
  iconSize?: number;
  /** Diámetro del botón */
  buttonSize?: number;
  onLinkClick?: () => void;
};

export default function BuscadisSocialLinksRow({
  iconSize = 18,
  buttonSize = 40,
  onLinkClick,
}: BuscadisSocialLinksRowProps) {
  return (
    <div
      className="flex flex-wrap items-center gap-2"
      role="group"
      aria-label="Redes sociales de Buscadis"
    >
      {BUSCADIS_SOCIAL_LINKS.map((link) => {
        const color = brandColor(link.network);
        return (
          <a
            key={link.network}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={link.label}
            title={link.label.replace(' de Buscadis', '')}
            onClick={onLinkClick}
            className="flex shrink-0 items-center justify-center rounded-full border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] shadow-sm transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-blue)] motion-reduce:transform-none"
            style={{
              width: buttonSize,
              height: buttonSize,
              color,
            }}
          >
            {getSocialIconByBrand(link.network, iconSize)}
          </a>
        );
      })}
    </div>
  );
}

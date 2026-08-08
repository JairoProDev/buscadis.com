'use client';

import type { CSSProperties, ReactNode } from 'react';
import { trackProfileEvent } from '@/lib/business/analytics/track-profile-event';

/** CTA WhatsApp del Perfil Vivo con tracking whatsapp_click. */
export function PerfilVivoWaLink({
  href,
  businessProfileId,
  children,
  className,
  style,
}: {
  href: string;
  businessProfileId: string;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <a
      href={href}
      className={className}
      style={style}
      onClick={() => {
        if (businessProfileId && businessProfileId !== 'demo-retail-001') {
          void trackProfileEvent(businessProfileId, 'whatsapp_click');
        }
      }}
    >
      {children}
    </a>
  );
}

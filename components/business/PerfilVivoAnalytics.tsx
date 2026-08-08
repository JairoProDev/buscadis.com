'use client';

import { useEffect, useRef } from 'react';
import { trackProfileView, trackProfileEvent } from '@/lib/business/analytics/track-profile-event';
import { trackEvent } from '@/lib/events/track';

function origenFromReferrer(ref: string): string {
  const r = ref.toLowerCase();
  if (!r) return 'directo';
  if (r.includes('wa.me') || r.includes('whatsapp')) return 'whatsapp';
  if (r.includes('google.')) return 'google';
  if (r.includes('maps')) return 'mapa';
  if (r.includes('facebook') || r.includes('instagram')) return 'redes';
  return 'directo';
}

/** Emite perfil_visto una vez por montaje (P14 lite). */
export function PerfilVivoAnalytics({
  businessProfileId,
  slug,
  arquetipo,
}: {
  businessProfileId: string;
  slug: string;
  arquetipo: string;
}) {
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    if (!businessProfileId || slug === 'demo') return;
    sent.current = true;

    const origen = origenFromReferrer(typeof document !== 'undefined' ? document.referrer : '');
    const fromQr =
      typeof window !== 'undefined' &&
      new URLSearchParams(window.location.search).get('src') === 'qr';

    void trackProfileView({ businessProfileId, fromQr });
    void trackProfileEvent(businessProfileId, 'profile_view');
    trackEvent('publish.step_view', {
      entityType: 'publish_draft',
      entityId: businessProfileId,
      payload: {
        step: 'perfil_visto',
        slug,
        arquetipo,
        origen: fromQr ? 'qr' : origen,
        superficie: 'perfil_vivo',
      },
    });
  }, [businessProfileId, slug, arquetipo]);

  return null;
}

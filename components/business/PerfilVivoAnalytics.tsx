'use client';

import { useEffect, useRef } from 'react';
import { isDemoPerfilVivoSlug } from '@buscadis/perfil-vivo';
import {
  trackProfileView,
  trackProfileEvent,
  trackIaUnanswered,
} from '@/lib/business/analytics/track-profile-event';
import { trackEvent } from '@/lib/events/track';

const PV_IA_UNANSWERED_EVENT = 'pv:ia-unanswered';

function origenFromReferrer(ref: string): string {
  const r = ref.toLowerCase();
  if (!r) return 'directo';
  if (r.includes('wa.me') || r.includes('whatsapp')) return 'whatsapp';
  if (r.includes('google.')) return 'google';
  if (r.includes('maps')) return 'mapa';
  if (r.includes('facebook') || r.includes('instagram')) return 'redes';
  return 'directo';
}

/** Emite perfil_visto + captura clics a /r/ + corpus IA sin respuesta. */
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
    if (!businessProfileId || isDemoPerfilVivoSlug(slug)) return;
    sent.current = true;

    const origen = origenFromReferrer(typeof document !== 'undefined' ? document.referrer : '');
    const sp = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const fromQr =
      sp?.get('src') === 'qr' ||
      sp?.get('from_qr') === '1' ||
      sp?.get('utm_source') === 'qr';

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

  useEffect(() => {
    if (!businessProfileId || isDemoPerfilVivoSlug(slug)) return;
    const onClick = (ev: MouseEvent) => {
      const t = ev.target as HTMLElement | null;
      const a = t?.closest?.('a') as HTMLAnchorElement | null;
      if (!a?.href) return;
      if (a.pathname.startsWith('/r/') || a.href.includes('/r/')) {
        void trackProfileEvent(businessProfileId, 'whatsapp_click');
      }
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [businessProfileId, slug]);

  useEffect(() => {
    if (!businessProfileId || isDemoPerfilVivoSlug(slug)) return;
    const onIa = (ev: Event) => {
      const detail = (ev as CustomEvent).detail as
        | { businessProfileId?: string; pregunta?: string }
        | undefined;
      const pregunta = detail?.pregunta?.trim();
      const id = detail?.businessProfileId || businessProfileId;
      if (!pregunta || !id) return;
      void trackIaUnanswered(id, pregunta);
    };
    window.addEventListener(PV_IA_UNANSWERED_EVENT, onIa);
    return () => window.removeEventListener(PV_IA_UNANSWERED_EVENT, onIa);
  }, [businessProfileId, slug]);

  useEffect(() => {
    if (!businessProfileId || isDemoPerfilVivoSlug(slug)) return;
    const onCommerce = (ev: Event) => {
      const detail = (ev as CustomEvent).detail as
        | {
            businessProfileId?: string;
            eventType?: string;
            productId?: string;
            metadata?: Record<string, unknown>;
          }
        | undefined;
      const id = detail?.businessProfileId || businessProfileId;
      const type = detail?.eventType;
      if (!id || !type) return;
      if (
        type === 'product_view' ||
        type === 'purchase_intent' ||
        type === 'add_to_cart' ||
        type === 'order_created' ||
        type === 'order_paid'
      ) {
        void trackProfileEvent(id, type, detail.productId, detail.metadata);
      }
    };
    window.addEventListener('pv:commerce-event', onCommerce);
    return () => window.removeEventListener('pv:commerce-event', onCommerce);
  }, [businessProfileId, slug]);

  return null;
}

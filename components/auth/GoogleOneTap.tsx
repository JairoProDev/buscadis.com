'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { signInWithGoogleIdToken } from '@/lib/auth';
import {
  createGoogleNonce,
  getGoogleClientId,
  loadGisScript,
  type GisCredentialResponse,
} from '@/lib/auth/google-gis';
import { trackEvent } from '@/lib/events/track';

/**
 * Prompt flotante estilo Canva (esquina). Solo si no hay sesión.
 * Requiere NEXT_PUBLIC_GOOGLE_CLIENT_ID y Google provider en Supabase.
 */
export default function GoogleOneTap() {
  const { user, loading, refreshProfile } = useAuth();
  const started = useRef(false);
  const nonceRef = useRef<string | null>(null);

  useEffect(() => {
    if (loading || user || started.current) return;
    const clientId = getGoogleClientId();
    if (!clientId) return;

    let cancelled = false;
    started.current = true;

    (async () => {
      try {
        await loadGisScript();
        if (cancelled || !window.google?.accounts?.id) return;

        const { nonce, hashedNonce } = await createGoogleNonce();
        nonceRef.current = nonce;

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response: GisCredentialResponse) => {
            if (!response?.credential) return;
            const { data, error } = await signInWithGoogleIdToken(
              response.credential,
              nonceRef.current || undefined
            );
            if (error) {
              console.error('One Tap sign-in failed', error);
              return;
            }
            if (data?.user) {
              trackEvent('auth.sign_up', {
                entityType: 'auth',
                entityId: data.user.id,
                payload: { method: 'google_one_tap' },
              });
              await refreshProfile();
            }
          },
          nonce: hashedNonce,
          use_fedcm_for_prompt: true,
          auto_select: false,
          cancel_on_tap_outside: true,
          context: 'signin',
        });

        window.google.accounts.id.prompt();
      } catch (e) {
        console.warn('Google One Tap unavailable', e);
        started.current = false;
      }
    })();

    return () => {
      cancelled = true;
      try {
        window.google?.accounts?.id?.cancel();
      } catch {
        /* ignore */
      }
    };
  }, [loading, user, refreshProfile]);

  return null;
}

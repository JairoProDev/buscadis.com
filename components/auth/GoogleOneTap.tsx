'use client';

import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { promptGoogleSignIn, requestGoogleSignInPrompt } from '@/lib/auth/google-sign-in-prompt';
/**
 * Prompt flotante de Google (cuentas guardadas). Solo si no hay sesión.
 */
export default function GoogleOneTap() {
  const { user, loading, refreshProfile } = useAuth();

  useEffect(() => {
    if (loading || user) return;

    void promptGoogleSignIn(async () => {
      await refreshProfile();
    });
  }, [loading, user, refreshProfile]);

  useEffect(() => {
    const onRequest = () => {
      if (!loading && !user) {
        requestGoogleSignInPrompt(async () => {
          await refreshProfile();
        });
      }
    };
    window.addEventListener('buscadis:google-one-tap-request', onRequest);
    return () => window.removeEventListener('buscadis:google-one-tap-request', onRequest);
  }, [loading, user, refreshProfile]);

  return null;
}

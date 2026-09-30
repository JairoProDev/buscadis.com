'use client';

import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { promptGoogleSignIn, requestGoogleSignInPrompt } from '@/lib/auth/google-sign-in-prompt';
import { shouldAutoPromptGoogleOneTap } from '@/lib/auth/google-gis';
import { isBuscadisNativeApp } from '@/lib/mobile-app-bridge';
/**
 * Prompt flotante de Google (cuentas guardadas). Solo si no hay sesión.
 */
export default function GoogleOneTap() {
  const { user, loading, refreshProfile } = useAuth();

  useEffect(() => {
    if (loading || user) return;
    // Google GIS no es compatible con WebView de la app Android.
    if (isBuscadisNativeApp()) return;
    if (!shouldAutoPromptGoogleOneTap()) return;

    void promptGoogleSignIn(async () => {
      await refreshProfile();
    });
  }, [loading, user, refreshProfile]);

  useEffect(() => {
    const onRequest = () => {
      if (!loading && !user && !isBuscadisNativeApp() && shouldAutoPromptGoogleOneTap()) {
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

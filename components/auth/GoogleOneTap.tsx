'use client';

import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNativeGoogleIdTokenListener } from '@/hooks/useNativeGoogleIdToken';
import { promptGoogleSignIn, requestGoogleSignInPrompt } from '@/lib/auth/google-sign-in-prompt';
import {
  shouldAutoPromptGoogleOneTap,
  shouldAutoPromptNativeGoogleSignIn,
} from '@/lib/auth/google-gis';
import {
  markNativeGoogleAutoPrompted,
  wasNativeGoogleAutoPromptedThisSession,
} from '@/lib/auth/native-google-auto-prompt';
import { isBuscadisNativeApp, requestNativeGoogleSignIn } from '@/lib/mobile-app-bridge';

/**
 * Login rápido sin sesión: One Tap (web) o sheet nativo (app Android).
 */
export default function GoogleOneTap() {
  const { user, loading, refreshProfile } = useAuth();
  const nativeApp = isBuscadisNativeApp();

  useNativeGoogleIdTokenListener(
    async () => {
      await refreshProfile();
    },
    (message) => {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[GoogleOneTap native]', message);
      }
    }
  );

  useEffect(() => {
    if (loading || user) return;

    if (nativeApp) {
      if (!shouldAutoPromptNativeGoogleSignIn()) return;
      if (wasNativeGoogleAutoPromptedThisSession()) return;
      markNativeGoogleAutoPrompted();
      requestNativeGoogleSignIn();
      return;
    }

    if (!shouldAutoPromptGoogleOneTap()) return;

    void promptGoogleSignIn(async () => {
      await refreshProfile();
    });
  }, [loading, user, refreshProfile, nativeApp]);

  useEffect(() => {
    const onRequest = () => {
      if (loading || user) return;

      if (nativeApp) {
        if (!shouldAutoPromptNativeGoogleSignIn()) return;
        requestNativeGoogleSignIn();
        return;
      }

      if (!shouldAutoPromptGoogleOneTap()) return;
      requestGoogleSignInPrompt(async () => {
        await refreshProfile();
      });
    };
    window.addEventListener('buscadis:google-one-tap-request', onRequest);
    return () => window.removeEventListener('buscadis:google-one-tap-request', onRequest);
  }, [loading, user, refreshProfile, nativeApp]);

  return null;
}

'use client';

import { useEffect } from 'react';
import { signInWithGoogleIdToken } from '@/lib/auth';
import {
  isBuscadisNativeApp,
  NATIVE_GOOGLE_ID_TOKEN_EVENT,
  type NativeGoogleIdTokenDetail,
} from '@/lib/mobile-app-bridge';

/**
 * Recibe el ID token del login nativo (Expo) y crea sesión Supabase en el WebView.
 */
export function useNativeGoogleIdTokenListener(
  onSuccess?: () => void | Promise<void>,
  onError?: (message: string) => void
) {
  useEffect(() => {
    if (!isBuscadisNativeApp()) return;

    const handler = (event: Event) => {
      const detail = (event as CustomEvent<NativeGoogleIdTokenDetail>).detail;
      if (!detail?.idToken) {
        onError?.('No se recibió el token de Google desde la app');
        return;
      }
      void (async () => {
        const { error } = await signInWithGoogleIdToken(detail.idToken, detail.nonce);
        if (error) {
          onError?.(error.message || 'No se pudo entrar con Google');
          return;
        }
        await onSuccess?.();
      })();
    };

    window.addEventListener(NATIVE_GOOGLE_ID_TOKEN_EVENT, handler);
    return () => window.removeEventListener(NATIVE_GOOGLE_ID_TOKEN_EVENT, handler);
  }, [onError, onSuccess]);
}

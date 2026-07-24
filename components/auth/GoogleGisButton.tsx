'use client';

import { useEffect, useRef, useState } from 'react';
import { signInWithGoogleIdToken } from '@/lib/auth';
import {
  createGoogleNonce,
  getGoogleClientId,
  loadGisScript,
  type GisCredentialResponse,
} from '@/lib/auth/google-gis';
import { IconGoogle } from '@/components/Icons';

type Props = {
  label: string;
  disabled?: boolean;
  onSuccess?: () => void;
  onError?: (message: string) => void;
};

/**
 * Botón Google vía GIS (ID token). No usa redirect a *.supabase.co.
 */
export default function GoogleGisButton({ label, disabled, onSuccess, onError }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const nonceRef = useRef<string | null>(null);
  const [ready, setReady] = useState(false);
  const [fallback, setFallback] = useState(false);
  const [busy, setBusy] = useState(false);
  const clientId = getGoogleClientId();

  useEffect(() => {
    if (!clientId || !hostRef.current) {
      setFallback(true);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        await loadGisScript();
        if (cancelled || !window.google?.accounts?.id || !hostRef.current) return;

        const { nonce, hashedNonce } = await createGoogleNonce();
        nonceRef.current = nonce;

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response: GisCredentialResponse) => {
            if (!response?.credential) return;
            setBusy(true);
            try {
              const { error } = await signInWithGoogleIdToken(
                response.credential,
                nonceRef.current || undefined
              );
              if (error) {
                onError?.(error.message || 'No se pudo entrar con Google');
                return;
              }
              onSuccess?.();
            } catch (e: unknown) {
              onError?.(e instanceof Error ? e.message : 'Error con Google');
            } finally {
              setBusy(false);
            }
          },
          nonce: hashedNonce,
          use_fedcm_for_prompt: true,
          context: 'signin',
        });

        hostRef.current.innerHTML = '';
        window.google.accounts.id.renderButton(hostRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          width: hostRef.current.offsetWidth || 320,
          locale: 'es',
        });
        setReady(true);
      } catch {
        setFallback(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [clientId, onError, onSuccess]);

  const triggerPrompt = async () => {
    if (!clientId) {
      onError?.(
        'Falta NEXT_PUBLIC_GOOGLE_CLIENT_ID. Configura Google Cloud (orígenes JS) y el Client ID en .env'
      );
      return;
    }
    setBusy(true);
    try {
      await loadGisScript();
      const { nonce, hashedNonce } = await createGoogleNonce();
      nonceRef.current = nonce;
      window.google?.accounts.id.initialize({
        client_id: clientId,
        callback: async (response: GisCredentialResponse) => {
          if (!response?.credential) {
            setBusy(false);
            return;
          }
          const { error } = await signInWithGoogleIdToken(response.credential, nonce);
          setBusy(false);
          if (error) {
            onError?.(error.message || 'No se pudo entrar con Google');
            return;
          }
          onSuccess?.();
        },
        nonce: hashedNonce,
        use_fedcm_for_prompt: true,
      });
      window.google?.accounts.id.prompt();
    } catch (e: unknown) {
      setBusy(false);
      onError?.(e instanceof Error ? e.message : 'Google no disponible');
    }
  };

  if (!clientId || fallback) {
    return (
      <button
        type="button"
        disabled={disabled || busy}
        onClick={triggerPrompt}
        style={{
          width: '100%',
          padding: '0.75rem',
          backgroundColor: '#fff',
          color: '#333',
          border: '1px solid #ddd',
          borderRadius: '8px',
          fontSize: '0.95rem',
          fontWeight: 500,
          cursor: disabled || busy ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.75rem',
        }}
      >
        <IconGoogle size={20} />
        <span>{busy ? 'Conectando…' : label}</span>
      </button>
    );
  }

  return (
    <div style={{ width: '100%', minHeight: 44, opacity: disabled || busy ? 0.6 : 1 }}>
      <div ref={hostRef} style={{ width: '100%', display: ready ? 'flex' : 'none', justifyContent: 'center' }} />
      {!ready && (
        <button
          type="button"
          disabled
          style={{
            width: '100%',
            padding: '0.75rem',
            border: '1px solid #ddd',
            borderRadius: '8px',
            background: '#fff',
            color: '#666',
          }}
        >
          Cargando Google…
        </button>
      )}
    </div>
  );
}

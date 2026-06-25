'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { trackEvent } from '@/lib/events/track';

function PromocionarExitoContent() {
  const params = useSearchParams();
  const orderId = params.get('order');
  const { session } = useAuth();
  const [status, setStatus] = useState<'loading' | 'ok' | 'pending' | 'error'>('loading');
  const trackedPurchase = useRef(false);

  useEffect(() => {
    if (status === 'ok' && orderId && !trackedPurchase.current) {
      trackedPurchase.current = true;
      trackEvent('promotion.purchased', {
        entityType: 'promotion',
        entityId: orderId,
        payload: { orderId },
      });
    }
  }, [status, orderId]);

  useEffect(() => {
    if (!orderId || !session?.access_token) {
      setStatus('pending');
      return;
    }

    let cancelled = false;
    const poll = async () => {
      try {
        const res = await fetch(`/api/adisos/promote/status?orderId=${orderId}`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const data = await res.json();
        if (cancelled) return;
        if (data.fulfilled) setStatus('ok');
        else if (data.status === 'paid' || data.status === 'pending') setStatus('pending');
        else setStatus('pending');
      } catch {
        if (!cancelled) setStatus('error');
      }
    };

    poll();
    const id = setInterval(poll, 3000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [orderId, session?.access_token]);

  return (
    <main className="min-h-[60vh] flex flex-col items-center justify-center px-6 text-center">
      {status === 'loading' && (
        <>
          <div className="w-10 h-10 border-2 border-[var(--brand-blue)] border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-[var(--text-secondary)]">Confirmando tu pago…</p>
        </>
      )}
      {status === 'ok' && (
        <>
          <p className="text-4xl mb-3">✅</p>
          <h1 className="text-xl font-bold text-[var(--text-primary)] mb-2">¡Promoción activada!</h1>
          <p className="text-sm text-[var(--text-secondary)] mb-6 max-w-sm">
            Tu anuncio ya aparece con mayor visibilidad en Buscadis.
          </p>
          <Link href="/" className="px-6 py-3 rounded-full bg-[var(--brand-blue)] text-white font-semibold">
            Ver mis resultados
          </Link>
        </>
      )}
      {(status === 'pending' || status === 'error') && (
        <>
          <p className="text-4xl mb-3">⏳</p>
          <h1 className="text-xl font-bold text-[var(--text-primary)] mb-2">Pago en proceso</h1>
          <p className="text-sm text-[var(--text-secondary)] mb-6 max-w-sm">
            Si ya pagaste, la promoción se activará en unos minutos. También puedes volver al inicio y revisar tu anuncio.
          </p>
          <Link href="/" className="px-6 py-3 rounded-full bg-[var(--brand-blue)] text-white font-semibold">
            Ir al inicio
          </Link>
        </>
      )}
    </main>
  );
}

export default function PromocionarExitoPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center">Cargando…</div>}>
      <PromocionarExitoContent />
    </Suspense>
  );
}

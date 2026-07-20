'use client';

/**
 * Publish gate + value reveal.
 * Real MercadoPago Checkout Pro for S/30; DEV stub when payments aren't configured.
 */
import { useState } from 'react';
import type { BusinessProfile } from '@/types/business';
import { supabase } from '@/lib/supabase';
import {
  PROFILE_PUBLISH_MONTHLY_PEN,
  PROFILE_PUBLISH_FEATURES,
} from '@/lib/business/subscription';

interface PublishGateModalProps {
  open: boolean;
  businessId: string;
  profile: Partial<BusinessProfile>;
  onClose: () => void;
  /** Called after the subscription is active (dev stub) so the caller can retry publishing. */
  onActivated: () => void;
}

export default function PublishGateModal({
  open,
  businessId,
  profile,
  onClose,
  onActivated,
}: PublishGateModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const getToken = async () => {
    const { data } = await supabase!.auth.getSession();
    const token = data?.session?.access_token;
    if (!token) throw new Error('Debes iniciar sesión');
    return token;
  };

  const tryDevActivate = async (token: string) => {
    const res = await fetch('/api/business/subscription/activate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ businessId }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'No se pudo activar');
    onActivated();
  };

  const upgrade = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();

      const res = await fetch('/api/business/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          businessId,
          slug: profile.slug,
        }),
      });
      const json = await res.json();

      if (res.ok && (json.initPoint || json.sandboxInitPoint)) {
        const useSandbox = process.env.NEXT_PUBLIC_MP_SANDBOX === 'true';
        window.location.href = useSandbox && json.sandboxInitPoint
          ? json.sandboxInitPoint
          : json.initPoint;
        return;
      }

      if (json.alreadyActive) {
        onActivated();
        return;
      }

      // Payments not configured → try DEV activate stub
      if (res.status === 503) {
        await tryDevActivate(token);
        return;
      }

      throw new Error(json.error || 'No se pudo iniciar el pago');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 text-center bg-gradient-to-br from-teal-600 to-cyan-500 text-white rounded-t-3xl">
          <p className="text-xs font-semibold uppercase tracking-wide opacity-90">Tu presencia digital está lista</p>
          <h2 className="text-2xl font-black mt-1 leading-tight">
            {profile.name && profile.name !== 'Mi negocio'
              ? profile.name
              : 'Tu negocio'}{' '}
            merece estar en línea
          </h2>
          <p className="text-sm opacity-95 mt-2">
            No es un perfil más: es tu tarjeta, tu catálogo y tu canal de ventas en un solo enlace.
          </p>
        </div>

        <div className="p-6 space-y-3">
          {PROFILE_PUBLISH_FEATURES.map((title) => (
            <div key={title} className="flex items-start gap-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-700 text-xs font-bold">
                ✓
              </span>
              <p className="text-sm font-semibold text-slate-800 leading-snug">{title}</p>
            </div>
          ))}

          <div className="rounded-2xl border border-teal-100 bg-teal-50 p-4 text-center mt-2">
            <p className="text-3xl font-black text-slate-900">
              S/{PROFILE_PUBLISH_MONTHLY_PEN}
              <span className="text-sm font-semibold text-slate-500">/mes</span>
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Crear y editar es gratis. Solo pagas al publicar.
            </p>
          </div>

          {error && <p className="text-xs text-rose-500 text-center">{error}</p>}

          <button
            type="button"
            onClick={upgrade}
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold disabled:opacity-60 transition-colors"
          >
            {loading ? 'Preparando pago…' : `Publicar por S/${PROFILE_PUBLISH_MONTHLY_PEN}/mes`}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 text-sm font-semibold text-slate-500 hover:text-slate-700"
          >
            Seguir editando gratis
          </button>
        </div>
      </div>
    </div>
  );
}

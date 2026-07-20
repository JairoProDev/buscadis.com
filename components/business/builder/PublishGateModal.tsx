'use client';

/**
 * Publish gate + value reveal.
 *
 * Shown when a free-tier owner tries to make their profile public. Frames the
 * profile as a high-value asset (digital card + linktree + sales channel +
 * landing page) to create FOMO, then offers the S/30/month upgrade. Uses the
 * dev activation stub when enabled; otherwise points to checkout.
 */
import { useState } from 'react';
import type { BusinessProfile } from '@/types/business';
import { supabase } from '@/lib/supabase';
import { PROFILE_PUBLISH_MONTHLY_PEN } from '@/lib/business/subscription';

interface PublishGateModalProps {
  open: boolean;
  businessId: string;
  profile: Partial<BusinessProfile>;
  onClose: () => void;
  /** Called after the subscription is active so the caller can retry publishing. */
  onActivated: () => void;
}

const VALUE_POINTS = [
  { icon: '💳', title: 'Tu tarjeta de presentación digital', desc: 'Un solo enlace con todo tu negocio, siempre a la mano.' },
  { icon: '🔗', title: 'Tu linktree y más', desc: 'Redes, WhatsApp, ubicación y catálogo en un solo lugar.' },
  { icon: '🛍️', title: 'Tu canal de ventas', desc: 'Catálogo interactivo que convierte visitas en clientes.' },
  { icon: '🚀', title: 'Tu landing page profesional', desc: 'Compártela donde quieras: es tu presencia digital.' },
];

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

  const upgrade = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await supabase!.auth.getSession();
      const token = data?.session?.access_token;
      if (!token) throw new Error('Debes iniciar sesión');

      const res = await fetch('/api/business/subscription/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ businessId }),
      });
      const json = await res.json();
      if (!res.ok) {
        // Real checkout isn't wired here yet; guide the user.
        throw new Error(
          json.error ||
            'El pago aún no está disponible. Escríbenos por WhatsApp para activar tu suscripción.'
        );
      }
      onActivated();
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
        <div className="p-6 text-center bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white rounded-t-3xl">
          <p className="text-xs font-semibold uppercase tracking-wide opacity-90">Tu perfil está listo</p>
          <h2 className="text-2xl font-black mt-1">
            {profile.name || 'Tu negocio'} merece estar en línea
          </h2>
          <p className="text-sm opacity-90 mt-2">
            Ya lo creaste y personalizaste. Publícalo para que todos lo vean.
          </p>
        </div>

        <div className="p-6 space-y-3">
          {VALUE_POINTS.map((v) => (
            <div key={v.title} className="flex items-start gap-3">
              <span className="text-xl shrink-0">{v.icon}</span>
              <div>
                <p className="text-sm font-bold text-slate-800">{v.title}</p>
                <p className="text-xs text-slate-500">{v.desc}</p>
              </div>
            </div>
          ))}

          <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4 text-center mt-2">
            <p className="text-3xl font-black text-slate-900">
              S/{PROFILE_PUBLISH_MONTHLY_PEN}
              <span className="text-sm font-semibold text-slate-500">/mes</span>
            </p>
            <p className="text-xs text-slate-500 mt-1">Crear y editar es gratis. Solo pagas al publicar.</p>
          </div>

          {error && <p className="text-xs text-rose-500 text-center">{error}</p>}

          <button
            type="button"
            onClick={upgrade}
            disabled={loading}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white font-bold disabled:opacity-60"
          >
            {loading ? 'Activando…' : 'Publicar y suscribirme'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 text-sm font-semibold text-slate-500 hover:text-slate-700"
          >
            Seguir editando
          </button>
        </div>
      </div>
    </div>
  );
}

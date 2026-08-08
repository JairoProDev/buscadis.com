'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

interface ProfileAnalyticsWidgetProps {
  businessProfileId?: string;
}

/**
 * P14 lite — el dueño entiende la primera semana sin explicación.
 * Visitas · WhatsApp · QR (últimos 7 días).
 */
export default function ProfileAnalyticsWidget({ businessProfileId }: ProfileAnalyticsWidgetProps) {
  const [stats, setStats] = useState({ views: 0, whatsapp: 0, qrScans: 0 });
  const [loading, setLoading] = useState(true);
  const { session } = useAuth();

  useEffect(() => {
    if (!businessProfileId) return;
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    void (async () => {
      try {
        const { data } = await supabase!
          .from('page_analytics')
          .select('event_type')
          .eq('business_profile_id', businessProfileId)
          .gte('created_at', weekAgo.toISOString());
        const rows = data || [];
        setStats({
          views: rows.filter((r) => r.event_type === 'page_view' || r.event_type === 'profile_view')
            .length,
          whatsapp: rows.filter((r) => r.event_type === 'whatsapp_click').length,
          qrScans: rows.filter((r) => r.event_type === 'qr_scan').length,
        });
      } catch {
        /* RLS or offline */
      } finally {
        setLoading(false);
      }
    })();
  }, [businessProfileId]);

  useEffect(() => {
    if (!businessProfileId || !session?.access_token) return;
    void (async () => {
      try {
        const { data: bp } = await supabase!
          .from('business_profiles')
          .select('slug')
          .eq('id', businessProfileId)
          .maybeSingle();
        if (!bp?.slug) return;
        const res = await fetch(
          `/api/business/${encodeURIComponent(bp.slug)}/qr-analytics?days=7`,
          {
            credentials: 'include',
            headers: { Authorization: `Bearer ${session.access_token}` },
          }
        );
        if (res.ok) {
          const data = await res.json();
          setStats((s) => ({ ...s, qrScans: data.periodScans ?? s.qrScans }));
        }
      } catch {
        /* */
      }
    })();
  }, [businessProfileId, session?.access_token]);

  if (!businessProfileId) return null;

  const cards = [
    {
      label: 'Visitas',
      value: stats.views,
      hint: 'Personas que abrieron tu perfil',
    },
    {
      label: 'WhatsApp',
      value: stats.whatsapp,
      hint: 'Clics para escribirte',
    },
    {
      label: 'QR',
      value: stats.qrScans,
      hint: 'Escaneos de tu código',
    },
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 space-y-3">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-[15px] font-bold text-slate-800">Últimos 7 días</p>
        {loading && <span className="text-[11px] text-slate-400">Cargando…</span>}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-xl bg-slate-50 px-2 py-3 text-center"
            title={c.hint}
          >
            <p className="text-xl font-black tabular-nums text-slate-900">{c.value}</p>
            <p className="text-[11px] font-semibold text-slate-500 mt-0.5">{c.label}</p>
          </div>
        ))}
      </div>
      <p className="text-[12px] text-slate-500 leading-snug">
        Si las visitas suben pero WhatsApp no, revisa que tu número esté bien y que el botón diga
        algo claro (“Escribir por WhatsApp”).
      </p>
    </div>
  );
}

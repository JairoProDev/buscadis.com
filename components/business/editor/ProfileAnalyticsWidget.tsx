'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

interface ProfileAnalyticsWidgetProps {
  businessProfileId?: string;
}

type Period = 7 | 30;

/**
 * P14/P18 lite — 7 o 30 días + tip de conversión.
 * El dueño entiende el informe sin explicación.
 */
export default function ProfileAnalyticsWidget({ businessProfileId }: ProfileAnalyticsWidgetProps) {
  const [period, setPeriod] = useState<Period>(7);
  const [stats, setStats] = useState({ views: 0, whatsapp: 0, qrScans: 0 });
  const [loading, setLoading] = useState(true);
  const { session } = useAuth();

  useEffect(() => {
    if (!businessProfileId) return;
    setLoading(true);
    const since = new Date();
    since.setDate(since.getDate() - period);

    void (async () => {
      try {
        const { data } = await supabase!
          .from('page_analytics')
          .select('event_type')
          .eq('business_profile_id', businessProfileId)
          .gte('created_at', since.toISOString());
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
  }, [businessProfileId, period]);

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
          `/api/business/${encodeURIComponent(bp.slug)}/qr-analytics?days=${period}`,
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
  }, [businessProfileId, session?.access_token, period]);

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

  const conv =
    stats.views > 0 ? Math.round((stats.whatsapp / stats.views) * 100) : null;

  let tip =
    'Si las visitas suben pero WhatsApp no, revisa que tu número esté bien y que el botón diga algo claro (“Escribir por WhatsApp”).';
  if (stats.whatsapp >= 3 && stats.views > 0) {
    tip =
      'Tuviste contactos por WhatsApp. En Confianza → Pedir reseñas, mándales el enlace de 5 segundos (o espera el aviso a las ~48 h).';
  } else if (stats.qrScans > stats.whatsapp && stats.qrScans > 0) {
    tip =
      'El QR trae visitas. Asegúrate de que el perfil muestre precios y el botón de WhatsApp bien visible.';
  } else if (conv != null && conv < 5 && stats.views >= 10) {
    tip =
      'Hay visitas pero pocos clics a WhatsApp. Prueba una promo vigente o un producto con precio claro arriba.';
  }

  const informe =
    period === 30
      ? `En 30 días: ${stats.views} visitas, ${stats.whatsapp} WhatsApp, ${stats.qrScans} QR.`
      : `Esta semana: ${stats.views} visitas, ${stats.whatsapp} WhatsApp, ${stats.qrScans} QR.`;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[15px] font-bold text-slate-800">Tu informe</p>
        <div className="flex rounded-lg border border-slate-200 p-0.5">
          {([7, 30] as Period[]).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setPeriod(d)}
              className={`min-h-[36px] px-2.5 rounded-md text-[12px] font-semibold ${
                period === d ? 'bg-slate-900 text-white' : 'text-slate-600'
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>
      {loading && <span className="text-[11px] text-slate-400">Cargando…</span>}
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
      {conv != null ? (
        <p className="text-[12px] font-semibold text-slate-700">
          Conversión visita → WhatsApp: {conv}%
        </p>
      ) : null}
      <p className="text-[12px] text-slate-600 leading-snug">{informe}</p>
      <p className="text-[12px] text-slate-500 leading-snug">{tip}</p>
    </div>
  );
}

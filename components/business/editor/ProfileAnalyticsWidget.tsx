'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

interface ProfileAnalyticsWidgetProps {
  businessProfileId?: string;
}

type Period = 7 | 30;

/**
 * Commerce OS — visitas + intents + pedidos (no solo vanity).
 */
export default function ProfileAnalyticsWidget({ businessProfileId }: ProfileAnalyticsWidgetProps) {
  const [period, setPeriod] = useState<Period>(7);
  const [stats, setStats] = useState({
    views: 0,
    whatsapp: 0,
    qrScans: 0,
    intents: 0,
    orders: 0,
  });
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
          intents: rows.filter(
            (r) =>
              r.event_type === 'purchase_intent' ||
              r.event_type === 'add_to_cart' ||
              r.event_type === 'product_view'
          ).length,
          orders: rows.filter(
            (r) =>
              r.event_type === 'order_created' ||
              r.event_type === 'order_paid' ||
              r.event_type === 'order_confirmed'
          ).length,
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
    { label: 'Visitas', value: stats.views, hint: 'Personas que abrieron tu vitrina' },
    { label: 'Intents', value: stats.intents, hint: 'Vieron producto / agregaron / pidieron' },
    { label: 'Pedidos', value: stats.orders, hint: 'Pedidos creados o pagados' },
    { label: 'WhatsApp', value: stats.whatsapp, hint: 'Clics al handoff' },
  ];

  const tip =
    stats.orders > 0
      ? 'Ya tienes pedidos medibles. Revisa /mi-negocio/pedidos y marca los pagados (Yape/Plin).'
      : stats.intents > 0 && stats.orders === 0
        ? 'Hay interés (intents) pero aún no pedidos. Asegura precios claros y el botón Agregar al pedido.'
        : 'Completa 3 productos con precio + WhatsApp para abrir la vitrina que vende.';

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[15px] font-bold text-slate-800">Tu vitrina</p>
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
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
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
      <p className="text-[12px] text-slate-600 leading-snug">{tip}</p>
      <Link
        href="/mi-negocio/pedidos"
        className="inline-flex text-[13px] font-bold text-teal-800 min-h-10 items-center"
      >
        Ver pedidos →
      </Link>
    </div>
  );
}
